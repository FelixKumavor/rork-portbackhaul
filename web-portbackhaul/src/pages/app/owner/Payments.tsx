import { CreditCard, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { DemoBadge } from "@/components/DemoBadge";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Seo } from "@/components/Seo";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useInitiatePayment, usePayments, useRequestPaymentRelease } from "@/hooks/use-payments";
import { useShipments } from "@/hooks/use-shipments";
import { useTrips } from "@/hooks/use-trips";
import { describeError } from "@/lib/errors";
import { formatDate, formatGhs } from "@/lib/format";

export default function Payments() {
  const { profile } = useAuth();
  const { data: payments, isLoading } = usePayments();
  const { data: shipments } = useShipments();
  const { data: trips } = useTrips();
  const initiate = useInitiatePayment();
  const requestRelease = useRequestPaymentRelease();
  const [busyId, setBusyId] = useState<string | null>(null);

  const shipmentByRef = useMemo(() => {
    const map = new Map<string, string>();
    for (const shipment of shipments ?? []) map.set(shipment.id, shipment.cargo_ref);
    return map;
  }, [shipments]);

  const tripByRef = useMemo(() => {
    const map = new Map<string, string>();
    for (const trip of trips ?? []) map.set(trip.id, trip.trip_ref);
    return map;
  }, [trips]);

  const totals = useMemo(() => {
    const rows = payments ?? [];
    return {
      held: rows.filter((p) => ["HELD", "RELEASE_REQUESTED"].includes(p.status)).reduce((sum, p) => sum + Number(p.amount_ghs), 0),
      released: rows.filter((p) => p.status === "RELEASED").reduce((sum, p) => sum + Number(p.amount_ghs), 0),
      pending: rows.filter((p) => ["PENDING", "AUTHORIZED"].includes(p.status)).reduce((sum, p) => sum + Number(p.amount_ghs), 0),
    };
  }, [payments]);

  async function handlePay(paymentTripId: string | null) {
    if (!paymentTripId) return;
    setBusyId(paymentTripId);
    try {
      const result = await initiate.mutateAsync(paymentTripId);
      if (result.authorization_url) {
        window.location.href = result.authorization_url;
      } else {
        toast.info(
          "Paystack is not configured yet. The payment record has been created and is awaiting provider credentials.",
        );
      }
    } catch (error) {
      toast.error(describeError(error, "Could not start the payment."));
    } finally {
      setBusyId(null);
    }
  }

  async function handleRelease(paymentId: string) {
    setBusyId(paymentId);
    try {
      await requestRelease.mutateAsync(paymentId);
      toast.success("Release requested. Funds move only after the platform confirms the conditions.");
    } catch (error) {
      toast.error(describeError(error));
    } finally {
      setBusyId(null);
    }
  }

  const isOwner = profile?.role === "CARGO_OWNER";

  return (
    <div className="mx-auto w-full max-w-[1200px] animate-fade space-y-7">
      <Seo title="Payments · PortBackhaul" description="Transport payments and release status." path="/app/payments" noIndex />

      <PageHeader
        eyebrow="Finance"
        title="Payments"
        subtitle="Transport fees are held until delivery is confirmed, then released to the carrier."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Awaiting payment" value={formatGhs(totals.pending)} />
        <Stat label="Held in escrow" value={formatGhs(totals.held)} tone="pending" />
        <Stat label="Released" value={formatGhs(totals.released)} tone="verified" />
      </div>

      {isLoading ? (
        <div className="panel p-6 text-sm text-muted-foreground">Loading payments…</div>
      ) : (payments ?? []).length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={CreditCard}
            title="No payments yet"
            description="A payment record is created when a driver accepts a trip for one of your shipments."
          />
        </div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <Th>Reference</Th>
                <Th>Cargo</Th>
                <Th>Trip</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th className="text-right">Action</Th>
              </tr>
            </thead>
            <tbody>
              {(payments ?? []).map((payment) => (
                <tr key={payment.id} className="data-grid-row">
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-xs tabular">{payment.provider_reference ?? "—"}</span>
                      {payment.is_demo ? <DemoBadge /> : null}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono tabular">
                    {payment.shipment_id ? (shipmentByRef.get(payment.shipment_id) ?? "—") : "—"}
                  </td>
                  <td className="px-5 py-4 font-mono tabular text-muted-foreground">
                    {payment.trip_id ? (tripByRef.get(payment.trip_id) ?? "—") : "—"}
                  </td>
                  <td className="px-5 py-4 font-mono font-semibold tabular">{formatGhs(payment.amount_ghs)}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={payment.status} raw />
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{formatDate(payment.created_at)}</td>
                  <td className="px-5 py-4 text-right">
                    {isOwner && payment.status === "PENDING" ? (
                      <Button size="sm" onClick={() => void handlePay(payment.trip_id)} disabled={busyId === payment.trip_id}>
                        {busyId === payment.trip_id ? (
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ExternalLink className="mr-2 h-3.5 w-3.5" />
                        )}
                        Pay
                      </Button>
                    ) : isOwner && payment.status === "HELD" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleRelease(payment.id)}
                        disabled={busyId === payment.id}
                      >
                        Request release
                      </Button>
                    ) : payment.trip_id ? (
                      <Button asChild size="sm" variant="ghost">
                        <Link to={`/app/trips/${payment.trip_id}`}>View trip</Link>
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="panel flex items-start gap-3 p-5">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <p className="text-sm leading-relaxed text-muted-foreground">
          All payment operations run on secure server-side functions. PortBackhaul never stores raw card details and
          no provider secret keys exist in this application. Funds are never transferred automatically before the
          agreed delivery conditions are satisfied.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "pending" | "verified" }) {
  const accent =
    tone === "pending" ? "text-status-pending" : tone === "verified" ? "text-status-verified" : "text-foreground";
  return (
    <div className="panel p-5">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className={`mt-1 font-mono text-2xl font-extrabold tabular ${accent}`}>{value}</p>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground ${className ?? ""}`}>
      {children}
    </th>
  );
}
