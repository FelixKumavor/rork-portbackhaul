import "jsr:@supabase/functions-js/edge-runtime.d.ts";
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
 * reputation-api — user mutations for the Reputation & Loyalty system.
 * All reads happen directly from the client under RLS; this function owns the
 * mutations that need business rules:
 *   redeem  — spend Elite Circle points on a catalogue reward
 *   appeal  — challenge a violation or a verified reputation event
 *   referral — submit a referral code (validated, self-referral blocked)
 *   verify-cancellation — accepts/keeps a cancellation penalty is admin-only;
 *     users can never call this.
 */

interface Body {
  action?: string;
  reward_id?: string;
  violation_id?: string;
  event_id?: string;
  reason?: string;
  evidence_url?: string;
  code?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "INVALID_ACTION" }, 405);
  try {
    const user = await requireAuth(req);
    const admin = createAdminClient();
    const profile = await authorize(admin, user.id);
    const body = (await req.json().catch(() => ({}))) as Body;

    switch (body.action) {
      case "redeem":
        return json(await redeem(admin, user.id, profile, body));
      case "appeal":
        return json(await appeal(admin, user.id, body));
      case "referral":
        return json(await submitReferral(admin, user.id, body));
      default:
        return json({ error: "INVALID_ACTION" }, 400);
    }
  } catch (err) {
    return errorResponse(err);
  }
});

async function redeem(admin: ReturnType<typeof createAdminClient>, userId: string, profile: { role: string }, body: Body) {
  if (!body.reward_id) throw new AppError("INVALID_ACTION", 400);

  const { data: reward, error: rewardError } = await admin
    .from("reward_catalogue")
    .select("id, title, cost_points, role_scope, min_membership_level, active")
    .eq("id", body.reward_id)
    .maybeSingle();
  if (rewardError || !reward) throw new AppError("NOT_FOUND", 404);
  if (!reward.active) throw new AppError("REWARD_UNAVAILABLE", 400);

  const { data: rep, error: repError } = await admin
    .from("user_reputation")
    .select("loyalty_points, membership_level, account_standing")
    .eq("user_id", userId)
    .single();
  if (repError || !rep) throw new AppError("NOT_FOUND", 404);
  if (rep.account_standing === "SUSPENDED" || rep.account_standing === "TERMINATED") {
    throw new AppError("ACCOUNT_SUSPENDED", 403);
  }
  if (reward.role_scope && reward.role_scope !== profile.role) {
    throw new AppError("REWARD_NOT_FOR_ROLE", 400);
  }

  const LEVELS = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"];
  if (LEVELS.indexOf(rep.membership_level) < LEVELS.indexOf(reward.min_membership_level)) {
    throw new AppError("MEMBERSHIP_TOO_LOW", 403);
  }
  if (rep.loyalty_points < reward.cost_points) throw new AppError("INSUFFICIENT_POINTS", 400);

  const reference = `REDEEM:${reward.id}:${Date.now()}`;
  const { error: spendError } = await admin.rpc("award_loyalty_points", {
    p_user_id: userId,
    p_points: -reward.cost_points,
    p_txn_type: "REDEEM",
    p_reference_id: reference,
    p_description: `Redeemed reward: ${reward.title}`,
  });
  if (spendError) throw new AppError("REDEMPTION_FAILED", 500);

  const { data: redemption, error: insertError } = await admin
    .from("reward_redemptions")
    .insert({
      user_id: userId,
      reward_id: reward.id,
      points_spent: reward.cost_points,
      status: "PENDING",
      reference_id: reference,
    })
    .select("id, status, points_spent, created_at")
    .single();
  if (insertError) throw new AppError("REDEMPTION_FAILED", 500);

  await writeAudit(admin, {
    actorId: userId,
    actorRole: profile.role,
    action: "LOYALTY_REDEEM",
    entityType: "reward_redemption",
    entityId: redemption.id,
    metadata: { reward_id: reward.id, points: reward.cost_points },
  });

  await admin.from("notifications").insert({
    user_id: userId,
    event_type: "LOYALTY_REDEMPTION",
    title: "Reward redemption received",
    body: `Your request for "${reward.title}" (${reward.cost_points} points) is pending fulfilment.`,
  });

  return { redemption, remaining_points: rep.loyalty_points - reward.cost_points };
}

