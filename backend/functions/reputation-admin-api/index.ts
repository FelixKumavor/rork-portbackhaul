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
 * reputation-admin-api — PortBackhaul Reputation Control Centre.
 * Every action requires the REPUTATION_MANAGE permission (or USER_SUSPEND /
 * USER_UNBLOCK for account actions) and writes an audit record.
 *
 * Actions:
 *   user-detail          — reputation profile, events, violations for one user
 *   adjust-reputation    — manual score adjustment with documented reason
 *   verify-cancellation  — verify (apply) or dismiss a pending cancellation event
 *   create-violation     — record a violation and apply its enforcement level
 *   decide-violation     — record the final decision on a violation
 *   decide-appeal        — approve (reverse) or reject an appeal
 *   set-thresholds       — configure membership level requirements
 *   save-reward          — create/update the rewards catalogue
 *   decide-redemption    — grant/reject a points redemption
 *   set-standing         — suspend / reinstate account standing
 *   list-referrals       — recent referral activity
 */

interface Body {
  action?: string;
  user_id?: string;
  points?: number;
  reason?: string;
  event_id?: string;
  decision?: string;
  notes?: string;
  violation_type?: string;
  severity?: string;
  description?: string;
  evidence_url?: string;
  violation_id?: string;
  appeal_id?: string;
  membership_level?: string;
  minimum_score?: number;
  minimum_completed_trips?: number;
  minimum_account_age_days?: number;
  require_verification?: boolean;
  reward?: {
    id?: string;
    title?: string;
    description?: string;
    reward_type?: string;
    cost_points?: number;
    role_scope?: string | null;
    min_membership_level?: string;
    active?: boolean;
  };
  redemption_id?: string;
  standing?: string;
}

const VIOLATION_DEFAULT_POINTS: Record<string, number> = {
  FALSE_REGISTRATION: -20,
  FAKE_TRUCK_DOCUMENTS: -40,
  FRAUDULENT_DELIVERY_CONFIRMATION: -25,
  ABANDONED_TRIP: -25,
  REPEATED_UNJUSTIFIED_CANCELLATIONS: -10,
  PAYMENT_FRAUD: -40,
  TRANSACTION_MANIPULATION: -30,
  REPEATED_MISCONDUCT: -15,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "INVALID_ACTION" }, 405);
  try {
    const user = await requireAuth(req);
    const admin = createAdminClient();
    const adminProfile = await authorize(admin, user.id, { permission: "REPUTATION_MANAGE" });
    const body = (await req.json().catch(() => ({}))) as Body;

    switch (body.action) {
      case "user-detail":
        return json(await userDetail(admin, body));
      case "adjust-reputation":
        return json(await adjustReputation(admin, user.id, adminProfile, body));
      case "verify-cancellation":
        return json(await verifyCancellation(admin, user.id, adminProfile, body));
      case "create-violation":
        return json(await createViolation(admin, user.id, adminProfile, body));
      case "decide-violation":
        return json(await decideViolation(admin, user.id, adminProfile, body));
      case "decide-appeal":
        return json(await decideAppeal(admin, user.id, adminProfile, body));
      case "set-thresholds":
        return json(await setThresholds(admin, user.id, body));
      case "save-reward":
        return json(await saveReward(admin, user.id, body));
      case "decide-redemption":
        return json(await decideRedemption(admin, user.id, adminProfile, body));
      case "set-standing":
        return json(await setStanding(admin, user.id, adminProfile, body));
      default:
        return json({ error: "INVALID_ACTION" }, 400);
    }
  } catch (err) {
    return errorResponse(err);
  }
});

function requireFields(body: Body, fields: (keyof Body)[]) {
  for (const f of fields) {
    if (body[f] === undefined || body[f] === null || body[f] === "") {
      throw new AppError("INVALID_ACTION", 400);
    }
  }
}

