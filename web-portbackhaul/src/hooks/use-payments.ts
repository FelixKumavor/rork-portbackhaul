import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { describeError } from "@/lib/errors";

export interface Payment {
  id: string;
  trip_id: string | null;
  shipment_id: string | null;
  payer_id: string | null;
  amount_ghs: number;
  currency: string;
  provider: string;
  provider_reference: string | null;
  status: string;
  paid_at: string | null;
  released_at: string | null;
  failure_reason: string | null;
  is_demo: boolean;
  created_at: string;
}

const PAYMENT_COLUMNS =
  "id, trip_id, shipment_id, payer_id, amount_ghs, currency, provider, provider_reference, status, paid_at, released_at, failure_reason, is_demo, created_at";

export function usePayments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["payments", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<Payment[]> => {
      const { data, error } = await supabase
        .from("payments")
        .select(PAYMENT_COLUMNS)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Failed to load payments", error.message);
        throw new Error(describeError(error));
      }
      return (data ?? []) as Payment[];
    },
  });
}

export interface Payout {
  id: string;
  trip_id: string | null;
  recipient_id: string;
  amount_ghs: number;
  status: string;
  requested_at: string | null;
  processed_at: string | null;
  created_at: string;
}

export function usePayouts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["payouts", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<Payout[]> => {
      const { data, error } = await supabase
        .from("payouts")
        .select("id, trip_id, recipient_id, amount_ghs, status, requested_at, processed_at, created_at")
        .order("created_at", { ascending: false });
      if (error) throw new Error(describeError(error));
      return (data ?? []) as Payout[];
    },
  });
}

/**
 * All payment state changes run in the `payments-api` edge function with the
 * service-role key. The browser never writes payment rows directly.
 */
async function callPaymentsApi<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("payments-api", {
    body: { action, ...payload },
  });
  if (error) {
    const context = (error as { context?: { body?: string } }).context;
    throw new Error(describeError(context?.body ?? error.message, "Payment request failed."));
  }
  if ((data as { error?: string })?.error) {
    throw new Error(describeError((data as { error: string }).error));
  }
  return data as T;
}

export function useInitiatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tripId: string) =>
      callPaymentsApi<{ authorization_url: string | null; reference: string; simulated: boolean }>("initialize", {
        trip_id: tripId,
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["payments"] }),
  });
}

export function useRequestPaymentRelease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentId: string) => callPaymentsApi<{ ok: true }>("request_release", { payment_id: paymentId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
      void queryClient.invalidateQueries({ queryKey: ["payouts"] });
    },
  });
}

export function useRequestPayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payoutId: string) => callPaymentsApi<{ ok: true }>("request_payout", { payout_id: payoutId }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["payouts"] }),
  });
}

export interface Dispute {
  id: string;
  trip_id: string | null;
  shipment_id: string | null;
  raised_by: string;
  category: string;
  description: string;
  status: string;
  resolution_notes: string | null;
  created_at: string;
}

export function useDisputes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["disputes", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<Dispute[]> => {
      const { data, error } = await supabase
        .from("disputes")
        .select("id, trip_id, shipment_id, raised_by, category, description, status, resolution_notes, created_at")
        .order("created_at", { ascending: false });
      if (error) throw new Error(describeError(error));
      return (data ?? []) as Dispute[];
    },
  });
}

export function useRaiseDispute() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { tripId?: string | null; shipmentId?: string | null; category: string; description: string }) => {
      const { error } = await supabase.from("disputes").insert({
        trip_id: input.tripId ?? null,
        shipment_id: input.shipmentId ?? null,
        raised_by: user!.id,
        category: input.category,
        description: input.description,
      });
      if (error) throw new Error(describeError(error));
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["disputes"] }),
  });
}
