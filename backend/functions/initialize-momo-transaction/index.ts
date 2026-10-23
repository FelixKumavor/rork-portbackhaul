// initialize-momo-transaction
//
// Function A of the MoMo verification flow.
//  action "save"       — register the user's MoMo number + network. No payment
//                        is initiated and the record is NOT marked verified.
//  action "initialize" — initiate a small (GHS 1.00) MoMo charge to the
//                        submitted number. The subscriber must approve the
//                        prompt on their handset, which is Paystack's supported
//                        way of establishing control of that number. Success is
//                        never assumed here — verify-momo-transaction (or the
//                        webhook) confirms it against Paystack.
//
// Phone numbers are normalised to 0XXXXXXXXX (Ghana) server-side; networks are
// validated against the canonical MTN / TELECEL / AIRTEL_TIGO set.
import {
  AppError,
  authorize,
  corsHeaders,
  createAdminClient,
  errorResponse,
  json,
  requireAuth,
  writeAudit,
} from "../_shared/auth.ts";
import {
  MOMO_NETWORKS,
  canonicalNetwork,
  isMomoNetwork,
  normalizeGhanaPhone,
  paystackFetch,
  paystackSecretKey,
  type PaystackChargeData,
} from "../_shared/paystack.ts";

/** GHS 1.00 in pesewas — the smallest meaningful MoMo charge for verification. */
export const VERIFICATION_AMOUNT_PESEWAS = 100;

interface Body {
  action?: "save" | "initialize";
  momo_phone?: unknown;
  momo_network?: unknown;
  full_name?: unknown;
}

interface MethodRow {
  id: string;
  verification_status: string;
  momo_phone: string;
  momo_network: string;
}

function verificationReference(): string {
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `PBV-${Date.now()}-${rand}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const user = await requireAuth(req);
    const admin = createAdminClient();
    const profile = await authorize(admin, user.id);
    const body = (await req.json().catch(() => ({}))) as Body;

    // ---- server-side validation of the submitted details -------------------
    const phone = normalizeGhanaPhone(body.momo_phone);
    if (!phone) throw new AppError("INVALID_PHONE_NUMBER", 400);
    if (!isMomoNetwork(body.momo_network ?? "")) throw new AppError("UNSUPPORTED_NETWORK", 400);
    const network = canonicalNetwork(body.momo_network as string);
    const fullName =
      typeof body.full_name === "string" && body.full_name.trim()
        ? body.full_name.trim().slice(0, 120)
        : (profile.full_name ?? "").slice(0, 120);

    const { data: existing } = await admin
      .from("user_payment_methods")
      .select("id, verification_status, momo_phone, momo_network")
      .eq("user_id", user.id)
      .maybeSingle();

    const action = body.action ?? "save";
    const method = await upsertMethod(admin, user.id, fullName, phone, network, existing as MethodRow | null);

    if (action === "save") {
      // Registering a number never verifies it.
      await writeAudit(admin, {
        actorId: user.id,
        actorRole: profile.role,
        action: "MOMO_DETAILS_SAVED",
        entityType: "user_payment_method",
        entityId: method.id,
        metadata: { momo_network: network },
      });
      return json({ saved: true, verification_status: method.verification_status });
    }

    // ---- action === "initialize": the supported verification charge --------
    if (method.verification_status === "VERIFIED") {
      throw new AppError("ALREADY_VERIFIED", 409);
    }

    const secret = paystackSecretKey();
    if (!secret) throw new AppError("PAYSTACK_NOT_CONFIGURED", 503);

    const email = user.email ?? profile.email ?? `${user.id}@users.portbackhaul.app`;
    const reference = verificationReference();
    const charge = await paystackFetch<PaystackChargeData>("/charge", {
      method: "POST",
      body: {
        email,
        amount: VERIFICATION_AMOUNT_PESEWAS,
        currency: "GHS",
        reference,
        mobile_money: { phone, provider: MOMO_NETWORKS[network].chargeProvider },
        metadata: { kind: "momo_verification", payment_method_id: method.id, user_id: user.id },
      },
    });

    if (!charge.ok || !charge.data) {
      // Do not leave the record claiming a charge is in flight.
      await admin
        .from("user_payment_methods")
        .update({ verification_status: "FAILED", updated_at: new Date().toISOString() })
        .eq("id", method.id)
        .in("verification_status", ["NOT_VERIFIED", "PENDING"]);
      // Provider messages are client-safe (Paystack sends them to payers);
      // the secret key and request internals never leave this function.
      return json({ error: "INITIALIZATION_FAILED", message: charge.message ?? null }, 502);
    }

    const providerStatus = charge.data.status ?? "pending";
    const nextStatus = providerStatus === "failed" ? "FAILED" : "PENDING";

    const { error: updateError } = await admin
      .from("user_payment_methods")
      .update({
        paystack_transaction_reference: reference,
        verification_status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", method.id);

    if (updateError) {
      console.error("Failed to attach verification reference", updateError.message);
      throw new AppError("INITIALIZATION_FAILED", 500);
    }

    await writeAudit(admin, {
      actorId: user.id,
      actorRole: profile.role,
      action: "MOMO_VERIFICATION_INITIALIZED",
      entityType: "user_payment_method",
      entityId: method.id,
      metadata: { reference, provider_status: providerStatus, momo_network: network },
    });

    // Success here means the charge was INITIATED — never that the number is
    // verified. The client must poll verify-momo-transaction until Paystack
    // (via verify or webhook) confirms the approved charge.
    return json({
      reference,
      provider_status: providerStatus,
      display_text: charge.data.display_text ?? null,
      verification_status: nextStatus,
      amount_pesewas: VERIFICATION_AMOUNT_PESEWAS,
    });
  } catch (err) {
    return errorResponse(err);
  }
});

async function upsertMethod(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  fullName: string,
  phone: string,
  network: string,
  existing: MethodRow | null,
): Promise<MethodRow> {
  if (!existing) {
    const { data, error } = await admin
      .from("user_payment_methods")
      .insert({
        user_id: userId,
        full_name: fullName,
        momo_phone: phone,
        momo_network: network,
        verification_status: "NOT_VERIFIED",
      })
      .select("id, verification_status, momo_phone, momo_network")
      .single();
    if (error || !data) throw new AppError("PAYMENT_METHOD_SAVE_FAILED", 500);
    return data as MethodRow;
  }

  const changed = existing.momo_phone !== phone || existing.momo_network !== network;
  // A changed number/network invalidates any previous verification result.
  const patch: Record<string, unknown> = {
    full_name: fullName,
    momo_phone: phone,
    momo_network: network,
    updated_at: new Date().toISOString(),
  };
  if (changed) {
    patch.verification_status = "NOT_VERIFIED";
    patch.verified_at = null;
    patch.paystack_transaction_reference = null;
    patch.paystack_customer_code = null;
  }

  const { data, error } = await admin
    .from("user_payment_methods")
    .update(patch)
    .eq("id", existing.id)
    .select("id, verification_status, momo_phone, momo_network")
    .single();
  if (error || !data) throw new AppError("PAYMENT_METHOD_SAVE_FAILED", 500);
  return data as MethodRow;
}
