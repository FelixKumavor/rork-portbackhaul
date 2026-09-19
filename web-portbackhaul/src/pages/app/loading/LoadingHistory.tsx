import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { QueryErrorState } from "@/components/QueryErrorState";
import { PageHeader } from "@/components/PageHeader";
import { Seo } from "@/components/Seo";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { describeError } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";

interface VerificationRecord {
  id: string;
  trip_id: string;
  action: string;
  notes: string | null;
  location_text: string | null;
  created_at: string;
}

export default function LoadingHistory() {
  const { user } = useAuth();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["loading-verifications", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<VerificationRecord[]> => {
      const { data: rows, error } = await supabase
        .from("loading_verifications")
        .select("id, trip_id, action, notes, location_text, created_at")
        .eq("operator_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw new Error(describeError(error));
      return (rows ?? []) as VerificationRecord[];
    },
  });

  const records = data ?? [];

  return (
    <div className="mx-auto w-full max-w-[900px] animate-fade space-y-6">
      <Seo title="Verification history · PortBackhaul" description="Your loading-point verifications." path="/app/loading/history" noIndex />

      <PageHeader
        eyebrow="Loading / Terminal Operator"
        title="Verification history"
        subtitle="Every action you record is written to the platform audit log."
      />

      {isError ? (
        <div className="panel">
          <QueryErrorState error={error} onRetry={() => void refetch()} subject="verification history" compact />
        </div>
      ) : isLoading ? (
        <div className="panel p-6 text-sm text-muted-foreground">Loading…</div>
      ) : records.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={History}
            title="No verifications yet"
            description="Scan a driver's QR code and record an action to build your history."
          />
        </div>
      ) : (
        <div className="panel divide-y divide-border">
          {records.map((record) => (
            <div key={record.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <StatusBadge
                  status={
                    record.action === "ARRIVAL_CONFIRMED" || record.action === "LOADING_CONFIRMED"
                      ? "APPROVED"
                      : record.action === "ISSUE_REPORTED"
                        ? "PENDING"
                        : "REJECTED"
                  }
                  raw={false}
                />
                <p className="mt-2 text-sm font-semibold">{record.action.replace(/_/g, " ")}</p>
                {record.location_text ? (
                  <p className="mt-0.5 text-sm text-muted-foreground">{record.location_text}</p>
                ) : null}
                {record.notes ? <p className="mt-1 text-sm text-muted-foreground">{record.notes}</p> : null}
              </div>
              <span className="shrink-0 font-mono text-xs tabular text-muted-foreground">
                {formatDateTime(record.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
