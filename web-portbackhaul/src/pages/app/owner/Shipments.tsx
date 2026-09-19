import { Package, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { DemoBadge } from "@/components/DemoBadge";
import { EmptyState } from "@/components/EmptyState";
import { QueryErrorState } from "@/components/QueryErrorState";
import { PageHeader } from "@/components/PageHeader";
import { Seo } from "@/components/Seo";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useShipments } from "@/hooks/use-shipments";
import { useTrips } from "@/hooks/use-trips";
import { formatDate, formatGhs, formatWeight } from "@/lib/format";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "ACTIVE", label: "Active" },
  { key: "DRAFT", label: "Drafts" },
  { key: "COMPLETED", label: "Completed" },
] as const;

const ACTIVE_STATUSES = [
  "SUBMITTED",
  "CLEARANCE_IN_PROGRESS",
  "READY_FOR_TRANSPORT",
  "TRUCK_REQUESTED",
  "TRUCK_ASSIGNED",
  "LOADING",
  "IN_TRANSIT",
  "ARRIVED_DESTINATION",
];

export default function Shipments() {
  const { profile } = useAuth();
  const { data: shipments, isLoading, isError, error, refetch } = useShipments();
  const { data: trips } = useTrips();
  const [tab, setTab] = useState<string>("ACTIVE");

  const tripByShipment = useMemo(() => {
    const map = new Map<string, NonNullable<typeof trips>[number]>();
    for (const trip of trips ?? []) if (!map.has(trip.shipment_id)) map.set(trip.shipment_id, trip);
    return map;
  }, [trips]);

  const buckets = useMemo(() => {
    const all = shipments ?? [];
    return {
      ACTIVE: all.filter((s) => ACTIVE_STATUSES.includes(s.status)),
      DRAFT: all.filter((s) => s.status === "DRAFT"),
      COMPLETED: all.filter((s) => ["DELIVERED", "COMPLETED", "CANCELLED", "DISPUTED"].includes(s.status)),
    } as Record<string, NonNullable<typeof shipments>>;
  }, [shipments]);

  const rows = buckets[tab] ?? [];

  return (
    <div className="mx-auto w-full max-w-[1300px] animate-fade space-y-7">
      <Seo title="My shipments · PortBackhaul" description="Your cargo shipments." path="/app/shipments" noIndex />

      <PageHeader
        eyebrow="Cargo Owner Dashboard"
        title={`Welcome back, ${profile?.full_name ?? "there"}`}
        subtitle={profile?.company_name ?? "Create, track and close out your shipments."}
        actions={
          <Button asChild>
            <Link to="/app/shipments/new">
              <Plus className="mr-2 h-4 w-4" />
              Create shipment
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Active shipments" value={buckets.ACTIVE.length} />
        <Stat label="Drafts" value={buckets.DRAFT.length} />
        <Stat label="Completed" value={buckets.COMPLETED.length} />
      </div>

      <div className="flex gap-2 border-b border-border" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
              tab === item.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label} ({buckets[item.key].length})
          </button>
        ))}
      </div>

      {isError ? (
        <div className="panel">
          <QueryErrorState error={error} onRetry={() => void refetch()} subject="shipments" compact />
        </div>
      ) : isLoading ? (
        <div className="panel p-6 text-sm text-muted-foreground">Loading shipments…</div>
      ) : rows.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={Package}
            title={tab === "DRAFT" ? "No drafts" : tab === "COMPLETED" ? "Nothing completed yet" : "No active shipments"}
            description="Create a shipment, assign a clearing agent and we'll match it with a verified truck."
            action={
              <Button asChild>
                <Link to="/app/shipments/new">Create shipment</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((shipment) => {
            const trip = tripByShipment.get(shipment.id);
            return (
              <Link
                key={shipment.id}
                to={`/app/shipments/${shipment.id}`}
                className="panel animate-rise flex flex-col p-5 transition-all hover:border-primary/40 hover:shadow-[0_2px_8px_rgba(27,38,59,0.08)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold tabular">{shipment.cargo_ref}</span>
                    {shipment.is_demo ? <DemoBadge /> : null}
                  </span>
                  <StatusBadge status={shipment.status} raw />
                </div>

                <h2 className="mt-3 text-base font-bold">{shipment.description}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {shipment.pickup_location_text ?? "—"} → {shipment.destination_city ?? "—"}
                </p>

                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
                  <div>
                    <dt className="eyebrow mb-0.5">Weight</dt>
                    <dd className="font-medium tabular">{formatWeight(shipment.weight_kg)}</dd>
                  </div>
                  <div>
                    <dt className="eyebrow mb-0.5">Fee</dt>
                    <dd className="font-mono font-medium tabular">{formatGhs(shipment.transport_fee_ghs)}</dd>
                  </div>
                  <div>
                    <dt className="eyebrow mb-0.5">Pickup</dt>
                    <dd className="font-medium">{formatDate(shipment.expected_pickup_date)}</dd>
                  </div>
                  <div>
                    <dt className="eyebrow mb-0.5">Trip</dt>
                    <dd className="font-mono font-medium tabular">{trip?.trip_ref ?? "—"}</dd>
                  </div>
                </dl>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel p-5">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tabular">{value}</p>
    </div>
  );
}
