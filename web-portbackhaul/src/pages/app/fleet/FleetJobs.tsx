import { Briefcase } from "lucide-react";
import { useMemo } from "react";

import { EmptyState } from "@/components/EmptyState";
import { QueryErrorState } from "@/components/QueryErrorState";
import { PageHeader } from "@/components/PageHeader";
import { Seo } from "@/components/Seo";
import { StatusBadge } from "@/components/StatusBadge";
import { useDriverDirectory, useTrucks } from "@/hooks/use-fleet";
import { usePayouts } from "@/hooks/use-payments";
import { useTrips } from "@/hooks/use-trips";
import { formatDate, formatGhs } from "@/lib/format";

export default function FleetJobs() {
  const { data: trips, isLoading, isError, error, refetch } = useTrips();
  const { data: trucks } = useTrucks();
  const { data: drivers } = useDriverDirectory();
  const { data: payouts } = usePayouts();

  const truckRef = useMemo(() => {
    const map = new Map<string, string>();
    for (const truck of trucks ?? []) map.set(truck.id, truck.registration_no);
    return map;
  }, [trucks]);

  const totals = useMemo(() => {
    const rows = payouts ?? [];
    return {
      paid: rows.filter((p) => p.status === "PAID").reduce((sum, p) => sum + Number(p.amount_ghs), 0),
      pending: rows.filter((p) => !["PAID", "CANCELLED"].includes(p.status)).reduce((sum, p) => sum + Number(p.amount_ghs), 0),
    };
  }, [payouts]);

  const rows = trips ?? [];

  return (
    <div className="mx-auto w-full max-w-[1200px] animate-fade space-y-7">
      <Seo title="Jobs & earnings · PortBackhaul" description="Fleet jobs and earnings." path="/app/fleet/jobs" noIndex />

      <PageHeader eyebrow="Truck Owner" title="Jobs & earnings" subtitle="Every trip run by your trucks and drivers." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total jobs" value={String(rows.length)} />
        <Stat label="Earnings paid" value={formatGhs(totals.paid)} mono />
        <Stat label="Awaiting payout" value={formatGhs(totals.pending)} mono />
      </div>

      {isError ? (
        <div className="panel">
          <QueryErrorState error={error} onRetry={() => void refetch()} subject="jobs" compact />
        </div>
      ) : isLoading ? (
        <div className="panel p-6 text-sm text-muted-foreground">Loading jobs…</div>
      ) : rows.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={Briefcase}
            title="No jobs yet"
            description="When your drivers accept cargo, the resulting trips appear here."
          />
        </div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <Th>Trip</Th>
                <Th>Route</Th>
                <Th>Truck</Th>
                <Th>Driver</Th>
                <Th>Fee</Th>
                <Th>Status</Th>
                <Th>Assigned</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((trip) => (
                <tr key={trip.id} className="data-grid-row">
                  <td className="px-5 py-4 font-mono font-semibold tabular">{trip.trip_ref}</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {trip.pickup_location_text} → {trip.destination_text}
                  </td>
                  <td className="px-5 py-4 font-mono tabular">{truckRef.get(trip.truck_id) ?? "—"}</td>
                  <td className="px-5 py-4">{drivers?.[trip.driver_id]?.name ?? "—"}</td>
                  <td className="px-5 py-4 font-mono tabular">{formatGhs(trip.transport_fee_ghs)}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={trip.status} raw />
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{formatDate(trip.assigned_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="panel p-5">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold tabular ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{children}</th>;
}
