import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  Loader2,
  PackageCheck,
  QrCode,
  ScanLine,
  Truck,
  User,
  XCircle,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/PageHeader";
import { Seo } from "@/components/Seo";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { CUSTOMS_DISCLAIMER } from "@/lib/customsIntegration";
import { describeError } from "@/lib/errors";

interface VerifiedTrip {
  trip_id: string;
  trip_ref: string;
  trip_status: string;
  cargo_ref: string;
  cargo_description: string;
  container_number: string | null;
  destination: string | null;
  pickup: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  truck_registration: string | null;
  truck_type: string | null;
  truck_capacity_tons: number | null;
  clearing_agent: string | null;
  loading_status: string;
}

export default function LoadingPoint() {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string>("");
  const [trip, setTrip] = useState<VerifiedTrip | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [location, setLocation] = useState<string>("");

  const verify = useMutation({
    mutationFn: async (value: string): Promise<VerifiedTrip> => {
      const { data, error } = await supabase.rpc("verify_trip_qr", { p_token: value.trim() });
      if (error) throw new Error(describeError(error));
      return data as unknown as VerifiedTrip;
    },
    onSuccess: (data) => {
      setTrip(data);
      toast.success(`Verified ${data.trip_ref}`);
    },
    onError: (error) => {
      setTrip(null);
      toast.error(describeError(error, "Verification failed."));
    },
  });

  const act = useMutation({
    mutationFn: async (action: string) => {
      const { error } = await supabase.rpc("loading_action", {
        p_trip_id: trip!.trip_id,
        p_action: action,
        p_notes: notes || undefined,
        p_location: location || undefined,
      });
      if (error) throw new Error(describeError(error));
    },
    onSuccess: (_result, action) => {
      toast.success(`${action.replace(/_/g, " ").toLowerCase()} recorded`);
      setNotes("");
      void queryClient.invalidateQueries({ queryKey: ["trips"] });
      if (token) verify.mutate(token);
    },
    onError: (error) => toast.error(describeError(error)),
  });

  function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token.trim()) {
      toast.error("Scan or paste the driver's QR token.");
      return;
    }
    verify.mutate(token);
  }

  return (
    <div className="mx-auto w-full max-w-[900px] animate-fade space-y-6">
      <Seo title="Loading point · PortBackhaul" description="Verify trips at the loading point." path="/app/loading" noIndex />

      <PageHeader
        eyebrow="Loading / Terminal Operator"
        title="Verify a trip"
        subtitle="Scan the driver's QR code to confirm the trip, driver, truck and cargo before loading."
      />

      <form onSubmit={handleVerify} className="panel p-6">
        <Label htmlFor="token" className="flex items-center gap-2 text-base font-bold">
          <ScanLine className="h-5 w-5" aria-hidden />
          QR token
        </Label>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Scan with your handheld scanner (it types the token), or paste it here.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Input
            id="token"
            className="h-14 flex-1 font-mono text-base"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Scan QR code…"
            autoFocus
          />
          <Button type="submit" size="lg" className="h-14 sm:w-40" disabled={verify.isPending}>
            {verify.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <QrCode className="mr-2 h-5 w-5" />}
            Verify
          </Button>
        </div>
      </form>

      {trip ? (
        <>
          <section className="panel animate-rise overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-status-verified-bg px-6 py-4">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-status-verified" aria-hidden />
                <span className="font-mono text-lg font-extrabold tabular text-status-verified">{trip.trip_ref}</span>
              </div>
              <StatusBadge status={trip.trip_status} raw />
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-2">
              <Block icon={Box} title="Cargo">
                <Row label="Cargo ID" value={trip.cargo_ref} mono />
                <Row label="Description" value={trip.cargo_description} />
                <Row label="Container" value={trip.container_number ?? "—"} mono />
                <Row label="Destination" value={trip.destination ?? "—"} />
              </Block>

              <Block icon={User} title="Driver">
                <Row label="Name" value={trip.driver_name ?? "—"} />
                <Row label="Phone" value={trip.driver_phone ?? "—"} mono />
                <Row label="Clearing agent" value={trip.clearing_agent ?? "—"} />
              </Block>

              <Block icon={Truck} title="Truck">
                <Row label="Registration" value={trip.truck_registration ?? "—"} mono />
                <Row label="Type" value={trip.truck_type?.replace(/_/g, " ") ?? "—"} />
                <Row label="Capacity" value={trip.truck_capacity_tons ? `${trip.truck_capacity_tons}T` : "—"} />
              </Block>

              <Block icon={PackageCheck} title="Loading">
                <Row label="Pickup point" value={trip.pickup ?? "—"} />
                <Row label="Current status" value={trip.loading_status.replace(/_/g, " ")} />
              </Block>
            </div>
          </section>

          <section className="panel p-6">
            <h2 className="text-base font-bold">Record an action</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Every action is written to the audit log with your identity and a timestamp.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="loc">Location / gate</Label>
                <Input id="loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Tema Terminal 2, Gate 3" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Required when reporting an issue" />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button
                size="lg"
                className="h-14"
                onClick={() => act.mutate("ARRIVAL_CONFIRMED")}
                disabled={act.isPending}
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Confirm arrival
              </Button>
              <Button
                size="lg"
                className="h-14"
                onClick={() => act.mutate("LOADING_CONFIRMED")}
                disabled={act.isPending}
              >
                <PackageCheck className="mr-2 h-5 w-5" />
                Confirm loading
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14"
                onClick={() => act.mutate("ISSUE_REPORTED")}
                disabled={act.isPending}
              >
                <AlertTriangle className="mr-2 h-5 w-5" />
                Report issue
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 border-destructive/40 text-destructive hover:bg-destructive/5"
                onClick={() => act.mutate("VERIFICATION_REJECTED")}
                disabled={act.isPending}
              >
                <XCircle className="mr-2 h-5 w-5" />
                Reject verification
              </Button>
            </div>
          </section>
        </>
      ) : null}

      <div className="panel flex items-start gap-3 p-5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <p className="text-xs leading-relaxed text-muted-foreground">
          This verification is a PortBackhaul logistics workflow record. {CUSTOMS_DISCLAIMER} It does not replace any
          Customs, GPHA or port security process or documentation.
        </p>
      </div>
    </div>
  );
}

function Block({ icon: Icon, title, children }: { icon: typeof Box; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-bold">
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
        {title}
      </h3>
      <dl className="mt-3 space-y-2 text-sm">{children}</dl>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className={`min-w-0 truncate text-right font-medium ${mono ? "font-mono tabular" : ""}`}>{value}</dd>
    </div>
  );
}
