import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  BadgeCheck,
  ClipboardCheck,
  Gift,
  Gavel,
  History,
  Loader2,
  Share2,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { MembershipBadge, RequirementBar, TrustScoreRing } from "@/components/reputation/MembershipBadge";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Seo } from "@/components/Seo";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { describeError, describeFunctionError } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";
import { ROLE_LABEL, type Role } from "@/lib/roles";
import {
  LEVEL_LABEL,
  LEVEL_TAGLINE,
  type MembershipThreshold,
  type ReputationEvent,
  nextLevelProgress,
  trustRates,
  useTrustProfile,
} from "@/lib/reputation";

interface ViolationRow {
  id: string;
  violation_type: string;
  severity: string;
  description: string;
  status: string;
  decision: string | null;
  decision_notes: string | null;
  created_at: string;
  user_appeals: { id: string; status: string; appeal_reason: string; created_at: string }[] | null;
}

interface AppealRow {
  id: string;
  violation_id: string;
  appeal_reason: string;
  status: string;
  decision: string | null;
  decision_notes: string | null;
  created_at: string;
}

const RATE_LABELS: {
  key: "completion" | "onTime" | "cancellation" | "paymentCompliance" | "satisfaction";
  label: string;
}[] = [
  { key: "completion", label: "Trip completion" },
  { key: "onTime", label: "On-time performance" },
  { key: "cancellation", label: "Cancellation rate" },
  { key: "paymentCompliance", label: "Payment compliance" },
  { key: "satisfaction", label: "Customer satisfaction" },
];