async function appeal(admin: ReturnType<typeof createAdminClient>, userId: string, body: Body) {
  if (!body.reason || body.reason.trim().length < 20) {
    throw new AppError("APPEAL_REASON_REQUIRED", 400);
  }

  let violationId = body.violation_id ?? null;
  let description = "";
  if (violationId) {
    const { data: violation, error } = await admin
      .from("user_violations")
      .select("id, user_id, status")
      .eq("id", violationId)
      .maybeSingle();
    if (error || !violation || violation.user_id !== userId) {
      throw new AppError("RESOURCE_NOT_AUTHORIZED", 403);
    }
    if (violation.status === "DISMISSED") throw new AppError("APPEAL_ALREADY_RESOLVED", 409);
  } else if (body.event_id) {
    // Appeal a reputation event (e.g. a verified cancellation deduction).
    const { data: event, error } = await admin
      .from("reputation_events")
      .select("id, user_id, description, verification_status")
      .eq("id", body.event_id)
      .maybeSingle();
    if (error || !event || event.user_id !== userId) {
      throw new AppError("RESOURCE_NOT_AUTHORIZED", 403);
    }
    if (event.verification_status !== "VERIFIED") throw new AppError("APPEAL_NOT_POSSIBLE", 400);
    // Events are appealed through a synthetic violation reviewed by an admin.
    const { data: synthetic, error: synError } = await admin
      .from("user_violations")
      .insert({
        user_id: userId,
        violation_type: "REPEATED_MISCONDUCT",
        severity: "LEVEL_1",
        description: `Appeal against reputation event: ${event.description}`,
        evidence_url: body.evidence_url ?? null,
        status: "UNDER_REVIEW",
      })
      .select("id")
      .single();
    if (synError) throw new AppError("APPEAL_FAILED", 500);
    violationId = synthetic.id;
    description = event.description;
  } else {
    throw new AppError("APPEAL_TARGET_REQUIRED", 400);
  }

  const { data: existing, error: dupError } = await admin
    .from("user_appeals")
    .select("id, status")
    .eq("violation_id", violationId)
    .maybeSingle();
  if (existing) throw new AppError("APPEAL_ALREADY_SUBMITTED", 409);
  if (dupError && dupError.code !== "PGRST116") throw new AppError("APPEAL_FAILED", 500);

  const { data: row, error: insertError } = await admin
    .from("user_appeals")
    .insert({
      user_id: userId,
      violation_id: violationId,
      appeal_reason: body.reason.trim(),
      evidence_url: body.evidence_url ?? null,
    })
    .select("id, status, created_at")
    .single();
  if (insertError) throw new AppError("APPEAL_FAILED", 500);

  if (description) {
    await admin
      .from("user_violations")
      .update({ status: "UNDER_REVIEW", updated_at: new Date().toISOString() })
      .eq("id", violationId);
  }

  await writeAudit(admin, {
    actorId: userId,
    action: "APPEAL_SUBMITTED",
    entityType: "user_appeal",
    entityId: row.id,
    metadata: { violation_id: violationId, subject: description || "violation" },
  });

  return { appeal: row };
}

async function submitReferral(admin: ReturnType<typeof createAdminClient>, userId: string, body: Body) {
  const raw = (body.code ?? "").trim().toUpperCase();
  if (!raw) throw new AppError("REFERRAL_CODE_REQUIRED", 400);

  if (raw.length > 16 || !/^PB[A-Z0-9]{4,8}$/.test(raw)) throw new AppError("REFERRAL_CODE_INVALID", 400);

  const { data: referrerRep, error: repError } = await admin
    .from("user_reputation")
    .select("user_id")
    .eq("referral_code", raw)
    .maybeSingle();
  if (repError || !referrerRep) throw new AppError("REFERRAL_CODE_INVALID", 400);
  if (referrerRep.user_id === userId) throw new AppError("REFERRAL_SELF_NOT_ALLOWED", 400);

  const { error: insertError } = await admin
    .from("referrals")
    .insert({ referrer_id: referrerRep.user_id, referred_user_id: userId, status: "PENDING" });
  if (insertError) {
    if (insertError.code === "23505") throw new AppError("REFERRAL_ALREADY_LINKED", 409);
    throw new AppError("REFERRAL_FAILED", 500);
  }

  await writeAudit(admin, {
    actorId: userId,
    action: "REFERRAL_SUBMITTED",
    entityType: "referral",
    entityId: referrerRep.user_id,
    metadata: { code: raw },
  });

  return { status: "PENDING", message: "Referral recorded. Your referrer earns points once you are verified." };
}
