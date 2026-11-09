import { useMemo } from "react";

import {
  LEVEL_LABEL,
  LEVEL_STYLE,
  LEVEL_TAGLINE,
  MEMBERSHIP_LEVELS,
  type MembershipLevel,
} from "@/lib/reputation";
import { cn } from "@/lib/utils";

/** Professional membership badge — compact pill or large display card. */
export function MembershipBadge({
  level,
  size = "sm",
  className,
}: {
  level: string | null | undefined;
  size?: "sm" | "lg";
  className?: string;
}) {
  const safe = (MEMBERSHIP_LEVELS as readonly string[]).includes(level ?? "")
    ? (level as MembershipLevel)
    : "BRONZE";
  const style = LEVEL_STYLE[safe];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border font-bold uppercase tracking-wider",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1.5 text-xs",
        style.badge,
        className,
      )}
      title={`PortBackhaul ${LEVEL_LABEL[safe]} — ${LEVEL_TAGLINE[safe]}`}
    >
      {size === "lg" ? <TierGlyph level={safe} className="h-3.5 w-3.5" /> : null}
      {LEVEL_LABEL[safe]}
      {size === "lg" ? <span className="font-medium normal-case tracking-normal opacity-80">· {LEVEL_TAGLINE[safe]}</span> : null}
    </span>
  );
}

/** Small monogram glyph per tier (no emoji, no illustration). */
export function TierGlyph({ level, className }: { level: MembershipLevel; className?: string }) {
  const glyphs: Record<MembershipLevel, string> = {
    BRONZE: "B",
    SILVER: "S",
    GOLD: "G",
    PLATINUM: "P",
    DIAMOND: "D",
  };
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex items-center justify-center rounded-sm border border-current font-extrabold leading-none",
        className ?? "h-3 w-3 text-[8px]",
      )}
    >
      {glyphs[level]}
    </span>
  );
}

/** Trust Score ring — SVG, stroke-draw, no animation clutter. */
export function TrustScoreRing({
  score,
  level,
  size = 120,
  label = "Trust Score",
}: {
  score: number;
  level: string;
  size?: number;
  label?: string;
}) {
  const style = useMemo(
    () => LEVEL_STYLE[(MEMBERSHIP_LEVELS as readonly string[]).includes(level) ? (level as MembershipLevel) : "BRONZE"],
    [level],
  );
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`${label}: ${clamped} of 100`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#EEF0F2" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={style.ring}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-2xl font-bold tabular-nums text-foreground">{clamped}</span>
        <span className="font-mono text-[10px] tabular-nums text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

/** Requirement progress bar (score to next tier, trips to next tier). */
export function RequirementBar({
  label,
  value,
  target,
  pct,
  achieved,
}: {
  label: string;
  value: string;
  target: string;
  pct: number;
  achieved: boolean;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="font-mono tabular-nums text-muted-foreground">
          {value} / {target}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", achieved ? "bg-status-verified" : "bg-[#C08A2E]")}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}