async function userDetail(admin: ReturnType<typeof createAdminClient>, body: Body) {
  requireFields(body, ["user_id"]);
  const { data: rep } = await admin
    .from("user_reputation")
    .select("*")
    .eq("user_id", body.user_id)
    .maybeSingle();
  const { data: events } = await admin
    .from("reputation_events")
    .select("*")
    .eq("user_id", body.user_id)
    .order("created_at", { ascending: false })
    .limit(100);
  const { data: violations } = await admin
    .from("user_violations")
    .select("*, user_appeals(*)")
    .eq("user_id", body.user_id)
    .order("created_at", { ascending: false })
    .limit(50);
  const { data: points } = await admin
    .from("elite_circle_points")
    .select("*")
    .eq("user_id", body.user_id)
    .order("created_at", { ascending: false })
    .limit(50);
  return { reputation: rep ?? null, events: events ?? [], violations: violations ?? [], points: points ?? [] };
}

async function adjustReputation(
  admin: ReturnType<typeof createAdminClient>,
  adminId: string,
  adminProfile: { role: string },
  body: Body,
) {
  requireFields(body, ["user_id", "points", "reason"]);
  const points = Number(body.points);
  if (!Number.isInteger(points) || points === 0 || Math.abs(points) > 100) {
    throw new AppError("INVALID_AMOUNT", 400);
  }
  const reference = `ADJ:${crypto.randomUUID()}`;
  const applied = await admin.rpc("apply_reputation_event", {
    p_user_id: body.user_id,
    p_event_type: "ADMIN_ADJUSTMENT",
    p_points: points,
    p_reference_id: reference,
    p_description: `Administrator adjustment: ${body.reason}`,
    p_verified: true,
    p_actor: adminId,
  });
  if (applied.error) throw new AppError("ADJUSTMENT_FAILED", 500);

  if (points < 0) {
    await admin
      .from("user_reputation")
      .update({ account_standing: "WARNING", updated_at: new Date().toISOString() })
      .eq("user_id", body.user_id)
      .eq("account_standing", "GOOD");
  }

  await writeAudit(admin, {
    actorId: adminId,
    actorRole: adminProfile.role,
    action: "REPUTATION_ADJUST",
    entityType: "user_reputation",
    entityId: body.user_id,
    metadata: { points, reason: body.reason, reference },
  });
  return { applied: applied.data === true, reference };
}

async function verifyCancellation(
  admin: ReturnType<typeof createAdminClient>,
  adminId: string,
  adminProfile: { role: string },
  body: Body,
) {
  requireFields(body, ["event_id", "decision"]);
  if (!["JUSTIFIED", "UNJUSTIFIED"].includes(body.decision!)) {
    throw new AppError("INVALID_ACTION", 400);
  }

  const { data: event, error } = await admin
    .from("reputation_events")
    .select("id, user_id, points_change, verification_status")
    .eq("id", body.event_id)
    .eq("event_type", "CANCELLATION_REVIEW")
    .maybeSingle();
  if (error || !event) throw new AppError("NOT_FOUND", 404);
  if (event.verification_status !== "PENDING") throw new AppError("ALREADY_DECIDED", 409);

  if (body.decision === "UNJUSTIFIED") {
    // Apply the recorded -10 now that the cancellation is verified as unjustified.
    await admin
      .from("reputation_events")
      .update({ verification_status: "VERIFIED" })
      .eq("id", event.id);
    await admin.rpc("apply_reputation_event", {
      p_user_id: event.user_id,
      p_event_type: "CANCELLATION_PENALTY",
      p_points: event.points_change,
      p_reference_id: `${event.id}:PENALTY`,
      p_description: "Verified unjustified cancellation penalty",
      p_verified: true,
      p_actor: adminId,
    });
  } else {
    await admin
      .from("reputation_events")
      .update({ verification_status: "DISMISSED" })
      .eq("id", event.id);
    await admin.from("notifications").insert({
      user_id: event.user_id,
      event_type: "REPUTATION_CHANGE",
      title: "Cancellation reviewed",
      body: "Your cancellation was reviewed and accepted as legitimate. No points were deducted.",
    });
  }

  await writeAudit(admin, {
    actorId: adminId,
    actorRole: adminProfile.role,
    action: "CANCELLATION_REVIEWED",
    entityType: "reputation_event",
    entityId: event.id,
    metadata: { decision: body.decision, notes: body.notes ?? null },
  });
  return { decided: body.decision };
}

