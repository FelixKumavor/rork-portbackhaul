import { Users } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Seo } from "@/components/Seo";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useDriverDirectory, useDrivers, useTrucks, useUpdateDriver } from "@/hooks/use-fleet";
import { describeError } from "@/lib/errors";
import { formatDate } from "@/lib/format";

export default function FleetDrivers() {
  const { user } = useAuth();
  const { data: drivers, isLoading } = useDrivers();
  const { data: directory } = useDriverDirectory();
  const { data: trucks } = useTrucks();
  const updateDriver = useUpdateDriver();

  const myTrucks = useMemo(() => (trucks ?? []).filter((t) => t.owner_id === user?.id), [trucks, user]);

  // Drivers linked to this owner, plus any verified driver available to recruit.
  const myDrivers = useMemo(() => (drivers ?? []).filter((d) => d.truck_owner_id === user?.id), [drivers, user]);
  const unlinked = useMemo(
    () => (drivers ?? []).filter((d) => d.truck_owner_id !== user?.id && d.verification_status === "VERIFIED"),
    [drivers, user],
  );

  function assignTruck(driverId: string, truckId: string) {
    updateDriver.mutate(
      { driverId, patch: { assigned_truck_id: truckId === "NONE" ? null : truckId, truck_owner_id: user!.id } },
      {
        onSuccess: () => toast.success("Driver assignment updated"),
        onError: (error) => toast.error(describeError(error)),
      },
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] animate-fade space-y-7">
      <Seo title="Drivers · PortBackhaul" description="Manage the drivers in your fleet." path="/app/fleet/drivers" noIndex />

      <PageHeader
        eyebrow="Truck Owner"
        title="Drivers"
        subtitle="Link verified drivers to your trucks. Only verified drivers can be matched to cargo."
      />

      {isLoading ? (
        <div className="panel p-6 text-sm text-muted-foreground">Loading drivers…</div>
      ) : myDrivers.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={Users}
            title="No drivers linked yet"
            description="Drivers register their own accounts. Once verified, link them to one of your trucks below."
          />
        </div>
      ) : (
        <div className="panel divide-y divide-border">
          {myDrivers.map((driver) => {
            const info = directory?.[driver.id];
            return (
              <div key={driver.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <p className="font-semibold">{info?.name ?? "Driver"}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {info?.phone ?? "—"} · Licence {driver.licence_no ?? "—"}
                    {driver.licence_expiry ? ` · expires ${formatDate(driver.licence_expiry)}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground tabular">
                    {driver.completed_trips} completed trips
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={driver.verification_status} raw />
                  <StatusBadge status={driver.is_available ? "APPROVED" : "PENDING"} />
                  <Select
                    value={driver.assigned_truck_id ?? "NONE"}
                    onValueChange={(value) => assignTruck(driver.id, value)}
                  >
                    <SelectTrigger className="w-48" aria-label={`Assign truck to ${info?.name ?? "driver"}`}>
                      <SelectValue placeholder="Assign truck" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">No truck</SelectItem>
                      {myTrucks.map((truck) => (
                        <SelectItem key={truck.id} value={truck.id}>
                          {truck.registration_no}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {unlinked.length > 0 ? (
        <section className="panel p-6">
          <h2 className="text-base font-bold">Verified drivers available</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Assign one of your trucks to bring a verified driver into your fleet.
          </p>
          <div className="mt-4 divide-y divide-border">
            {unlinked.slice(0, 8).map((driver) => {
              const info = directory?.[driver.id];
              return (
                <div key={driver.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{info?.name ?? "Driver"}</p>
                    <p className="text-sm text-muted-foreground tabular">{driver.completed_trips} trips completed</p>
                  </div>
                  <Select value="NONE" onValueChange={(value) => assignTruck(driver.id, value)}>
                    <SelectTrigger className="w-48" aria-label={`Recruit ${info?.name ?? "driver"}`}>
                      <SelectValue placeholder="Assign a truck" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">No truck</SelectItem>
                      {myTrucks.map((truck) => (
                        <SelectItem key={truck.id} value={truck.id}>
                          {truck.registration_no}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
