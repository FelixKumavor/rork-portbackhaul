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

/**
 * payments-api
 *
 * All payment state transitions happen here with the service role. The client
 * has no INSERT/UPDATE policy on payments or payouts, so this function is the
 * only path that can move money-related state.
 *
 * The Paystack secret key is read from the server-side environment only and is
 * never returned to, or embedded in, the client bundle.
 */

const PAYSTACK_BASE = "https://api.paystack.co";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const user = await requireAuth(req);
    const admin = createAdminClient();
    const body = (await req.json()) as {
      action?: string;
      trip_id?: string;
      payment_id?: string;
      payout_id?: string;
      callback_url?: string;
    };

    const profile = await authorize(admin, user.id, { requireApproved: true });
    const secretKey = Deno.env.get("PAYSTACK_SECRET_KEY");

    switch (body.action) {
      // ---------------------------------------------------------------
      case "initialize": {
        if (!body.trip_id) throw new AppError("RESOURCE_NOT_AUTHORIZED", 400);

        const { data: payment } = await admin
          .from("payments")
          .select("id, trip_id, payer_id, amount_ghs, status, provider_reference")
          .eq("trip_id", body.trip_id)
          .maybeSingle();

        if (!payment) throw new AppError("RESOURCE_NOT_AUTHORIZED", 404);
        if (payment.payer_id !== user.id) throw new AppError("RESOURCE_NOT_AUTHORIZED", 403);
        if (!["PENDING", "FAILED"].includes(payment.status)) {
          throw new AppError("INVALID_STATUS_TRANSITION", 409);
        }

        const reference = `PB-${payment.id.slice(0, 8)}-${Date.now()}`;

        if (!secretKey) {
          // Provider not configured yet: record the intent, never fake a payment.
          await admin
            .from("payments")
            .update({ provider_reference: reference, updated_at: new Date().toISOString() })
            .eq("id", payment.id);

          await writeAudit(admin, {
            actorId: user.id,
            actorRole: profile.role,
            action: "PAYMENT_INITIALIZE_UNCONFIGURED",
            entityType: "payment",
            entityId: payment.id,
            tripId: payment.trip_id,
            metadata: { reference },
          });

          return json({ authorization_url: null, reference, simulated: false, provider_configured: false });
        }

        const response = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: profile.email ?? user.email,
            // Paystack expects the minor unit (pesewas).
            amount: Math.round(Number(payment.amount_ghs) * 100),
            currency: "GHS",
            reference,
            callback_url: body.callback_url ?? undefined,
            metadata: { payment_id: payment.id, trip_id: payment.trip_id },
          }),
        });

        const result = (await response.json()) as {
          status?: boolean;
          message?: string;
          data?: { authorization_url?: string };
        };

        if (!response.ok || !result.status) {
          console.error("Paystack initialize failed", result.message);
          await admin
            .from("payments")
            .update({ status: "FAILED", failure_reason: result.message ?? "Provider error" })
            .eq("id", payment.id);
          throw new AppError("PAYMENT_PROVIDER_ERROR", 502);
        }

        await admin
          .from("payments")
          .update({
            provider_reference: reference,
            status: "AUTHORIZED",
            authorized_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.id);

        await writeAudit(admin, {
          actorId: user.id,
          actorRole: profile.role,
          action: "PAYMENT_INITIALIZED",
          entityType: "payment",
          entityId: payment.id,
          tripId: payment.trip_id,
          metadata: { reference },
        });

        return json({
          authorization_url: result.data?.authorization_url ?? null,
          reference,
          simulated: false,
          provider_configured: true,
        });
      }

      // ---------------------------------------------------------------
      case "request_release": {
        if (!body.payment_id) throw new AppError("RESOURCE_NOT_AUTHORIZED", 400);

        const { data: payment } = await admin
          .from("payments")
          .select("id, trip_id, payer_id, status")
          .eq("id", body.payment_id)
          .maybeSingle();

        if (!payment) throw new AppError("RESOURCE_NOT_AUTHORIZED", 404);
        if (payment.payer_id !== user.id) throw new AppError("RESOURCE_NOT_AUTHORIZED", 403);
        if (!["PAID", "HELD"].includes(payment.status)) throw new AppError("INVALID_STATUS_TRANSITION", 409);

        await admin
          .from("payments")
          .update({ status: "RELEASE_REQUESTED", updated_at: new Date().toISOString() })
          .eq("id", payment.id);

        await writeAudit(admin, {
          actorId: user.id,
          actorRole: profile.role,
          action: "PAYMENT_RELEASE_REQUESTED",
          entityType: "payment",
          entityId: payment.id,
          tripId: payment.trip_id,
        });

        return json({ ok: true });
      }

      // ---------------------------------------------------------------
      case "request_payout": {
        if (!body.payout_id) throw new AppError("RESOURCE_NOT_AUTHORIZED", 400);

        const { data: payout } = await admin
          .from("payouts")
          .select("id, trip_id, recipient_id, status")
          .eq("id", body.payout_id)
          .maybeSingle();

        if (!payout) throw new AppError("RESOURCE_NOT_AUTHORIZED", 404);
        if (payout.recipient_id !== user.id) throw new AppError("RESOURCE_NOT_AUTHORIZED", 403);
        if (payout.status !== "PENDING") throw new AppError("INVALID_STATUS_TRANSITION", 409);

        await admin
          .from("payouts")
          .update({
            status: "REQUESTED",
            requested_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", payout.id);

        await writeAudit(admin, {
          actorId: user.id,
          actorRole: profile.role,
          action: "PAYOUT_REQUESTED",
          entityType: "payout",
          entityId: payout.id,
          tripId: payout.trip_id,
        });

        return json({ ok: true });
      }

      // ---------------------------------------------------------------
      case "admin_release": {
        await authorize(admin, user.id, { roles: ["ADMIN"], permission: "PAYMENT_MANAGE" });
        if (!body.payment_id) throw new AppError("RESOURCE_NOT_AUTHORIZED", 400);

        const { data: payment } = await admin
          .from("payments")
          .select("id, trip_id, status")
          .eq("id", body.payment_id)
          .maybeSingle();

        if (!payment) throw new AppError("RESOURCE_NOT_AUTHORIZED", 404);
        if (!["HELD", "RELEASE_REQUESTED"].includes(payment.status)) {
          throw new AppError("INVALID_STATUS_TRANSITION", 409);
        }

        await admin
          .from("payments")
          .update({
            status: "RELEASED",
            released_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.id);

        await admin
          .from("payouts")
          .update({ status: "APPROVED", updated_at: new Date().toISOString() })
          .eq("payment_id", payment.id)
          .in("status", ["PENDING", "REQUESTED"]);

        await writeAudit(admin, {
          actorId: user.id,
          actorRole: "ADMIN",
          action: "PAYMENT_RELEASED",
          entityType: "payment",
          entityId: payment.id,
          tripId: payment.trip_id,
        });

        return json({ ok: true });
      }

      default:
        throw new AppError("INVALID_ACTION", 400);
    }
  } catch (err) {
    return errorResponse(err);
  }
});
