import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { describeError } from "@/lib/errors";

export interface Truck {
  id: string;
  owner_id: string;
  registration_no: string;
  truck_type: string;
  capacity_tons: number;
  trailer_info: string | null;
  make_model: string | null;
  year: number | null;
  verification_status: string;
  is_available: boolean;
  current_lat: number | null;
  current_lng: number | null;
  location_updated_at: string | null;
  is_demo: boolean;
  created_at: string;
}

const TRUCK_COLUMNS =
  "id, owner_id, registration_no, truck_type, capacity_tons, trailer_info, make_model, year, verification_status, is_available, current_lat, current_lng, location_updated_at, is_demo, created_at";

export function useTrucks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["trucks", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<Truck[]> => {
      const { data, error } = await supabase
        .from("trucks")
        .select(TRUCK_COLUMNS)
        .order("registration_no");
      if (error) {
        console.error("Failed to load trucks", error.message);
        throw new Error(describeError(error));
      }
      return (data ?? []) as Truck[];
    },
  });
}

export interface TruckDraft {
  registration_no: string;
  truck_type: string;
  capacity_tons: number;
  trailer_info: string | null;
  make_model: string | null;
  year: number | null;
}

export function useCreateTruck() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (draft: TruckDraft) => {
      const { error } = await supabase.from("trucks").insert({ ...draft, owner_id: user!.id });
      if (error) throw new Error(describeError(error));
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["trucks"] }),
  });
}

export function useSetTruckAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ truckId, available }: { truckId: string; available: boolean }) => {
      const { error } = await supabase.from("trucks").update({ is_available: available }).eq("id", truckId);
      if (error) throw new Error(describeError(error));
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["trucks"] }),
  });
}

export interface DriverRecord {
  id: string;
  profile_id: string;
  truck_owner_id: string | null;
  assigned_truck_id: string | null;
  licence_no: string | null;
  licence_expiry: string | null;
  is_available: boolean;
  verification_status: string;
  completed_trips: number;
  rating: number | null;
  current_lat: number | null;
  current_lng: number | null;
  location_updated_at: string | null;
}

const DRIVER_COLUMNS =
  "id, profile_id, truck_owner_id, assigned_truck_id, licence_no, licence_expiry, is_available, verification_status, completed_trips, rating, current_lat, current_lng, location_updated_at";

/** The signed-in driver's own record (creates one on first visit). */
export function useMyDriverRecord() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["my-driver", user?.id],
    enabled: Boolean(user?.id) && profile?.role === "DRIVER",
    queryFn: async (): Promise<DriverRecord | null> => {
      const { data, error } = await supabase
        .from("drivers")
        .select(DRIVER_COLUMNS)
        .eq("profile_id", user!.id)
        .maybeSingle();
      if (error) throw new Error(describeError(error));

      if (!data) {
        const { data: created, error: createError } = await supabase
          .from("drivers")
          .insert({ profile_id: user!.id })
          .select(DRIVER_COLUMNS)
          .single();
        if (createError) {
          console.error("Could not create driver record", createError.message);
          return null;
        }
        void queryClient.invalidateQueries({ queryKey: ["drivers"] });
        return created as DriverRecord;
      }

      return data as DriverRecord;
    },
  });
}

export function useDrivers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["drivers", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<DriverRecord[]> => {
      const { data, error } = await supabase.from("drivers").select(DRIVER_COLUMNS);
      if (error) throw new Error(describeError(error));
      return (data ?? []) as DriverRecord[];
    },
  });
}

export function useSetDriverAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ driverId, available }: { driverId: string; available: boolean }) => {
      const { error } = await supabase.from("drivers").update({ is_available: available }).eq("id", driverId);
      if (error) throw new Error(describeError(error));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-driver"] });
      void queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
}

export function useUpdateDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ driverId, patch }: { driverId: string; patch: Partial<DriverRecord> }) => {
      const { error } = await supabase.from("drivers").update(patch).eq("id", driverId);
      if (error) throw new Error(describeError(error));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-driver"] });
      void queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
}

/** Maps drivers.id → driver display details, for labelling trips and offers. */
export function useDriverDirectory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["driver-directory", user?.id],
    enabled: Boolean(user?.id),
    staleTime: 60_000,
    queryFn: async (): Promise<Record<string, { name: string | null; phone: string | null; truckId: string | null; verification: string }>> => {
      const { data, error } = await supabase
        .from("drivers")
        .select("id, profile_id, assigned_truck_id, verification_status, profiles:profile_id (full_name, phone)");
      if (error) {
        console.error("Failed to load driver directory", error.message);
        return {};
      }

      const map: Record<string, { name: string | null; phone: string | null; truckId: string | null; verification: string }> = {};
      for (const row of data ?? []) {
        const linked = row.profiles as { full_name: string | null; phone: string | null } | null;
        map[row.id] = {
          name: linked?.full_name ?? null,
          phone: linked?.phone ?? null,
          truckId: row.assigned_truck_id,
          verification: row.verification_status,
        };
      }
      return map;
    },
  });
}

/** Profile summaries for a set of user ids — used to label drivers, agents, owners. */
export function useProfileLookup(ids: (string | null | undefined)[]) {
  const unique = Array.from(new Set(ids.filter((id): id is string => Boolean(id)))).sort();

  return useQuery({
    queryKey: ["profile-lookup", unique.join(",")],
    enabled: unique.length > 0,
    staleTime: 60_000,
    queryFn: async (): Promise<Record<string, { full_name: string | null; phone: string | null; company_name: string | null }>> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, company_name")
        .in("id", unique);
      if (error) {
        console.error("Failed to load profile lookup", error.message);
        return {};
      }
      const map: Record<string, { full_name: string | null; phone: string | null; company_name: string | null }> = {};
      for (const row of data ?? []) {
        map[row.id] = { full_name: row.full_name, phone: row.phone, company_name: row.company_name };
      }
      return map;
    },
  });
}