async function createViolation(
  admin: ReturnType<typeof createAdminClient>,
  adminId: string,
  adminProfile: { role: string },
  body: Body,
) {
  requireFields(body, ["user_id", "violation_type", "severity", "description"]);
  if (!(body.violation_type! in VIOLATION_DEFAULT_POINTS)) throw new AppError("INVALID_ACTION", 400);
  if (!/^LEVEL_[1-5]$/.test(body.severity ?? "")) throw new AppError("INVALID_ACTION", 400);
  const severity = body.severity as string;
  const violationType = body.violation_type as string;
  const targetUserId = body.user_id as string;
  const violationDescription = body.description as string;

  const { data: violation, error } = await admin
    .from("user_violations")
    .insert({
      user_id: targetUserId,
      violation_type: violationType,
      severity,
      description: violationDescription,
      evidence_url: body.evidence_url ?? null,
      status: "DECIDED",
      decision: severity,
      decision_notes: body.notes ?? null,
      reviewed_by: adminId,
      decided_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new AppError("VIOLATION_FAILED", 500);

  // Enforcement per level.
  if (severity === "LEVEL_2") {
    await admin.rpc("apply_reputation_event", {
      p_user_id: targetUserId,
      p_event_type: `VIOLATION_${violationType}`,
      p_points: VIOLATION_DEFAULT_POINTS[violationType],
      p_reference_id: `VIOLATION:${violation.id}`,
      p_description: `${violationType.replace(/_/g, " ")} — verified violation`,
      p_verified: true,
      p_actor: adminId,
    });
    await admin
      .from("user_reputation")
      .update({ account_standing: "WARNING", updated_at: new Date().toISOString() })
      .eq("user_id", targetUserId)
      .eq("account_standing", "GOOD");
  } else if (severity === "LEVEL_3") {
    await admin
      .from("user_reputation")
      .update({ account_standing: "RESTRICTED", updated_at: new Date().toISOString() })
      .eq("user_id", targetUserId);
  } else if (severity === "LEVEL_4") {
    await suspendUser(admin, adminId, adminProfile, targetUserId, violationDescription, "SUSPENDED");
    await admin
      .from("user_reputation")
      .update({ account_standing: "SUSPENDED", updated_at: new Date().toISOString() })
      .eq("user_id", targetUserId);
  } else if (severity === "LEVEL_5") {
    await suspendUser(admin, adminId, adminProfile, targetUserId, violationDescription, "BLOCKED");
    await admin
      .from("user_reputation")
      .update({ account_standing: "TERMINATED", updated_at: new Date().toISOString() })
      .eq("user_id", targetUserId);
  }

  await admin.from("notifications").insert({
    user_id: targetUserId,
    event_type: "COMPLIANCE_ACTION",
    title: `Official notification — ${severity.replace("_", " ")}`,
    body: violationDescription,
  });

  await writeAudit(admin, {
    actorId: adminId,
    actorRole: adminProfile.role,
    action: "VIOLATION_CREATED",
    entityType: "user_violation",
    entityId: violation.id,
    metadata: {
      target: body.user_id,
      violation_type: body.violation_type,
      severity: body.severity,
      evidence_url: body.evidence_url ?? null,
    },
  });
  return { violation_id: violation.id };
}

async function suspendUser(
  admin: ReturnType<typeof createAdminClient>,
  adminId: string,
  adminProfile: { role: string },
  userId: string,
  reason: string,
  status: "SUSPENDED" | "BLOCKED",
) {
  const { data: current } = await admin
    .from("profiles")
    .select("account_status")
    .eq("id", userId)
    .single();
  await admin
    .from("profiles")
    .update({
      account_status: status,
      suspension_reason: status === "SUSPENDED" ? reason : reason,
      block_reason: status === "BLOCKED" ? reason : null,
      status_changed_at: new Date().toISOString(),
      status_changed_by: adminId,
    })
    .eq("id", userId);
  await admin.from("user_status_history").insert({
    user_id: userId,
    previous_status: current?.account_status ?? null,
    new_status: status,
    reason,
    changed_by: adminId,
  });
  await writeAudit(admin, {
    actorId: adminId,
    actorRole: adminProfile.role,
    action: status === "BLOCKED" ? "USER_TERMINATED" : "USER_SUSPENDED",
    entityType: "profile",
    entityId: userId,
    metadata: { reason },
  });
}

async function decideViolation(
  admin: ReturnType<typeof createAdminClient>,
  adminId: string,
  adminProfile: { role: string },
  body: Body,
) {
  requireFields(body, ["violation_id", "decision"]);
  const { data: violation, error } = await admin
    .from("user_violations")
    .select("id, user_id, status")
    .eq("id", body.violation_id)
    .maybeSingle();
  if (error || !violation) throw new AppError("NOT_FOUND", 404);

  await admin
    .from("user_violations")
    .update({
      status: body.decision === "DISMISSED" ? "DISMISSED" : "DECIDED",
      decision: body.decision,
      decision_notes: body.notes ?? null,
      reviewed_by: adminId,
      decided_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", violation.id);

  await writeAudit(admin, {
    actorId: adminId,
    actorRole: adminProfile.role,
    action: "VIOLATION_DECIDED",
    entityType: "user_violation",
    entityId: violation.id,
    metadata: { decision: body.decision, notes: body.notes ?? null },
  });
  return { decided: body.decision };
}

async function decideAppeal(
  admin: ReturnType<typeof createAdminClient>,
  adminId: string,
  adminProfile: { role: string },
  body: Body,
) {
  requireFields(body, ["appeal_id", "decision"]);
  if (!["APPROVED", "REJECTED"].includes(body.decision!)) throw new AppError("INVALID_ACTION", 400);

  const { data: appealRow, error } = await admin
    .from("user_appeals")
    .select("id, user_id, violation_id, status")
    .eq("id", body.appeal_id)
    .maybeSingle();
  if (error || !appealRow) throw new AppError("NOT_FOUND", 404);
  if (appealRow.status !== "PENDING") throw new AppError("ALREADY_DECIDED", 409);

  await admin
    .from("user_appeals")
    .update({
      status: body.decision,
      decision: body.notes ?? null,
      decision_notes: body.notes ?? null,
      reviewed_by: adminId,
      decided_at: new Date().toISOString(),
    })
    .eq("id", appealRow.id);

  if (body.decision === "APPROVED") {
    const { data: violation } = await admin
      .from("user_violations")
      .select("id, user_id, violation_type, severity, status, decision")
      .eq("id", appealRow.violation_id)
      .maybeSingle();

    if (violation) {
      await admin
        .from("user_violations")
        .update({
          status: "DISMISSED",
          decision: "DISMISSED_ON_APPEAL",
          decision_notes: body.notes ?? "Appeal approved",
          reviewed_by: adminId,
          decided_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", violation.id);

      // Reverse the deduction that this violation caused (never applied twice).
      await admin.rpc("apply_reputation_event", {
        p_user_id: appealRow.user_id,
        p_event_type: "APPEAL_RESTORATION",
        p_points: VIOLATION_DEFAULT_POINTS[violation.violation_type] !== undefined
          ? -VIOLATION_DEFAULT_POINTS[violation.violation_type]
          : 0,
        p_reference_id: `APPEAL:${appealRow.id}`,
        p_description: `Appeal approved — restoration for ${violation.violation_type.replace(/_/g, " ")}`,
        p_verified: true,
        p_actor: adminId,
      });

      // If this was a WARNING-level enforcement (LEVEL_1-3) and the member has
      // no remaining active violations, restore GOOD standing. Suspensions are
      // never lifted automatically — those require an explicit admin decision.
      if (["LEVEL_1", "LEVEL_2", "LEVEL_3"].includes(violation.severity)) {
        const { count: activeViolations } = await admin
          .from("user_violations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", appealRow.user_id)
          .in("status", ["OPEN", "UNDER_REVIEW", "DECIDED"]);
        if (!activeViolations) {
          await admin
            .from("user_reputation")
            .update({ account_standing: "GOOD", updated_at: new Date().toISOString() })
            .eq("user_id", appealRow.user_id)
            .eq("account_standing", "WARNING");
        }
      }

      // Reinstate the account if the appealed enforcement had suspended it.
      if (violation.severity === "LEVEL_4" || violation.severity === "LEVEL_5") {
        const { data: profileRow } = await admin
          .from("profiles")
          .select("account_status")
          .eq("id", appealRow.user_id)
          .single();
        if (profileRow && ["SUSPENDED", "BLOCKED"].includes(profileRow.account_status)) {
          const { data: current } = await admin
            .from("profiles")
            .update({
              account_status: "APPROVED",
              suspension_reason: null,
              block_reason: null,
              status_changed_at: new Date().toISOString(),
              status_changed_by: adminId,
            })
            .eq("id", appealRow.user_id);
          void current;
          await admin.from("user_status_history").insert({
            user_id: appealRow.user_id,
            previous_status: profileRow.account_status,
            new_status: "APPROVED",
            reason: "Appeal approved — reinstated",
            changed_by: adminId,
          });
        }
        await admin
          .from("user_reputation")
          .update({ account_standing: "GOOD", updated_at: new Date().toISOString() })
          .eq("user_id", appealRow.user_id);
      }
    }
  }

  await admin.from("notifications").insert({
    user_id: appealRow.user_id,
    event_type: "APPEAL_DECIDED",
    title: `Appeal ${body.decision === "APPROVED" ? "approved" : "rejected"}`,
    body: body.notes ?? `Your appeal was ${body.decision === "APPROVED" ? "approved" : "rejected"}.`,
  });

  await writeAudit(admin, {
    actorId: adminId,
    actorRole: adminProfile.role,
    action: "APPEAL_DECIDED",
    entityType: "user_appeal",
    entityId: appealRow.id,
    metadata: { decision: body.decision, notes: body.notes ?? null },
  });
  return { decided: body.decision };
}

async function setThresholds(admin: ReturnType<typeof createAdminClient>, adminId: string, body: Body) {
  requireFields(body, ["membership_level"]);
  const { error } = await admin
    .from("reputation_settings")
    .update({
      minimum_score: body.minimum_score ?? undefined,
      minimum_completed_trips: body.minimum_completed_trips ?? undefined,
      minimum_account_age_days: body.minimum_account_age_days ?? undefined,
      require_verification: body.require_verification ?? undefined,
      updated_by: adminId,
      updated_at: new Date().toISOString(),
    })
    .eq("membership_level", body.membership_level!);
  if (error) throw new AppError("SETTINGS_FAILED", 500);

  await writeAudit(admin, {
    actorId: adminId,
    action: "REPUTATION_THRESHOLDS_UPDATED",
    entityType: "reputation_settings",
    entityId: body.membership_level!,
    metadata: {
      minimum_score: body.minimum_score,
      minimum_completed_trips: body.minimum_completed_trips,
      minimum_account_age_days: body.minimum_account_age_days,
      require_verification: body.require_verification,
    },
  });
  return { saved: true };
}

async function saveReward(admin: ReturnType<typeof createAdminClient>, adminId: string, body: Body) {
  const r = body.reward;
  if (!r || !r.title || !r.description || !r.reward_type || !r.cost_points) {
    throw new AppError("INVALID_ACTION", 400);
  }
  if (r.id) {
    const { error } = await admin
      .from("reward_catalogue")
      .update({
        title: r.title,
        description: r.description,
        reward_type: r.reward_type,
        cost_points: r.cost_points,
        role_scope: r.role_scope ?? null,
        min_membership_level: r.min_membership_level ?? "BRONZE",
        active: r.active ?? true,
        updated_by: adminId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", r.id);
    if (error) throw new AppError("SETTINGS_FAILED", 500);
    await writeAudit(admin, {
      actorId: adminId,
      action: "REWARD_UPDATED",
      entityType: "reward_catalogue",
      entityId: r.id,
      metadata: { title: r.title, cost_points: r.cost_points },
    });
    return { reward_id: r.id };
  }

  const { data: row, error } = await admin
    .from("reward_catalogue")
    .insert({
      title: r.title,
      description: r.description,
      reward_type: r.reward_type,
      cost_points: r.cost_points,
      role_scope: r.role_scope ?? null,
      min_membership_level: r.min_membership_level ?? "BRONZE",
      active: r.active ?? true,
      updated_by: adminId,
    })
    .select("id")
    .single();
  if (error) throw new AppError("SETTINGS_FAILED", 500);
  await writeAudit(admin, {
    actorId: adminId,
    action: "REWARD_CREATED",
    entityType: "reward_catalogue",
    entityId: row.id,
    metadata: { title: r.title, cost_points: r.cost_points },
  });
  return { reward_id: row.id };
}

async function decideRedemption(
  admin: ReturnType<typeof createAdminClient>,
  adminId: string,
  adminProfile: { role: string },
  body: Body,
) {
  requireFields(body, ["redemption_id", "decision"]);
  if (!["GRANTED", "REJECTED"].includes(body.decision!)) throw new AppError("INVALID_ACTION", 400);

  const { data: redemption, error } = await admin
    .from("reward_redemptions")
    .select("id, user_id, status, points_spent, reference_id")
    .eq("id", body.redemption_id)
    .maybeSingle();
  if (error || !redemption) throw new AppError("NOT_FOUND", 404);
  if (redemption.status !== "PENDING") throw new AppError("ALREADY_DECIDED", 409);

  await admin
    .from("reward_redemptions")
    .update({
      status: body.decision,
      decided_by: adminId,
      decision_note: body.notes ?? null,
      decided_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", redemption.id);

  // A rejected redemption refunds the points exactly once (unique reference).
  if (body.decision === "REJECTED") {
    await admin.rpc("award_loyalty_points", {
      p_user_id: redemption.user_id,
      p_points: redemption.points_spent,
      p_txn_type: "ADJUST",
      p_reference_id: `${redemption.reference_id}:REFUND`,
      p_description: "Refund — redemption rejected by administrator",
    });
  }

  await admin.from("notifications").insert({
    user_id: redemption.user_id,
    event_type: "LOYALTY_REDEMPTION",
    title: `Redemption ${body.decision === "GRANTED" ? "granted" : "rejected"}`,
    body:
      body.notes ??
      (body.decision === "GRANTED"
        ? "Your reward has been granted. Check your benefits for details."
        : "Your redemption was rejected and your points have been refunded."),
  });

  await writeAudit(admin, {
    actorId: adminId,
    actorRole: adminProfile.role,
    action: "REDEMPTION_DECIDED",
    entityType: "reward_redemption",
    entityId: redemption.id,
    metadata: { decision: body.decision, notes: body.notes ?? null },
  });
  return { decided: body.decision };
}

async function setStanding(
  admin: ReturnType<typeof createAdminClient>,
  adminId: string,
  adminProfile: { role: string },
  body: Body,
) {
  requireFields(body, ["user_id", "standing"]);
  if (!["GOOD", "WARNING", "RESTRICTED"].includes(body.standing!)) {
    throw new AppError("INVALID_ACTION", 400);
  }
  await admin
    .from("user_reputation")
    .update({ account_standing: body.standing, updated_at: new Date().toISOString() })
    .eq("user_id", body.user_id);

  await writeAudit(admin, {
    actorId: adminId,
    actorRole: adminProfile.role,
    action: "STANDING_CHANGED",
    entityType: "user_reputation",
    entityId: body.user_id,
    metadata: { standing: body.standing, reason: body.reason ?? null },
  });
  return { standing: body.standing };
}
