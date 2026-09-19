import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { describeError } from "@/lib/errors";

export interface ShipmentAssignment {
  id: string;
  shipment_id: string;
  requested_by: string;
  truck_type: string;
  required_capacity_tons: number;
  pickup_at: string | null;
  route_origin: string | null;
  route_destination: string | null;
  requirements_notes: string | null;
  offered_fee_ghs: number | null;
  truck_id: string | null;
  driver_id: string | null;
  status: string;
  decline_reason: string | null;
  responded_at: string | null;
  created_at: string;
}

const ASSIGNMENT_COLUMNS =
  "id, shipment_id, requested_by, truck_type, required_capacity_tons, pickup_at, route_origin, route_destination, requirements_notes, offered_fee_ghs, truck_id, driver_id, status, decline_reason, responded_at, created_at";

export function useAssignments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["assignments", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<ShipmentAssignment[]> => {
      const { data, error } = await supabase
        .from("shipment_assignments")
        .select(ASSIGNMENT_COLUMNS)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Failed to load assignments", error.message);
        throw new Error(describeError(error));
      }
      return (data ?? []) as ShipmentAssignment[];
    },
  });
}

export interface MatchedTruck {
  truck_id: string;
  registration_no: string;
  truck_type: string;
  capacity_tons: number;
  verification_status: string;
  is_available: boolean;
  distance_km: number | null;
  driver_id: string | null;
  driver_name: string | null;
  driver_verification: string | null;
  driver_available: boolean | null;
}

/**
 * Server-side matching: capacity, type, verification, availability and distance
 * from the pickup point, ranked with the nearest available driver first.
 */
export function useMatchedTrucks(params: {
  truckType: string | null;
  capacity: number;
  lat?: number | null;
  lng?: number | null;
  enabled?: boolean;
}) {
  const { truckType, capacity, lat, lng, enabled = true } = params;

  return useQuery({
    queryKey: ["matched-trucks", truckType, capacity, lat, lng],
    enabled: enabled && capacity > 0,
    queryFn: async (): Promise<MatchedTruck[]> => {
      const { data, error } = await supabase.rpc("match_trucks", {
        p_truck_type: truckType ?? undefined,
        p_capacity: capacity,
        p_lat: lat ?? undefined,
        p_lng: lng ?? undefined,
        p_limit: 10,
      });
      if (error) {
        console.error("Truck matching failed", error.message);
        throw new Error(describeError(error));
      }
      return (data ?? []) as MatchedTruck[];
    },
  });
}

export interface RequestTruckInput {
  shipmentId: string;
  truckType: string;
  capacity: number;
  pickupAt: string | null;
  origin: string;
  destination: string;
  notes?: string | null;
  fee?: number | null;
  truckId?: string | null;
}

export function useRequestTruck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RequestTruckInput) => {
      const { error } = await supabase.rpc("request_truck", {
        p_shipment_id: input.shipmentId,
        p_truck_type: input.truckType,
        p_capacity: input.capacity,
        p_pickup_at: input.pickupAt ?? undefined,
        p_origin: input.origin,
        p_destination: input.destination,
        p_notes: input.notes ?? undefined,
        p_fee: input.fee ?? undefined,
        p_truck_id: input.truckId ?? undefined,
      });
      if (error) throw new Error(describeError(error));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["assignments"] });
      void queryClient.invalidateQueries({ queryKey: ["shipments"] });
    },
  });
}

/** Driver accepts or declines an offered job; acceptance creates the trip + QR. */
export function useRespondToAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assignmentId, accept, reason }: { assignmentId: string; accept: boolean; reason?: string }) => {
      const { error } = await supabase.rpc("respond_to_assignment", {
        p_assignment_id: assignmentId,
        p_accept: accept,
        p_reason: reason ?? undefined,
      });
      if (error) throw new Error(describeError(error));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["assignments"] });
      void queryClient.invalidateQueries({ queryKey: ["trips"] });
      void queryClient.invalidateQueries({ queryKey: ["shipments"] });
    },
  });
}
