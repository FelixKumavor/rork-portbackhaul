import { CreditCard, Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { DemoBadge } from "@/components/DemoBadge";
import { EmptyState } from "@/components/EmptyState";
import { MomoPaymentDialog, type MomoPaymentTarget } from "@/components/MomoPaymentDialog";
import { PageHeader } from "@/components/PageHeader";
import { QueryErrorState } from "@/components/QueryErrorState";
import { Seo } from "@/components/Seo";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import {
  useMomoTransactions,
  usePaymentRecipient,
  usePayments,
  useRequestPaymentRelease,
  useSaveRecipient,
} from "@/hooks/use-payments";
import { useShipments } from "@/hooks/use-shipments";
import { useTrips } from "@/hooks/use-trips";
import { describeError } from "@/lib/errors";
import { formatDate, formatGhs } from "@/lib/format";

const NETWORKS = [
  { value: "MTN", label: "MTN MoMo" },
  { value: "TELECEL", label: "Telecel Cash" },
  { value: "AIRTEL_TIGO", label: "AirtelTigo Money" },
];

export default function Payments() {
  const { profile } = useAuth();
  const { data: payments, isLoading, isError, error, refetch } = usePayments();
  const { data: shipments } = useShipments();
  const { data: trips } = useTrips();
  const requestRelease = useRequestPaymentRelease();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [payTarget, setPayTarget] = useState<MomoPaymentTarget | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

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

  function openMomo(payment: { id: string; trip_id: string | null; amount_ghs: number }) {
    const tripRef = payment.trip_id ? tripByRef.get(payment.trip_id) : null;
    setPayTarget({
      paymentId: payment.id,
      amountGhs: Number(payment.amount_ghs),
      label: `Transport fee${tripRef ? ` · trip ${tripRef}` : ""}`,
    });
    setDialogOpen(true);
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
  const isCarrier = profile?.role === "TRUCK_OWNER" || profile?.role === "DRIVER";

  return (
    <div className="mx-auto w-full max-w-[1200px] animate-fade space-y-7">
      <Seo title="Payments · PortBackhaul" description="Transport payments and release status." path="/app/payments" noIndex />

      <PageHeader
        eyebrow="Finance"
        title="Payments"
        subtitle="Pay transport fees with mobile money. Funds are held until delivery is confirmed, then settled automatically."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Awaiting payment" value={formatGhs(totals.pending)} />
        <Stat label="Held in escrow" value={formatGhs(totals.held)} tone="pending" />
        <Stat label="Released" value={formatGhs(totals.released)} tone="verified" />
      </div>

      {isCarrier ? <PayoutDetailsPanel /> : null}

      {isError ? (
        <div className="panel">
          <QueryErrorState error={error} onRetry={() => void refetch()} subject="payments" compact />
        </div>
      ) : isLoading ? (
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
                      <Button size="sm" onClick={() => openMomo(payment)}>
                        <Smartphone className="mr-2 h-3.5 w-3.5" />
                        Pay by MoMo
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

      <MomoTransactionsPanel />

      <div className="panel flex items-start gap-3 p-5">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <p className="text-sm leading-relaxed text-muted-foreground">
          All payment operations run on secure server-side functions. PortBackhaul never sees your MoMo PIN and no
          provider secret keys exist in this application. A payment is only marked successful after Paystack confirms
          it, and the carrier settlement (90% after the platform commission) is recorded automatically.
        </p>
      </div>

      <MomoPaymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        target={payTarget}
        onSettled={() => void refetch()}
      />
    </div>
  );
}

/** Carrier payout details — registered and verified through Paystack server-side. */
function PayoutDetailsPanel() {
  const { data: recipient, isLoading, isError, error, refetch } = usePaymentRecipient();
  const save = useSaveRecipient();

  const [fullName, setFullName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [network, setNetwork] = useState<string>("MTN");
  const [busy, setBusy] = useState<boolean>(false);

  useEffect(() => {
    if (recipient) {
      setFullName(recipient.full_name ?? "");
      setPhone(recipient.phone ?? "");
      setNetwork(recipient.momo_provider ?? "MTN");
    }
  }, [recipient]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await save.mutateAsync({
        fullName: fullName.trim(),
        phone: phone.trim(),
        momoNetwork: network,
      });
      if (result.verification_status === "VERIFIED") {
        toast.success("Payout details verified with Paystack.");
      } else {
        toast.info("Payout details saved. They will be verified when the payment provider is connected.");
      }
    } catch (err) {
      toast.error(describeError(err, "Could not save your payout details."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold">
            <Smartphone className="h-4 w-4 text-primary" aria-hidden />
            Mobile money payout details
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Where your 90% settlement is sent after a delivery payment is confirmed.
          </p>
        </div>
        {recipient ? <StatusBadge status={recipient.verification_status} raw /> : null}
      </div>

      {isError ? (
        <QueryErrorState error={error} onRetry={() => void refetch()} subject="payout details" compact />
      ) : isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading payout details…</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="payout-name">Wallet holder name</Label>
            <Input id="payout-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="payout-phone">Mobile money number</Label>
            <Input
              id="payout-phone"
              type="tel"
              inputMode="tel"
              placeholder="024 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="payout-network">Network</Label>
            <Select value={network} onValueChange={setNetwork}>
              <SelectTrigger id="payout-network" className="w-40" aria-label="Mobile money network">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NETWORKS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={busy} className="h-10">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save details
          </Button>
        </form>
      )}
    </section>
  );
}

/** Mobile Money transactions — server-confirmed state only (never optimistic). */
function MomoTransactionsPanel() {
  const { data: transactions, isLoading, isError, error, refetch } = useMomoTransactions();
  const rows = transactions ?? [];

  return (
    <section>
      <h2 className="eyebrow mb-3">Mobile money transactions</h2>
      <div className="panel overflow-hidden">
        {isError ? (
          <QueryErrorState error={error} onRetry={() => void refetch()} subject="transactions" compact />
        ) : isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading transactions…</div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Smartphone}
            title="No mobile money transactions yet"
            description="Transactions appear here once you pay a transport fee by MoMo."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left">
                  <Th>Reference</Th>
                  <Th>Amount</Th>
                  <Th>Network</Th>
                  <Th>Payment</Th>
                  <Th>Payout</Th>
                  <Th>Date</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((txn) => (
                  <tr key={txn.reference} className="data-grid-row">
                    <td className="px-5 py-4 font-mono text-xs tabular">{txn.reference}</td>
                    <td className="px-5 py-4 font-mono font-semibold tabular">
                      {formatGhs(Number(txn.amount_pesewas) / 100)}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{txn.momo_provider.replace(/_/g, " ")}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={txn.status} raw />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={txn.payout_status} raw />
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{formatDate(txn.created_at ?? "")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
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
