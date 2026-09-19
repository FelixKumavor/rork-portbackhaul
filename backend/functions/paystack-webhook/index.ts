import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

/**
 * paystack-webhook
 *
 * Public endpoint called by Paystack. It is NOT protected by a user JWT —
 * authenticity is established solely by verifying the `x-paystack-signature`
 * HMAC-SHA512 header against the raw request body using the Paystack secret
 * key, which exists only as a server-side Supabase secret.
 *
 * Guarantees:
 *  - requests without a valid signature are rejected with 401
 *  - processing is idempotent: the provider event id is recorded in
 *    payment_events with a unique constraint, so a replayed webhook is a no-op
 *  - payment status is only advanced after the event is verified
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-paystack-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface PaystackEvent {
  event: string;
  data: {
    id?: number | string;
    reference?: string;
    status?: string;
    amount?: number;
    currency?: string;
    gateway_response?: string;
    metadata?: Record<string, unknown>;
  };
}

/** Constant-time comparison to avoid leaking signature information by timing. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function admin() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const secretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
  if (!secretKey) {
    console.error("PAYSTACK_SECRET_KEY is not configured — rejecting webhook");
    return new Response(JSON.stringify({ error: "Provider not configured" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // The signature covers the RAW body — read it as text before parsing.
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";

  const expected = createHmac("sha512", secretKey).update(rawBody).digest("hex");

  if (!signature || !timingSafeEqual(signature, expected)) {
    console.error("Rejected Paystack webhook with invalid signature");
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let event: PaystackEvent;
  try {
    event = JSON.parse(rawBody) as PaystackEvent;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid payload" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = admin();
  const reference = event.data?.reference ?? null;
  const providerEventId = String(event.data?.id ?? reference ?? "");

  if (!providerEventId) {
    return new Response(JSON.stringify({ error: "Missing event identifier" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ---- idempotency gate -------------------------------------------------
  const { data: existing } = await supabase
    .from("payment_events")
    .select("id")
    .eq("provider", "PAYSTACK")
    .eq("provider_event_id", providerEventId)
    .maybeSingle();

  if (existing) {
    // Already processed — acknowledge without repeating any state change.
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ---- resolve the payment ---------------------------------------------
  let paymentId: string | null = null;
  let tripId: string | null = null;

  if (reference) {
    const { data: payment } = await supabase
      .from("payments")
      .select("id, trip_id, status, amount_ghs")
      .eq("provider_reference", reference)
      .maybeSingle();

    if (payment) {
      paymentId = payment.id;
      tripId = payment.trip_id;

      if (event.event === "charge.success" && event.data.status === "success") {
        // Only advance a payment that has not already been settled.
        if (["PENDING", "AUTHORIZED", "FAILED"].includes(payment.status)) {
          const { error: updateError } = await supabase
            .from("payments")
            .update({
              status: "HELD", // held until delivery conditions are satisfied
              paid_at: new Date().toISOString(),
              failure_reason: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", payment.id);

          if (updateError) console.error("Failed to mark payment paid", updateError.message);
        }
      } else if (
        event.event === "charge.failed" ||
        (event.data.status && ["failed", "abandoned", "reversed"].includes(event.data.status))
      ) {
        await supabase
          .from("payments")
          .update({
            status: "FAILED",
            failure_reason: event.data.gateway_response ?? "Payment failed at provider",
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.id);
      } else if (event.event === "refund.processed") {
        await supabase
          .from("payments")
          .update({ status: "REFUNDED", updated_at: new Date().toISOString() })
          .eq("id", payment.id);
      }
    } else {
      console.error(`No payment matches Paystack reference ${reference}`);
    }
  }

  // ---- record the event (unique constraint enforces idempotency) --------
  const { error: eventError } = await supabase.from("payment_events").insert({
    payment_id: paymentId,
    provider: "PAYSTACK",
    provider_event_id: providerEventId,
    event_type: event.event,
    payload: event as unknown as Record<string, unknown>,
  });

  if (eventError && !eventError.message.includes("duplicate key")) {
    console.error("Failed to record payment event", eventError.message);
  }

  await supabase.from("audit_logs").insert({
    actor_id: null,
    actor_role: "system",
    action: `PAYMENT_WEBHOOK_${event.event.toUpperCase().replace(/\./g, "_")}`,
    entity_type: "payment",
    entity_id: paymentId,
    trip_id: tripId,
    metadata: { reference, status: event.data?.status ?? null },
  });

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
