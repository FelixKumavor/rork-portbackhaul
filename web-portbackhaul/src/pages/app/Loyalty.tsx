import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  Coins,
  Gift,
  Loader2,
  PackageCheck,
  Ticket,
  TrendingUp,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { describeError, describeFunctionError } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";
import { ROLE_LABEL, type Role } from "@/lib/roles";
import {
  isLevelAtLeast,
  LEVEL_LABEL,
  type Benefit,
  type MembershipLevel,
  useTrustProfile,
} from "@/lib/reputation";
import { cn } from "@/lib/utils";

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

interface PointsRow {
  id: string;
  points: number;
  transaction_type: "EARN" | "REDEEM" | "ADJUST";
  description: string;
  created_at: string;
}

interface RedemptionRow {
  id: string;
  reward_id: string;
  points_spent: number;
  status: string;
  decision_note: string | null;
  created_at: string;
  reward_catalogue: { title: string } | null;
}

interface ReferralRow {
  id: string;
  referred_user_id: string;
  status: string;
  points_awarded: number;
  verified_at: string | null;
  created_at: string;
  referred: { full_name: string | null; verification_status: string } | null;
}

const TABS = [
  { id: "rewards", label: "Rewards Catalogue" },
  { id: "history", label: "Points History" },
  { id: "redeemed", label: "Redeemed Rewards" },
  { id: "benefits", label: "Membership Benefits" },
  { id: "referrals", label: "Referral Performance" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const REWARD_TYPE_LABEL: Record<string, string> = {
  SERVICE_FEE_DISCOUNT: "Reduced service charge",
  PRIORITY_MATCHING: "Priority matching",
  PROMOTIONAL: "Promotional reward",
  RECOGNITION: "Special recognition",
  PREMIUM_PRIVILEGE: "Premium privilege",
};

export default function LoyaltyPage() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const repQuery = useTrustProfile(Boolean(user?.id));
  const rep = repQuery.data;
  const [tab, setTab] = useState<TabId>("rewards");

  const refreshLoyalty = () => {
    void queryClient.invalidateQueries({ queryKey: ["trust-profile"] });
    void queryClient.invalidateQueries({ queryKey: ["loyalty-points-history"] });
    void queryClient.invalidateQueries({ queryKey: ["my-redemptions"] });
    void queryClient.invalidateQueries({ queryKey: ["my-referrals"] });
  };

  const { data: rewards } = useQuery({
    queryKey: ["reward-catalogue"],
    queryFn: async (): Promise<RewardRow[]> => {
      const { data, error } = await supabase
        .from("reward_catalogue")
        .select("id, title, description, reward_type, cost_points, role_scope, min_membership_level, active")
        .eq("active", true)
        .order("cost_points", { ascending: true });
      if (error) throw new Error(describeError(error));
      return (data ?? []) as RewardRow[];
    },
  });

  const { data: pointsHistory } = useQuery({
    queryKey: ["loyalty-points-history"],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<PointsRow[]> => {
      const { data, error } = await supabase
        .from("elite_circle_points")
        .select("id, points, transaction_type, description, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw new Error(describeError(error));
      return (data ?? []) as PointsRow[];
    },
  });

  const { data: redemptions } = useQuery({
    queryKey: ["my-redemptions"],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<RedemptionRow[]> => {
      const { data, error } = await supabase
        .from("reward_redemptions")
        .select("id, reward_id, points_spent, status, decision_note, created_at, reward_catalogue(title)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw new Error(describeError(error));
      return (data ?? []) as RedemptionRow[];
    },
  });

  const { data: benefits } = useQuery({
    queryKey: ["membership-benefits"],
    queryFn: async (): Promise<Benefit[]> => {
      const { data, error } = await supabase
        .from("membership_benefits")
        .select("id, membership_level, role, benefit_name, description")
        .order("sort_order", { ascending: true });
      if (error) throw new Error(describeError(error));
      return (data ?? []) as Benefit[];
    },
  });

  const { data: referrals } = useQuery({
    queryKey: ["my-referrals"],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<ReferralRow[]> => {
      const { data, error } = await supabase
        .from("referrals")
        .select(
          "id, referred_user_id, status, points_awarded, verified_at, created_at, referred:profiles!referrals_referred_user_id_fkey(full_name, verification_status)",
        )
        .eq("referrer_id", user?.id ?? "")
        .order("created_at", { ascending: false });
      if (error) throw new Error(describeError(error));
      return ((data ?? []) as unknown as ReferralRow[]).map((r) => ({
        ...r,
        referred: Array.isArray(r.referred) ? r.referred[0] ?? null : r.referred,
      }));
    },
  });

  const redeem = useMutation({
    mutationFn: async (rewardId: string) => {
      const { error } = await supabase.functions.invoke("reputation-api", {
        body: { action: "redeem", reward_id: rewardId },
      });
      if (error) throw new Error(await describeFunctionError(error));
    },
    onSuccess: () => {
      toast.success("Redemption request submitted");
      refreshLoyalty();
    },
    onError: (e) => toast.error(describeError(e)),
  });

  const [referralCode, setReferralCode] = useState("");
  const submitReferral = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("reputation-api", {
        body: { action: "referral", code: referralCode },
      });
      if (error) throw new Error(await describeFunctionError(error));
    },
    onSuccess: () => {
      toast.success("Referral recorded");
      setReferralCode("");
      refreshLoyalty();
    },
    onError: (e) => toast.error(describeError(e)),
  });

  if (!user || !profile) return null;

  return (
    <div className="mx-auto w-full max-w-[1000px] animate-fade space-y-7">
      <Seo
        title="PortBackhaul Elite Circle · PortBackhaul"
        description="Loyalty points, rewards and membership benefits."
        path="/app/loyalty"
        noIndex
      />

      <PageHeader
        eyebrow="PortBackhaul Elite Circle"
        title="My Loyalty Points"
        subtitle={`The Elite Circle rewards verified performance as ${ROLE_LABEL[profile.role as Role] ?? profile.role}. Points are earned from real trips and verified referrals.`}
        meta={rep ? <MembershipBadge level={rep.membership_level} size="lg" /> : null}
      />

      {/* ---------- points card ---------- */}
      <section className="panel border-l-4 border-l-[#C08A2E] p-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#FCF3E0] text-[#8A6210]">
              <Coins className="h-7 w-7" aria-hidden />
            </span>
            <div>
              <p className="eyebrow">Elite Circle balance</p>
              <p className="font-mono text-4xl font-bold tabular-nums text-foreground">{rep?.loyalty_points ?? 0}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">points · redemption requests are reviewed by an administrator</p>
            </div>
          </div>
          <div className="flex items-center gap-8 font-mono text-sm tabular-nums text-muted-foreground">
            <div>
              <p className="eyebrow mb-1">Earned</p>
              <p className="text-lg font-bold text-status-verified">
                +{(pointsHistory ?? []).filter((p) => p.points > 0).reduce((s, p) => s + p.points, 0)}
              </p>
            </div>
            <div>
              <p className="eyebrow mb-1">Redeemed</p>
              <p className="text-lg font-bold text-status-danger">
                {(pointsHistory ?? []).filter((p) => p.points < 0).reduce((s, p) => s + p.points, 0)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- tabs ---------- */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Elite Circle sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-md border px-3.5 py-1.5 text-sm font-medium transition-colors",
              tab === t.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-white text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "rewards" ? (
        (rewards ?? []).length === 0 ? (
          <EmptyState icon={Ticket} title="No rewards published yet" description="Administrators can publish rewards from the Reputation Control Centre." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {(rewards ?? [])
              .filter((r) => !r.role_scope || r.role_scope === profile.role)
              .map((r) => {
                const levelOk = isLevelAtLeast(rep?.membership_level, r.min_membership_level);
                const affordable = (rep?.loyalty_points ?? 0) >= r.cost_points;
                return (
                  <article key={r.id} className="panel flex flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="eyebrow mb-1">{REWARD_TYPE_LABEL[r.reward_type] ?? r.reward_type.replace(/_/g, " ")}</p>
                        <h3 className="text-sm font-bold">{r.title}</h3>
                      </div>
                      <span className="shrink-0 rounded-md border border-[#C08A2E]/40 bg-[#FCF3E0] px-2 py-1 font-mono text-xs font-bold tabular-nums text-[#8A6210]">
                        {r.cost_points} pts
                      </span>
                    </div>
                    <p className="mt-2 flex-1 text-sm text-muted-foreground">{r.description}</p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      {!levelOk ? (
                        <span className="text-xs text-status-pending">Requires {LEVEL_LABEL[r.min_membership_level]} membership</span>
                      ) : affordable ? null : (
                        <span className="text-xs text-muted-foreground">
                          {(r.cost_points - (rep?.loyalty_points ?? 0))} more points needed
                        </span>
                      )}
                      <Button
                        size="sm"
                        className="ml-auto"
                        disabled={!levelOk || !affordable || redeem.isPending}
                        onClick={() => redeem.mutate(r.id)}
                      >
                        {redeem.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gift className="mr-2 h-4 w-4" />}
                        Redeem
                      </Button>
                    </div>
                  </article>
                );
              })}
          </div>
        )
      ) : null}

      {tab === "history" ? (
        (pointsHistory ?? []).length === 0 ? (
          <EmptyState icon={TrendingUp} title="No points activity yet" description="Complete trips and refer verified professionals to earn Elite Circle points." />
        ) : (
          <div className="panel divide-y divide-border p-0">
            {(pointsHistory ?? []).map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.description}</p>
                  <p className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">{formatDateTime(p.created_at)}</p>
                </div>
                <span className={`font-mono text-sm font-bold tabular-nums ${p.points >= 0 ? "text-status-verified" : "text-status-danger"}`}>
                  {p.points > 0 ? "+" : ""}
                  {p.points}
                </span>
              </div>
            ))}
          </div>
        )
      ) : null}

      {tab === "redeemed" ? (
        (redemptions ?? []).length === 0 ? (
          <EmptyState icon={PackageCheck} title="Nothing redeemed yet" description="Rewards you redeem appear here with their fulfilment status." />
        ) : (
          <div className="panel divide-y divide-border p-0">
            {(redemptions ?? []).map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.reward_catalogue?.title ?? "Reward"}</p>
                  <p className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                    {formatDateTime(r.created_at)} · {r.points_spent} pts
                    {r.decision_note ? ` · ${r.decision_note}` : ""}
                  </p>
                </div>
                <StatusBadge status={r.status} raw />
              </div>
            ))}
          </div>
        )
      ) : null}

      {tab === "benefits" ? (
        <div className="space-y-5">
          {(benefits ?? []).filter((b) => !b.role || b.role === profile.role).length === 0 ? (
            <EmptyState icon={Award} title="No benefits configured" description="Membership benefits will appear here once configured." />
          ) : (
            (["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"] as MembershipLevel[]).map((level) => {
              const levelBenefits = (benefits ?? []).filter(
                (b) => b.membership_level === level && (!b.role || b.role === profile.role),
              );
              if (levelBenefits.length === 0) return null;
              const unlocked = isLevelAtLeast(rep?.membership_level, level);
              return (
                <section key={level} className="panel p-5">
                  <div className="flex items-center justify-between gap-3">
                    <MembershipBadge level={level} size="lg" />
                    {unlocked ? (
                      <span className="text-xs font-semibold text-status-verified">Unlocked</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Locked</span>
                    )}
                  </div>
                  <ul className="mt-3 space-y-2">
                    {levelBenefits.map((b) => (
                      <li key={b.id} className="flex items-start gap-2.5 text-sm">
                        <Award className={`mt-0.5 h-4 w-4 shrink-0 ${unlocked ? "text-status-verified" : "text-muted-foreground"}`} aria-hidden />
                        <div>
                          <p className="font-medium text-foreground">{b.benefit_name}</p>
                          <p className="text-muted-foreground">{b.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })
          )}
        </div>
      ) : null}

      {tab === "referrals" ? (
        <div className="space-y-5">
          <section className="panel p-6">
            <h2 className="text-base font-bold">Submit a referral code</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Were you referred by another member? Enter their code. Your referrer earns points once your account is
              verified — self-referrals and duplicates are rejected automatically.
            </p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ref-code">Referral code</Label>
                <Input
                  id="ref-code"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="PBXXXXXX"
                  className="w-44 font-mono uppercase"
                />
              </div>
              <Button onClick={() => submitReferral.mutate()} disabled={!referralCode || submitReferral.isPending}>
                {submitReferral.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
                Submit
              </Button>
            </div>
          </section>

          <section className="panel p-6">
            <h2 className="text-base font-bold">Your referrals</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Professionals who joined with your code <span className="font-mono">{rep?.referral_code}</span>.
            </p>
            {(referrals ?? []).length === 0 ? (
              <EmptyState icon={Users} title="No referrals yet" description="Share your referral code from your Trust Profile page." />
            ) : (
              <div className="panel mt-4 divide-y divide-border p-0">
                {(referrals ?? []).map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{r.referred?.full_name ?? "New member"}</p>
                      <p className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                        Joined {formatDateTime(r.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={r.referred?.verification_status ?? "NOT_SUBMITTED"} raw />
                      <StatusBadge status={r.status} raw />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
