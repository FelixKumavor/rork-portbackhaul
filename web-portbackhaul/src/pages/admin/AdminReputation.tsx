import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  Gavel,
  Loader2,
  Minus,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { MembershipBadge } from "@/components/reputation/MembershipBadge";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Seo } from "@/components/Seo";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { describeError, describeFunctionError } from "@/lib/errors";
import { formatDate, formatDateTime } from "@/lib/format";
import { LEVEL_LABEL, type MembershipLevel, type MembershipThreshold, type ReputationEvent } from "@/lib/reputation";
import { cn } from "@/lib/utils";

interface ControlRow {
  user_id: string;
  full_name: string | null;
  role: string;
  membership_level: MembershipLevel;
  trust_score: number;
  completed_trips: number;
  loyalty_points: number;
  account_standing: string;
  is_verified: boolean;
}

interface UserDetail {
  reputation: ControlRow & { referral_code: string; referred_by: string | null } | null;
  events: ReputationEvent[];
  violations: ViolationRow[];
  points: { id: string; points: number; description: string; created_at: string }[];
}

interface ViolationRow {
  id: string;
  user_id: string;
  violation_type: string;
  severity: string;
  description: string;
  status: string;
  decision: string | null;
  decision_notes: string | null;
  created_at: string;
  user_appeals: AppealRow[] | null;
}

interface AppealRow {
  id: string;
  user_id: string;
  violation_id: string;
  appeal_reason: string;
  evidence_url: string | null;
  status: string;
  decision: string | null;
  created_at: string;
}

interface RewardRow {
  id: string;
  title: string;
  description: string;
  reward_type: string;
  cost_points: number;
  role_scope: string | null;
  min_membership_level: MembershipLevel;
  active: boolean;
}

interface RedemptionRow {
  id: string;
  user_id: string;
  points_spent: number;
  status: string;
  created_at: string;
  reward_catalogue: { title: string } | null;
}

const TABS = ["Members", "Appeals", "Redemptions", "Rewards", "Thresholds", "Referrals"] as const;
type TabId = (typeof TABS)[number];

const VIOLATION_TYPES = [
  "FALSE_REGISTRATION",
  "FAKE_TRUCK_DOCUMENTS",
  "FRAUDULENT_DELIVERY_CONFIRMATION",
  "ABANDONED_TRIP",
  "REPEATED_UNJUSTIFIED_CANCELLATIONS",
  "PAYMENT_FRAUD",
  "TRANSACTION_MANIPULATION",
  "REPEATED_MISCONDUCT",
] as const;

const SEVERITIES = ["LEVEL_1", "LEVEL_2", "LEVEL_3", "LEVEL_4", "LEVEL_5"] as const;

