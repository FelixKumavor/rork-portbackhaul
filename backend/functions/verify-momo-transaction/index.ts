// verify-momo-transaction
//
// Function B of the MoMo verification flow.
// Accepts the verification reference from the client, verifies it directly
// against Paystack's API (never trusting the frontend), confirms the charge
// belongs to the authenticated user, checks amount and currency, and only then
// marks the user's payment method VERIFIED. Safe to call repeatedly while
// polling: PENDING stays PENDING, VERIFIED is idempotent, FAILED is terminal.
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
import { paystackFetch, type PaystackChargeData } from "../_shared/paystack.ts";

const VERIFICATION_AMOUNT_PESEWAS = 100;

interface VerifyData extends PaystackChargeData {
  customer?: { customer_code?: string | null };
  metadata?: { kind?: string; user_id?: string; payment_method_id?: string };
}

interface MethodRow {
  id: string;
  verification_status: string;
  paystack_transaction_reference: string | null;
  verified_at: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const user = await requireAuth(req);
    const admin = createAdminClient();
    await authorize(admin, user.id);

    const body = (await req.json().catch(() => ({}))) as { reference?: unknown };
    const reference = typeof body.reference === "string" ? body.reference.trim() : "";
    if (!reference) throw new AppError("REFERENCE_REQUIRED", 400);

    // The reference must belong to the authenticated user's own record.
    const { data: method } = await admin
      .from("user_payment_methods")
      .select("id, verification_status, paystack_transaction_reference, verified_at")
      .eq("user_id", user.id)
      .eq("paystack_transaction_reference", reference)
      .maybeSingle();
    const row = method as MethodRow | null;

    if (!row) throw new AppError("NOT_FOUND", 404);
    if (row.verification_status === "VERIFIED") {
      return json({ status: "VERIFIED", verified_at: row.verified_at });
    }
    if (row.verification_status === "FAILED") {
      return json({ status: "FAILED" });
    }

    // ---- authoritative verification against Paystack -----------------------
    const result = await paystackFetch<VerifyData>(`/charge/verify/${encodeURIComponent(reference)}`);
    if (!result.ok || !result.data) {
      // Provider unreachable or reference unknown: stay PENDING, never fail
      // the number because of a transient API problem.
      return json({ status: row.verification_status, error: "VERIFICATION_UNAVAILABLE" }, 502);
    }

    const data = result.data;
    const metadata = data.metadata ?? {};

    if (data.status === "success") {
      // Tamper checks: amount, currency, purpose and ownership must all hold.
      const ownershipValid = metadata.kind === "momo_verification" && metadata.user_id === user.id;
      const amountValid = Number(data.amount) === VERIFICATION_AMOUNT_PESEWAS;
      const currencyValid = data.currency === "GHS";

      if (!ownershipValid || !amountValid || !currencyValid) {
        await admin
          .from("user_payment_methods")
          .update({
            verification_status: "FAILED",
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        await writeAudit(admin, {
          actorId: user.id,
          action: "MOMO_VERIFICATION_CRITERIA_FAILED",
          entityType: "user_payment_method",
          entityId: row.id,
          metadata: { reference, ownershipValid, amountValid, currencyValid },
        });
        return json({ status: "FAILED" });
      }

      const verifiedAt = new Date().toISOString();
      await admin
        .from("user_payment_methods")
        .update({
          verification_status: "VERIFIED",
          verified_at: verifiedAt,
          paystack_customer_code: data.customer?.customer_code ?? null,
          updated_at: verifiedAt,
        })
        .eq("id", row.id)
        .in("verification_status", ["PENDING", "FAILED"]);

      await writeAudit(admin, {
        actorId: user.id,
        action: "MOMO_VERIFICATION_CONFIRMED",
        entityType: "user_payment_method",
        entityId: row.id,
        metadata: { reference, confirmed_by: "verify" },
      });
      return json({ status: "VERIFIED", verified_at: verifiedAt });
    }

    if (data.status === "failed" || data.status === "reversed") {
      await admin
        .from("user_payment_methods")
        .update({
          verification_status: "FAILED",
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id)
        .in("verification_status", ["PENDING"]);
      await writeAudit(admin, {
        actorId: user.id,
        action: "MOMO_VERIFICATION_FAILED",
        entityType: "user_payment_method",
        entityId: row.id,
        metadata: { reference, gateway_response: data.gateway_response ?? null },
      });
      return json({ status: "FAILED", reason: data.gateway_response ?? null });
    }

    // still pending (approval prompt not answered / OTP stage) — keep waiting
    return json({ status: "PENDING", provider_status: data.status ?? null });
  } catch (err) {
    return errorResponse(err);
  }
});
