import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { describeError } from "@/lib/errors";

export const MEMBERSHIP_LEVELS = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"] as const;
export type MembershipLevel = (typeof MEMBERSHIP_LEVELS)[number];

export const LEVEL_LABEL: Record<MembershipLevel, string> = {
  BRONZE: "Bronze",
  SILVER: "Silver",
  GOLD: "Gold",
  PLATINUM: "Platinum",
  DIAMOND: "Diamond",
};

export const LEVEL_TAGLINE: Record<MembershipLevel, string> = {
  BRONZE: "New Member",
  SILVER: "Reliable Member",
  GOLD: "Trusted Member",
  PLATINUM: "Preferred Member",
  DIAMOND: "PortBackhaul Elite",
};

/** Corporate palette accents per level: steel → silver → gold → platinum blue → diamond navy. */
export const LEVEL_STYLE: Record<MembershipLevel, { badge: string; ring: string; bar: string }> = {
  BRONZE: {
    badge: "border-[#8C6239]/40 bg-[#F3ECE3] text-[#6B4A26]",
    ring: "#8C6239",
    bar: "#8C6239",
  },
  SILVER: {
    badge: "border-[#7C8A99]/40 bg-[#EEF0F2] text-[#4A5560]",
    ring: "#7C8A99",
    bar: "#7C8A99",
  },
  GOLD: {
    badge: "border-[#C08A2E]/40 bg-[#FCF3E0] text-[#8A6210]",
    ring: "#C08A2E",
    bar: "#C08A2E",
  },
  PLATINUM: {
    badge: "border-[#22539E]/40 bg-[#E3EDFA] text-[#1D4585]",
    ring: "#22539E",
    bar: "#22539E",
  },
  DIAMOND: {
    badge: "border-[#1B263B]/50 bg-[#1B263B] text-[#E7D9A8]",
    ring: "#1B263B",
    bar: "#0F5132",
  },
};

export function levelIndex(level: string | null | undefined): number {
  const idx = MEMBERSHIP_LEVELS.indexOf((level ?? "BRONZE") as MembershipLevel);
  return idx === -1 ? 0 : idx;
}

export function isLevelAtLeast(level: string | null | undefined, min: MembershipLevel): boolean {
  return levelIndex(level) >= levelIndex(min);
}

export interface ReputationRow {
  trust_score: number;
  membership_level: MembershipLevel;
  completed_trips: number;
  on_time_deliveries: number;
  cancelled_trips: number;
  payment_compliance: number;
  customer_satisfaction: number;
  loyalty_points: number;
  account_standing: "GOOD" | "WARNING" | "RESTRICTED" | "SUSPENDED" | "TERMINATED";
  referral_code: string;
  updated_at: string;
}

/** Derived trust-profile percentages, calculated from verified historical counts. */
export function trustRates(rep: ReputationRow | null | undefined) {
  if (!rep) {
    return { completion: null, onTime: null, cancellation: null, paymentCompliance: 100, satisfaction: 100 };
  }
  const decided = rep.completed_trips + rep.cancelled_trips;
  return {
    completion: decided === 0 ? null : Math.round((100 * rep.completed_trips) / decided),
    onTime: rep.completed_trips === 0 ? null : Math.round((100 * rep.on_time_deliveries) / rep.completed_trips),
    cancellation: decided === 0 ? null : Math.round((100 * rep.cancelled_trips) / decided),
    paymentCompliance: rep.payment_compliance,
    satisfaction: rep.customer_satisfaction,
  };
}

export interface ReputationEvent {
  id: string;
  event_type: string;
  points_change: number;
  description: string;
  verification_status: "VERIFIED" | "PENDING" | "DISMISSED";
  created_at: string;
}

export interface MembershipThreshold {
  membership_level: MembershipLevel;
  minimum_score: number;
  minimum_completed_trips: number;
  minimum_account_age_days: number;
  require_verification: boolean;
  active: boolean;
}

export interface Benefit {
  id: string;
  membership_level: MembershipLevel;
  role: string | null;
  benefit_name: string;
  description: string;
}

/** The signed-in user's own reputation profile (RLS-protected). */
export function useTrustProfile(enabled = true) {
  return useQuery({
    queryKey: ["trust-profile"],
    enabled,
    queryFn: async (): Promise<ReputationRow | null> => {
      const { data, error } = await supabase
        .from("user_reputation")
        .select(
          "trust_score, membership_level, completed_trips, on_time_deliveries, cancelled_trips, payment_compliance, customer_satisfaction, loyalty_points, account_standing, referral_code, updated_at",
        )
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(describeError(error));
      return (data as ReputationRow | null) ?? null;
    },
  });
}

/** Public, limited trust profile of any platform member. */
export interface PublicTrustProfile {
  user_id: string;
  full_name: string | null;
  role: string;
  membership_level: MembershipLevel;
  trust_score: number;
  completed_trips: number;
  trip_completion_rate: number | null;
  on_time_rate: number | null;
  cancellation_rate: number | null;
  payment_compliance: number;
  customer_satisfaction: number;
  is_verified: boolean;
  account_standing: string;
}

export async function fetchPublicTrustProfile(userId: string): Promise<PublicTrustProfile | null> {
  const { data, error } = await supabase
    .from("trust_profiles_public")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return null;
  return (data as PublicTrustProfile | null) ?? null;
}

/** Requirement gaps between the current profile and the next membership level. */
export function nextLevelProgress(rep: ReputationRow | null | undefined, thresholds: MembershipThreshold[] | undefined) {
  if (!rep || !thresholds) return null;
  const currentIdx = levelIndex(rep.membership_level);
  const nextLevel = MEMBERSHIP_LEVELS[currentIdx + 1];
  if (!nextLevel) return null;
  const t = thresholds.find((x) => x.membership_level === nextLevel && x.active);
  if (!t) return null;
  const accountAgeDays = Math.max(0, Math.round((Date.now() - new Date(rep.updated_at).getTime()) / 86400000));
  void accountAgeDays; // account age is evaluated server-side; not exposed for privacy
  return {
    nextLevel,
    scoreTarget: t.minimum_score,
    scorePct: Math.min(100, Math.round((100 * rep.trust_score) / Math.max(1, t.minimum_score))),
    tripsTarget: t.minimum_completed_trips,
    tripsPct: Math.min(100, Math.round((100 * rep.completed_trips) / Math.max(1, t.minimum_completed_trips))),
    verificationNeeded: t.require_verification,
  };
}