export default function AdminReputation() {
  const [tab, setTab] = useState<TabId>("Members");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ["rep-members", search],
    queryFn: async (): Promise<ControlRow[]> => {
      let query = supabase
        .from("trust_profiles_public")
        .select("user_id, full_name, role, membership_level, trust_score, completed_trips, loyalty_points, account_standing, is_verified")
        .order("trust_score", { ascending: false })
        .limit(200);
      if (search.trim()) {
        query = query.ilike("full_name", `%${search.trim()}%`);
      }
      const { data, error } = await query;
      if (error) throw new Error(describeError(error));
      return (data ?? []) as ControlRow[];
    },
  });

  const { data: pendingAppeals } = useQuery({
    queryKey: ["rep-appeals", "pending"],
    enabled: tab === "Appeals",
    queryFn: async (): Promise<(AppealRow & { violation: ViolationRow | null })[]> => {
      const { data, error } = await supabase
        .from("user_appeals")
        .select("*, violation:user_violations!user_appeals_violation_id_fkey(*)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw new Error(describeError(error));
      return ((data ?? []) as unknown as (AppealRow & { violation: ViolationRow | null })[]).filter((a) => a.status === "PENDING" || a.status === "APPROVED" || a.status === "REJECTED");
    },
  });

  const { data: pendingRedemptions } = useQuery({
    queryKey: ["rep-redemptions"],
    enabled: tab === "Redemptions",
    queryFn: async (): Promise<RedemptionRow[]> => {
      const { data, error } = await supabase
        .from("reward_redemptions")
        .select("id, user_id, points_spent, status, created_at, reward_catalogue(title)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw new Error(describeError(error));
      return (data ?? []) as RedemptionRow[];
    },
  });

  const { data: rewards } = useQuery({
    queryKey: ["rep-rewards"],
    enabled: tab === "Rewards",
    queryFn: async (): Promise<RewardRow[]> => {
      const { data, error } = await supabase
        .from("reward_catalogue")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(describeError(error));
      return (data ?? []) as RewardRow[];
    },
  });

  const { data: thresholds } = useQuery({
    queryKey: ["rep-thresholds"],
    enabled: tab === "Thresholds",
    queryFn: async (): Promise<MembershipThreshold[]> => {
      const { data, error } = await supabase
        .from("reputation_settings")
        .select("*")
        .order("minimum_score", { ascending: true });
      if (error) throw new Error(describeError(error));
      return (data ?? []) as MembershipThreshold[];
    },
  });

  const { data: referrals } = useQuery({
    queryKey: ["rep-referrals"],
    enabled: tab === "Referrals",
    queryFn: async (): Promise<
      { id: string; status: string; points_awarded: number; created_at: string; referrer: { full_name: string } | null; referred: { full_name: string; verification_status: string } | null }[]
    > => {
      const { data, error } = await supabase
        .from("referrals")
        .select(
          "id, status, points_awarded, created_at, referrer:profiles!referrals_referrer_id_fkey(full_name), referred:profiles!referrals_referred_user_id_fkey(full_name, verification_status)",
        )
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw new Error(describeError(error));
      return ((data ?? []) as unknown as Record<string, never>[]).map((r) => ({
        ...(r as unknown as { id: string; status: string; points_awarded: number; created_at: string }),
        referrer: Array.isArray(r["referrer"]) ? (r["referrer"][0] as { full_name: string } | null) : (r["referrer"] as { full_name: string } | null),
        referred: Array.isArray(r["referred"]) ? (r["referred"][0] as { full_name: string; verification_status: string } | null) : (r["referred"] as { full_name: string; verification_status: string } | null),
      }));
    },
  });

  const callAdmin = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { error } = await supabase.functions.invoke("reputation-admin-api", { body });
      if (error) throw new Error(await describeFunctionError(error));
      return null;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["rep-members"] });
      void queryClient.invalidateQueries({ queryKey: ["rep-appeals"] });
      void queryClient.invalidateQueries({ queryKey: ["rep-redemptions"] });
      void queryClient.invalidateQueries({ queryKey: ["rep-rewards"] });
      void queryClient.invalidateQueries({ queryKey: ["rep-thresholds"] });
      void queryClient.invalidateQueries({ queryKey: ["rep-referrals"] });
      void queryClient.invalidateQueries({ queryKey: ["rep-user-detail"] });
    },
    onError: (e) => toast.error(describeError(e)),
  });

  return (
    <div className="mx-auto w-full max-w-[1200px] animate-fade space-y-7">
      <Seo
        title="Reputation Control Centre · PortBackhaul Admin"
        description="Trust scores, membership levels, violations, appeals and Elite Circle loyalty configuration for every PortBackhaul member."
        path="/admin/reputation"
        noIndex
      />
      <PageHeader
        eyebrow="Administration"
        title="Reputation Control Centre"
        subtitle="Trust scores, membership levels, violations, appeals and Elite Circle configuration. Every action here is recorded in the audit log."
      />

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md border px-3.5 py-1.5 text-sm font-medium transition-colors",
              tab === t
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-white text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Members" ? (
        <section className="panel p-0">
          <div className="flex items-center gap-3 border-b border-border p-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                className="pl-9"
                placeholder="Search members by name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search members"
              />
            </div>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">{members?.length ?? 0} members</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
            </div>
          ) : (members ?? []).length === 0 ? (
            <EmptyState icon={Users} title="No members found" description="Adjust the search to find a member." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-2.5 font-semibold">Member</th>
                    <th className="px-4 py-2.5 font-semibold">Role</th>
                    <th className="px-4 py-2.5 font-semibold">Membership</th>
                    <th className="px-4 py-2.5 font-semibold">Trust Score</th>
                    <th className="px-4 py-2.5 font-semibold">Trips</th>
                    <th className="px-4 py-2.5 font-semibold">Points</th>
                    <th className="px-4 py-2.5 font-semibold">Standing</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(members ?? []).map((m) => (
                    <tr key={m.user_id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <span className="font-medium">{m.full_name ?? m.user_id.slice(0, 8)}</span>
                        {m.is_verified ? (
                          <ShieldCheck className="ml-1.5 inline h-3.5 w-3.5 text-status-verified" aria-label="Verified" />
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{m.role.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3">
                        <MembershipBadge level={m.membership_level} />
                      </td>
                      <td className="px-4 py-3 font-mono font-bold tabular-nums">{m.trust_score}</td>
                      <td className="px-4 py-3 font-mono tabular-nums text-muted-foreground">{m.completed_trips}</td>
                      <td className="px-4 py-3 font-mono tabular-nums text-muted-foreground">{m.loyalty_points}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={m.account_standing} raw />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="outline" size="sm" onClick={() => setSelectedUser(m.user_id)}>
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {tab === "Appeals" ? (
        (pendingAppeals ?? []).filter((a) => a.status === "PENDING").length === 0 ? (
          <EmptyState icon={Gavel} title="No pending appeals" description="User appeals against violations or score changes appear here." />
        ) : (
          <div className="space-y-3">
            {(pendingAppeals ?? [])
              .filter((a) => a.status === "PENDING")
              .map((a) => (
                <article key={a.id} className="panel p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold">{a.violation?.violation_type.replace(/_/g, " ") ?? "Reputation event appeal"}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{a.appeal_reason}</p>
                      {a.evidence_url ? (
                        <a className="mt-1 block truncate text-xs text-primary underline" href={a.evidence_url} target="_blank" rel="noreferrer">
                          {a.evidence_url}
                        </a>
                      ) : null}
                      <p className="mt-1.5 font-mono text-xs tabular-nums text-muted-foreground">
                        Submitted {formatDateTime(a.created_at)} · {a.violation?.severity ?? "—"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={callAdmin.isPending}
                        onClick={() => callAdmin.mutate({ action: "decide-appeal", appeal_id: a.id, decision: "APPROVED" })}
                      >
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Approve & restore
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={callAdmin.isPending}
                        onClick={() => callAdmin.mutate({ action: "decide-appeal", appeal_id: a.id, decision: "REJECTED" })}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
          </div>
        )
      ) : null}

      {tab === "Redemptions" ? (
        (pendingRedemptions ?? []).filter((r) => r.status === "PENDING").length === 0 ? (
          <EmptyState icon={Ticket} title="No pending redemptions" description="User reward redemptions awaiting fulfilment appear here." />
        ) : (
          <div className="panel divide-y divide-border p-0">
            {(pendingRedemptions ?? []).filter((r) => r.status === "PENDING").map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{r.reward_catalogue?.title ?? "Reward"}</p>
                  <p className="font-mono text-xs tabular-nums text-muted-foreground">
                    {r.user_id.slice(0, 8)} · {r.points_spent} pts · {formatDateTime(r.created_at)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" disabled={callAdmin.isPending} onClick={() => callAdmin.mutate({ action: "decide-redemption", redemption_id: r.id, decision: "GRANTED" })}>
                    Grant
                  </Button>
                  <Button size="sm" variant="outline" disabled={callAdmin.isPending} onClick={() => callAdmin.mutate({ action: "decide-redemption", redemption_id: r.id, decision: "REJECTED" })}>
                    Reject & refund
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : null}

      {tab === "Rewards" ? <RewardsAdmin rewards={rewards ?? []} onSave={(reward) => callAdmin.mutate({ action: "save-reward", reward })} saving={callAdmin.isPending} /> : null}
      {tab === "Thresholds" ? <ThresholdsAdmin thresholds={thresholds ?? []} onSave={(t) => callAdmin.mutate({ action: "set-thresholds", ...t })} saving={callAdmin.isPending} /> : null}

      {tab === "Referrals" ? (
        (referrals ?? []).length === 0 ? (
          <EmptyState icon={Users} title="No referral activity" description="Referral submissions and their verification status appear here." />
        ) : (
          <div className="panel divide-y divide-border p-0">
            {(referrals ?? []).map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {r.referrer?.full_name ?? "—"} → {r.referred?.full_name ?? "—"}
                  </p>
                  <p className="font-mono text-xs tabular-nums text-muted-foreground">
                    {formatDateTime(r.created_at)} · referred account: {r.referred?.verification_status ?? "?"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">{r.points_awarded} pts</span>
                  <StatusBadge status={r.status} raw />
                </div>
              </div>
            ))}
          </div>
        )
      ) : null}

      {/* ---------- member review drawer ---------- */}
      <UserReviewDrawer userId={selectedUser} onClose={() => setSelectedUser(null)} onAction={callAdmin.mutate} pending={callAdmin.isPending} />
    </div>
  );
}

/* ---------------- member review drawer ---------------- */

function UserReviewDrawer({
  userId,
  onClose,
  onAction,
  pending,
}: {
  userId: string | null;
  onClose: () => void;
  onAction: (body: Record<string, unknown>) => void;
  pending: boolean;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["rep-user-detail", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<UserDetail | null> => {
      const { data: detail, error } = await supabase.functions.invoke("reputation-admin-api", {
        body: { action: "user-detail", user_id: userId },
      });
      if (error) throw new Error(await describeFunctionError(error));
      return detail as UserDetail;
    },
  });

  const [adjustPoints, setAdjustPoints] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [violationOpen, setViolationOpen] = useState(false);

  const rep = data?.reputation;

  return (
    <Dialog open={Boolean(userId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {rep?.full_name ?? "Member"}
            {rep ? <MembershipBadge level={rep.membership_level} /> : null}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading member…
          </div>
        ) : !data ? (
          <p className="py-6 text-sm text-muted-foreground">Member not found.</p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Trust score" value={rep?.trust_score ?? "—"} />
              <Stat label="Trips" value={rep?.completed_trips ?? 0} />
              <Stat label="Points" value={rep?.loyalty_points ?? 0} />
              <Stat label="Standing" value={rep?.account_standing ?? "—"} />
            </div>

            {/* manual adjustment */}
            <section className="rounded-lg border border-border p-4">
              <h3 className="text-sm font-bold">Adjust reputation</h3>
              <p className="mt-1 text-xs text-muted-foreground">Documented reason required. Applied as a verified administrator adjustment.</p>
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <div className="w-24 space-y-1">
                  <Label htmlFor="adj-points" className="text-xs">Points</Label>
                  <Input id="adj-points" type="number" value={adjustPoints} onChange={(e) => setAdjustPoints(e.target.value)} placeholder="±10" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <Label htmlFor="adj-reason" className="text-xs">Reason</Label>
                  <Input id="adj-reason" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="Documented reason for the adjustment" />
                </div>
                <Button
                  size="sm"
                  disabled={pending || !adjustPoints || Number(adjustPoints) === 0 || adjustReason.trim().length < 5}
                  onClick={() => {
                    onAction({ action: "adjust-reputation", user_id: userId, points: Number(adjustPoints), reason: adjustReason });
                    setAdjustPoints("");
                    setAdjustReason("");
                  }}
                >
                  Apply
                </Button>
              </div>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => { setAdjustPoints("-10"); setAdjustReason("Verified violation penalty"); }}>
                  <Minus className="mr-1 h-3.5 w-3.5" /> −10
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setAdjustPoints("10"); setAdjustReason("Goodwill restoration"); }}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> +10
                </Button>
              </div>
            </section>

            {/* violation creation */}
            <section className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold">Compliance</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Record a verified violation with its enforcement level.</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setViolationOpen(true)}>
                  <Gavel className="mr-2 h-4 w-4" /> New violation
                </Button>
              </div>
            </section>

            {/* history */}
            <section>
              <h3 className="text-sm font-bold">Reputation history</h3>
              <div className="mt-2 max-h-48 space-y-1.5 overflow-y-auto pr-1">
                {(data.events ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No reputation events.</p>
                ) : (
                  (data.events ?? []).map((e) => (
                    <div key={e.id} className="flex items-center justify-between gap-3 rounded border border-border px-3 py-2 text-xs">
                      <div className="min-w-0">
                        <p className="truncate">{e.description}</p>
                        <p className="font-mono tabular-nums text-muted-foreground">
                          {formatDateTime(e.created_at)} · {e.event_type}
                          {e.verification_status === "PENDING" ? (
                            <>
                              {" · pending"}
                              <button
                                className="ml-2 underline"
                                onClick={() => onAction({ action: "verify-cancellation", event_id: e.id, decision: "UNJUSTIFIED" })}
                              >
                                apply −10
                            </button>
                              <button
                                className="ml-1.5 underline"
                                onClick={() => onAction({ action: "verify-cancellation", event_id: e.id, decision: "JUSTIFIED" })}
                              >
                                dismiss
                              </button>
                            </>
                          ) : null}
                        </p>
                      </div>
                      <span className={cn("font-mono font-bold tabular-nums", e.points_change >= 0 ? "text-status-verified" : "text-status-danger")}>
                        {e.points_change > 0 ? "+" : ""}
                        {e.points_change}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {/* violation dialog */}
        {userId ? (
          <ViolationDialog
            open={violationOpen}
            onOpenChange={setViolationOpen}
            onSubmit={(payload) => {
              onAction({ action: "create-violation", user_id: userId, ...payload });
              setViolationOpen(false);
            }}
            pending={pending}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="eyebrow">{label}</p>
      <p className="mt-1 font-mono text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}

function ViolationDialog({
  open,
  onOpenChange,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { violation_type: string; severity: string; description: string; evidence_url?: string }) => void;
  pending: boolean;
}) {
  const [violationType, setViolationType] = useState<string>(VIOLATION_TYPES[0]);
  const [severity, setSeverity] = useState<string>(SEVERITIES[1]);
  const [description, setDescription] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record violation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Violation category</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-white px-2 text-sm"
                value={violationType}
                onChange={(e) => setViolationType(e.target.value)}
              >
                {VIOLATION_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Enforcement level</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-white px-2 text-sm"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>{s.replace("_", ": ")}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description & evidence summary</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was verified, when, and how." />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Evidence URL</Label>
            <Input value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} placeholder="https://…" />
          </div>
          <p className="text-xs text-muted-foreground">
            LEVEL_4 suspends the account pending investigation; LEVEL_5 permanently terminates following review. Neither
            is automatic — both require this documented decision.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={pending || description.trim().length < 10}
            onClick={() => onSubmit({ violation_type: violationType, severity, description, evidence_url: evidenceUrl || undefined })}
          >
            Record violation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- rewards + thresholds admins ---------------- */

function RewardsAdmin({
  rewards,
  onSave,
  saving,
}: {
  rewards: RewardRow[];
  onSave: (reward: Partial<RewardRow>) => void;
  saving: boolean;
}) {
  const [editing, setEditing] = useState<Partial<RewardRow> | null>(null);
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() =>
            setEditing({ title: "", description: "", reward_type: "SERVICE_FEE_DISCOUNT", cost_points: 500, min_membership_level: "BRONZE", active: true })
          }
        >
          <Ticket className="mr-2 h-4 w-4" /> New reward
        </Button>
      </div>

      <div className="panel divide-y divide-border p-0">
        {rewards.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
            <div className="min-w-0">
              <p className="text-sm font-medium">{r.title}</p>
              <p className="font-mono text-xs tabular-nums text-muted-foreground">
                {r.cost_points} pts · {r.reward_type} · min {r.min_membership_level}
                {r.role_scope ? ` · ${r.role_scope}` : " · all roles"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={r.active ? "ACTIVE" : "INACTIVE"} raw />
              <Button size="sm" variant="outline" onClick={() => setEditing(r)}>Edit</Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit reward" : "New reward"}</DialogTitle>
          </DialogHeader>
          {editing ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Title</Label>
                <Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Textarea rows={2} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Cost (points)</Label>
                  <Input
                    type="number"
                    value={editing.cost_points ?? 0}
                    onChange={(e) => setEditing({ ...editing, cost_points: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Minimum level</Label>
                  <select
                    className="h-9 w-full rounded-md border border-input bg-white px-2 text-sm"
                    value={editing.min_membership_level ?? "BRONZE"}
                    onChange={(e) => setEditing({ ...editing, min_membership_level: e.target.value as MembershipLevel })}
                  >
                    {(["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"] as const).map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button
              disabled={saving || !editing?.title || !editing?.description || !editing?.cost_points}
              onClick={() => {
                onSave(editing!);
                setEditing(null);
              }}
            >
              Save reward
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ThresholdsAdmin({
  thresholds,
  onSave,
  saving,
}: {
  thresholds: MembershipThreshold[];
  onSave: (t: MembershipThreshold) => void;
  saving: boolean;
}) {
  return (
    <div className="panel p-0">
      <div className="border-b border-border p-4">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Settings2 className="h-4 w-4" /> Membership thresholds
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Levels recalculate automatically after every verified event. Users can never upgrade manually.
        </p>
      </div>
      <div className="divide-y divide-border">
        {thresholds.map((t) => (
          <ThresholdRow key={t.membership_level} threshold={t} onSave={onSave} saving={saving} />
        ))}
      </div>
    </div>
  );
}

function ThresholdRow({
  threshold,
  onSave,
  saving,
}: {
  threshold: MembershipThreshold;
  onSave: (t: MembershipThreshold) => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState(threshold);
  const dirty =
    draft.minimum_score !== threshold.minimum_score ||
    draft.minimum_completed_trips !== threshold.minimum_completed_trips ||
    draft.minimum_account_age_days !== threshold.minimum_account_age_days ||
    draft.require_verification !== threshold.require_verification;

  return (
    <div className="flex flex-wrap items-center gap-4 px-5 py-4">
      <div className="w-28">
        <MembershipBadge level={threshold.membership_level} />
        <p className="mt-1 text-xs text-muted-foreground">{LEVEL_LABEL[threshold.membership_level]}</p>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Min score</Label>
        <Input
          type="number"
          className="h-8 w-20"
          value={draft.minimum_score}
          onChange={(e) => setDraft({ ...draft, minimum_score: Number(e.target.value) })}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Min trips</Label>
        <Input
          type="number"
          className="h-8 w-20"
          value={draft.minimum_completed_trips}
          onChange={(e) => setDraft({ ...draft, minimum_completed_trips: Number(e.target.value) })}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Min account age (days)</Label>
        <Input
          type="number"
          className="h-8 w-24"
          value={draft.minimum_account_age_days}
          onChange={(e) => setDraft({ ...draft, minimum_account_age_days: Number(e.target.value) })}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={draft.require_verification}
          onChange={(e) => setDraft({ ...draft, require_verification: e.target.checked })}
        />
        Requires verified account
      </label>
      <Button size="sm" className="ml-auto" disabled={!dirty || saving} onClick={() => onSave(draft)}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Save
      </Button>
    </div>
  );
}