export default function TrustProfilePage() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const repQuery = useTrustProfile(Boolean(user?.id));

  const { data: thresholds } = useQuery({
    queryKey: ["membership-thresholds"],
    queryFn: async (): Promise<MembershipThreshold[]> => {
      const { data, error } = await supabase
        .from("reputation_settings")
        .select(
          "membership_level, minimum_score, minimum_completed_trips, minimum_account_age_days, require_verification, active",
        )
        .eq("active", true);
      if (error) throw new Error(describeError(error));
      return (data ?? []) as MembershipThreshold[];
    },
  });

  const { data: events } = useQuery({
    queryKey: ["reputation-events"],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<ReputationEvent[]> => {
      const { data, error } = await supabase
        .from("reputation_events")
        .select("id, event_type, points_change, description, verification_status, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw new Error(describeError(error));
      return (data ?? []) as ReputationEvent[];
    },
  });

  const { data: violations } = useQuery({
    queryKey: ["my-violations"],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<ViolationRow[]> => {
      const { data, error } = await supabase
        .from("user_violations")
        .select("*, user_appeals(id, status, appeal_reason, created_at)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw new Error(describeError(error));
      return (data ?? []) as unknown as ViolationRow[];
    },
  });

  const { data: myAppeals } = useQuery({
    queryKey: ["my-appeals"],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<AppealRow[]> => {
      const { data, error } = await supabase
        .from("user_appeals")
        .select("id, violation_id, appeal_reason, status, decision, decision_notes, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw new Error(describeError(error));
      return (data ?? []) as AppealRow[];
    },
  });

  const [appealTarget, setAppealTarget] = useState<{ violationId?: string; eventId?: string; label: string } | null>(null);
  const [appealReason, setAppealReason] = useState("");
  const [appealEvidence, setAppealEvidence] = useState("");

  const submitAppeal = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("reputation-api", {
        body: {
          action: "appeal",
          violation_id: appealTarget?.violationId,
          event_id: appealTarget?.eventId,
          reason: appealReason,
          evidence_url: appealEvidence || undefined,
        },
      });
      if (error) throw new Error(await describeFunctionError(error));
    },
    onSuccess: () => {
      toast.success("Appeal submitted for administrator review");
      setAppealTarget(null);
      setAppealReason("");
      setAppealEvidence("");
      void queryClient.invalidateQueries({ queryKey: ["my-appeals"] });
    },
    onError: (e) => toast.error(describeError(e)),
  });

  if (!user || !profile) return null;

  const rep = repQuery.data;
  const rates = trustRates(rep);
  const progress = nextLevelProgress(rep, thresholds);
  const nextLevel = progress?.nextLevel;
  const violationList = violations ?? [];

  return (
    <div className="mx-auto w-full max-w-[1000px] animate-fade space-y-7">
      <Seo
        title="PortBackhaul Trust Profile · PortBackhaul"
        description="Your verified trust score, performance rates and membership standing."
        path="/app/trust"
        noIndex
      />

      <PageHeader
        eyebrow="PortBackhaul Trust Profile"
        title="Trust Profile"
        subtitle={`Your verified digital reputation as ${ROLE_LABEL[profile.role as Role] ?? profile.role}. Every figure is calculated from verified historical records.`}
        meta={rep ? <MembershipBadge level={rep.membership_level} size="lg" /> : null}
      />

      {/* ---------- headline: score + rates ---------- */}
      <section className="panel p-6">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-3">
            <TrustScoreRing score={rep?.trust_score ?? 50} level={rep?.membership_level ?? "BRONZE"} size={140} />
            <p className="text-xs text-muted-foreground">Overall Trust Score</p>
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <MembershipBadge level={rep?.membership_level} />
              <span className="text-sm font-medium text-foreground">
                {LEVEL_TAGLINE[rep?.membership_level ?? "BRONZE"]}
              </span>
              {rep?.account_standing !== "GOOD" ? <StatusBadge status={rep?.account_standing ?? "GOOD"} raw /> : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {RATE_LABELS.map(({ key, label }) => (
                <RateBar key={key} label={label} value={rates[key]} inverse={key === "cancellation"} />
              ))}
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-border pt-3 font-mono text-xs tabular-nums text-muted-foreground">
              <span>
                Total successful trips: <strong className="text-foreground">{rep?.completed_trips ?? 0}</strong>
              </span>
              <span>
                On-time deliveries: <strong className="text-foreground">{rep?.on_time_deliveries ?? 0}</strong>
              </span>
              <span>
                Cancelled trips: <strong className="text-foreground">{rep?.cancelled_trips ?? 0}</strong>
              </span>
              <span className="inline-flex items-center gap-1">
                <BadgeCheck
                  className={`h-3.5 w-3.5 ${profile.verification_status === "VERIFIED" ? "text-status-verified" : "text-muted-foreground"}`}
                  aria-hidden
                />
                Verified account: <strong className="text-foreground">{profile.verification_status === "VERIFIED" ? "Yes" : "Pending"}</strong>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- progress to next level ---------- */}
      <section className="panel p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold">{nextLevel ? `Progress to ${LEVEL_LABEL[nextLevel]}` : "Top tier reached"}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {nextLevel
                ? "Membership is calculated automatically from your trust score, completed trips, account verification and history. It cannot be purchased or manually upgraded."
                : "You hold the highest membership tier on the platform."}
            </p>
          </div>
          <Award className="h-5 w-5 shrink-0 text-[#C08A2E]" aria-hidden />
        </div>

        {progress ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <RequirementBar
              label="Trust score"
              value={String(rep?.trust_score ?? 0)}
              target={`${progress.scoreTarget}`}
              pct={progress.scorePct}
              achieved={(rep?.trust_score ?? 0) >= progress.scoreTarget}
            />
            <RequirementBar
              label="Successful trips"
              value={String(rep?.completed_trips ?? 0)}
              target={`${progress.tripsTarget}`}
              pct={progress.tripsPct}
              achieved={(rep?.completed_trips ?? 0) >= progress.tripsTarget}
            />
            {progress.verificationNeeded && profile.verification_status !== "VERIFIED" ? (
              <p className="text-xs text-status-pending sm:col-span-2">
                {LEVEL_LABEL[nextLevel]} also requires a verified account. Submit your verification documents from your
                profile page.
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      {/* ---------- Elite Circle referral ---------- */}
      <section className="panel p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold">PortBackhaul Elite Circle</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Earn loyalty points for completed trips and for referring verified professionals. Share your personal
              referral code.
            </p>
          </div>
          <Button variant="outline" onClick={() => void copyReferral(rep?.referral_code ?? "")} disabled={!rep}>
            <Share2 className="mr-2 h-4 w-4" />
            Share code
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="rounded-lg border border-border bg-muted px-4 py-2.5 font-mono text-lg font-bold tabular-nums tracking-widest">
            {rep?.referral_code ?? "—"}
          </span>
          <a href="/app/loyalty" className="contents">
            <Button>
              <Gift className="mr-2 h-4 w-4" />
              Open Elite Circle
            </Button>
          </a>
        </div>
      </section>

      {/* ---------- violations + appeals ---------- */}
      <section className="panel p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold">Compliance record</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Verified violations recorded against your account. You may appeal any record you believe is inaccurate.
            </p>
          </div>
          <Gavel className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
        </div>

        {violationList.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="Clean record" description="No compliance violations on your account." />
        ) : (
          <div className="mt-5 space-y-3">
            {violationList.map((v) => {
              const appealed = (v.user_appeals ?? []).length > 0;
              return (
                <div key={v.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{v.violation_type.replace(/_/g, " ")}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(v.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={v.severity} raw />
                      <StatusBadge status={v.status} raw />
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{v.description}</p>
                  {v.decision_notes ? (
                    <p className="mt-1 text-xs text-muted-foreground">Decision note: {v.decision_notes}</p>
                  ) : null}
                  {appealed ? (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-status-pending">
                      <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
                      Appeal{" "}
                      {(v.user_appeals ?? [])[0]?.status === "PENDING"
                        ? "under review"
                        : `decided: ${(v.user_appeals ?? [])[0]?.status}`}
                    </p>
                  ) : v.status !== "DISMISSED" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setAppealTarget({ violationId: v.id, label: v.violation_type.replace(/_/g, " ") })}
                    >
                      Appeal this record
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {(myAppeals ?? []).length > 0 ? (
          <div className="mt-6 border-t border-border pt-5">
            <h3 className="text-sm font-bold">Your appeals</h3>
            <div className="mt-3 space-y-2">
              {(myAppeals ?? []).map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-4 py-3"
                >
                  <p className="min-w-0 flex-1 text-sm text-muted-foreground">{a.appeal_reason}</p>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={a.status} raw />
                    {a.decision_notes ? <span className="text-xs text-muted-foreground">{a.decision_notes}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* ---------- reputation history timeline ---------- */}
      <section className="panel p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold">Reputation history</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Every score change, newest first. Pending items score nothing until an administrator verifies them.
            </p>
          </div>
          <History className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
        </div>

        {(events ?? []).length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No events yet"
            description="Complete trips and keep a clean record to build your trust history."
          />
        ) : (
          <ol className="mt-5 space-y-0">
            {(events ?? []).map((e, i) => (
              <li key={e.id} className="relative flex gap-4 pb-5 last:pb-0">
                {i < (events ?? []).length - 1 ? (
                  <span className="absolute left-[7px] top-4 h-full w-px bg-border" aria-hidden />
                ) : null}
                <span
                  className={`relative mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
                    e.verification_status === "PENDING"
                      ? "border-status-pending bg-status-pending-bg"
                      : e.points_change >= 0
                        ? "border-status-verified bg-status-verified-bg"
                        : "border-status-danger bg-status-danger-bg"
                  }`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{e.description}</p>
                    <span
                      className={`font-mono text-sm font-bold tabular-nums ${
                        e.verification_status === "PENDING"
                          ? "text-status-pending"
                          : e.points_change >= 0
                            ? "text-status-verified"
                            : "text-status-danger"
                      }`}
                    >
                      {e.verification_status === "PENDING"
                        ? "±0 (pending)"
                        : `${e.points_change > 0 ? "+" : ""}${e.points_change}`}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDateTime(e.created_at)} · {e.event_type.replace(/_/g, " ")}
                    {e.verification_status === "PENDING" ? (
                      <button
                        className="ml-2 underline underline-offset-2 hover:text-foreground"
                        onClick={() => setAppealTarget({ eventId: e.id, label: e.description })}
                      >
                        Appeal
                      </button>
                    ) : null}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* ---------- appeal dialog ---------- */}
      <Dialog open={Boolean(appealTarget)} onOpenChange={(open) => !open && setAppealTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appeal — {appealTarget?.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Explain why this record is inaccurate. Appeals must be supported — include evidence where you can.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="appeal-reason">Reason</Label>
              <Textarea
                id="appeal-reason"
                rows={4}
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                placeholder="What happened, and why this record is inaccurate. Minimum 20 characters."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="appeal-evidence">Supporting evidence link (optional)</Label>
              <Input
                id="appeal-evidence"
                value={appealEvidence}
                onChange={(e) => setAppealEvidence(e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAppealTarget(null)}>
              Cancel
            </Button>
            <Button onClick={() => submitAppeal.mutate()} disabled={appealReason.trim().length < 20 || submitAppeal.isPending}>
              {submitAppeal.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit appeal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RateBar({ label, value, inverse = false }: { label: string; value: number | null; inverse?: boolean }) {
  const display = value === null ? "—" : `${value}%`;
  const good = value === null ? true : inverse ? value <= 10 : value >= 90;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-mono font-bold tabular-nums ${good ? "text-status-verified" : "text-status-pending"}`}>
          {display}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${good ? "bg-status-verified" : "bg-status-pending"}`}
          style={{ width: value === null ? "0%" : `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

async function copyReferral(code: string) {
  const url = `${window.location.origin}/register?ref=${code}`;
  const text = `Join PortBackhaul with my referral code ${code}: ${url}`;
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Referral message copied");
  } catch {
    toast.error(`Copy failed — your code is ${code}`);
  }
}
