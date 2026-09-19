import { Loader2, Plus, Truck } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { DemoBadge } from "@/components/DemoBadge";
import { EmptyState } from "@/components/EmptyState";
import { QueryErrorState } from "@/components/QueryErrorState";
import { PageHeader } from "@/components/PageHeader";
import { Seo } from "@/components/Seo";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { useCreateTruck, useSetTruckAvailability, useTrucks } from "@/hooks/use-fleet";
import { usePayouts } from "@/hooks/use-payments";
import { useTrips } from "@/hooks/use-trips";
import { describeError } from "@/lib/errors";
import { formatGhs, relativeTime } from "@/lib/format";
import { TRUCK_TYPES } from "@/lib/status";

export default function FleetTrucks() {
  const { profile, user } = useAuth();
  const { data: trucks, isLoading, isError, error, refetch } = useTrucks();
  const { data: trips } = useTrips();
  const { data: payouts } = usePayouts();
  const createTruck = useCreateTruck();
  const setAvailability = useSetTruckAvailability();

  const [open, setOpen] = useState<boolean>(false);
  const [registration, setRegistration] = useState<string>("");
  const [truckType, setTruckType] = useState<string>("FLATBED");
  const [capacity, setCapacity] = useState<string>("");
  const [trailer, setTrailer] = useState<string>("");
  const [makeModel, setMakeModel] = useState<string>("");
  const [year, setYear] = useState<string>("");

  const myTrucks = useMemo(() => (trucks ?? []).filter((t) => t.owner_id === user?.id), [trucks, user]);

  const activeJobs = useMemo(
    () => (trips ?? []).filter((t) => !["COMPLETED", "CANCELLED"].includes(t.status)).length,
    [trips],
  );
  const completedJobs = useMemo(() => (trips ?? []).filter((t) => t.status === "COMPLETED").length, [trips]);
  const earnings = useMemo(
    () => (payouts ?? []).filter((p) => p.status === "PAID").reduce((sum, p) => sum + Number(p.amount_ghs), 0),
    [payouts],
  );

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await createTruck.mutateAsync({
        registration_no: registration.trim().toUpperCase(),
        truck_type: truckType,
        capacity_tons: Number(capacity),
        trailer_info: trailer.trim() || null,
        make_model: makeModel.trim() || null,
        year: year ? Number(year) : null,
      });
      toast.success("Truck registered. It becomes bookable once an administrator verifies its documents.");
      setOpen(false);
      setRegistration("");
      setCapacity("");
      setTrailer("");
      setMakeModel("");
      setYear("");
    } catch (error) {
      toast.error(describeError(error, "Could not register the truck."));
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] animate-fade space-y-7">
      <Seo title="My fleet · PortBackhaul" description="Manage your trucks and drivers." path="/app/fleet" noIndex />

      <PageHeader
        eyebrow="Truck Owner Dashboard"
        title={`Welcome back, ${profile?.full_name ?? "there"}`}
        subtitle={profile?.company_name ?? "Register trucks, manage drivers and track earnings."}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Register truck
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Trucks" value={String(myTrucks.length)} />
        <Stat label="Active jobs" value={String(activeJobs)} />
        <Stat label="Completed jobs" value={String(completedJobs)} />
        <Stat label="Earnings paid" value={formatGhs(earnings)} mono />
      </div>

      {isError ? (
        <div className="panel">
          <QueryErrorState error={error} onRetry={() => void refetch()} subject="fleet" compact />
        </div>
      ) : isLoading ? (
        <div className="panel p-6 text-sm text-muted-foreground">Loading fleet…</div>
      ) : myTrucks.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={Truck}
            title="No trucks registered"
            description="Register your first truck and upload its documents for verification."
            action={<Button onClick={() => setOpen(true)}>Register truck</Button>}
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {myTrucks.map((truck) => (
            <article key={truck.id} className="panel animate-rise p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-mono text-base font-bold tabular">
                    {truck.registration_no}
                    {truck.is_demo ? <DemoBadge /> : null}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {truck.capacity_tons}T {truck.truck_type.replace(/_/g, " ").toLowerCase()}
                  </p>
                </div>
                <StatusBadge status={truck.verification_status} raw />
              </div>

              <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                <Row label="Model" value={truck.make_model ?? "—"} />
                <Row label="Year" value={truck.year ? String(truck.year) : "—"} />
                <Row label="Trailer" value={truck.trailer_info ?? "—"} />
                <Row label="Last seen" value={relativeTime(truck.location_updated_at)} />
              </dl>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
                <span className="text-sm font-medium">
                  {truck.is_available ? "Available for jobs" : "Unavailable"}
                </span>
                <Switch
                  checked={truck.is_available}
                  disabled={truck.verification_status !== "VERIFIED"}
                  onCheckedChange={(checked) =>
                    setAvailability.mutate(
                      { truckId: truck.id, available: checked },
                      { onError: (error) => toast.error(describeError(error)) },
                    )
                  }
                  aria-label={`Availability for ${truck.registration_no}`}
                />
              </div>

              {truck.verification_status !== "VERIFIED" ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Verification pending — this truck cannot be matched to cargo yet.
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link to="/app/fleet/drivers">Manage drivers</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/app/fleet/jobs">Jobs & earnings</Link>
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register a truck</DialogTitle>
            <DialogDescription>
              Trucks become bookable only after an administrator verifies their documents.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reg">Registration number</Label>
              <Input
                id="reg"
                required
                className="font-mono"
                placeholder="GT-0000-00"
                value={registration}
                onChange={(e) => setRegistration(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="type">Truck type</Label>
                <Select value={truckType} onValueChange={setTruckType}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRUCK_TYPES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cap">Capacity (tons)</Label>
                <Input id="cap" type="number" min={1} step="0.5" required value={capacity} onChange={(e) => setCapacity(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="model">Make & model</Label>
                <Input id="model" value={makeModel} onChange={(e) => setMakeModel(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="year">Year</Label>
                <Input id="year" type="number" min={1980} max={2100} value={year} onChange={(e) => setYear(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="trailer">Trailer information</Label>
              <Input id="trailer" value={trailer} onChange={(e) => setTrailer(e.target.value)} placeholder="e.g. 3-axle flatbed trailer" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createTruck.isPending}>
                {createTruck.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Register truck
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate text-right font-medium">{value}</dd>
    </div>
  );
}
