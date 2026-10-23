import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, ShieldAlert, ShieldCheck, Smartphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { describeError, describeFunctionError } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";

const NETWORKS = [
  { value: "MTN", label: "MTN Mobile Money" },
  { value: "TELECEL", label: "Telecel Cash" },
  { value: "AIRTEL_TIGO", label: "AT Money" },
] as const;

/** Normalises Ghana mobile numbers to 0XXXXXXXXX; null when invalid. */
function normalizeGhanaPhone(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, "");
  let local = digits;
  if (local.startsWith("00233")) local = `0${local.slice(5)}`;
  else if (local.startsWith("233")) local = `0${local.slice(3)}`;
  else if (/^[235]\d{9}$/.test(local)) local = `0${local}`;
  return /^0[235]\d{8}$/.test(local) ? local : null;
}

interface PaymentMethodRow {
  id: string;
  momo_phone: string | null;
  momo_network: string | null;
  verification_status: string;
  paystack_transaction_reference: string | null;
  verified_at: string | null;
}

/** Poll cadence while the MoMo approval prompt is outstanding. */
const VERIFY_POLL_MS = 4000;
const VERIFY_POLL_MAX_TRIES = 24;

export function MomoVerificationCard() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();

  const [phone, setPhone] = useState("");
  const [network, setNetwork] = useState<string>("");
  const [awaitingApproval, setAwaitingApproval] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTries = useRef(0);

  const rowQuery = useQuery({
    queryKey: ["momo-payment-method", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<PaymentMethodRow | null> => {
      const { data, error } = await supabase
        .from("user_payment_methods")
        .select(
          "id, momo_phone, momo_network, verification_status, paystack_transaction_reference, verified_at",
        )
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(describeError(error));
      return (data as PaymentMethodRow | null) ?? null;
    },
  });

  const row = rowQuery.data ?? null;
  const prefilled = useRef(false);
  useEffect(() => {
    if (row && !prefilled.current) {
      prefilled.current = true;
      if (row.momo_phone) setPhone(row.momo_phone);
      if (row.momo_network) setNetwork(row.momo_network);
    }
  }, [row]);

  // Stop polling when the card unmounts.
  useEffect(
    () => () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    },
    [],
  );

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["momo-payment-method"] });

  const saveDetails = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("initialize-momo-transaction", {
        body: { action: "save", momo_phone: phone, momo_network: network, full_name: profile?.full_name ?? "" },
      });
      if (error) throw new Error(await describeFunctionError(error));
    },
    onSuccess: () => {
      toast.success("Mobile Money details saved");
      setDetail(null);
      refresh();
    },
    onError: (e) => toast.error(describeError(e)),
  });

  async function callVerify(reference: string): Promise<string> {
    const { data, error } = await supabase.functions.invoke("verify-momo-transaction", {
      body: { reference },
    });
    if (error) throw new Error(await describeFunctionError(error));
    const body = data as { status?: string; reason?: string | null; error?: string };
    return body.status ?? body.error ?? "PENDING";
  }

  function startPolling(reference: string) {
    setAwaitingApproval(true);
    pollTries.current = 0;
    if (pollTimer.current) clearInterval(pollTimer.current);
    pollTimer.current = setInterval(() => {
      pollTries.current += 1;
      if (pollTries.current > VERIFY_POLL_MAX_TRIES) {
        stopPolling();
        setDetail("Verification timed out. If you approved the prompt, check back in a minute.");
        refresh();
        return;
      }
      void callVerify(reference)
        .then((status) => {
          if (status === "VERIFIED") {
            stopPolling();
            setDetail(null);
            toast.success("Mobile Money number verified");
            refresh();
          } else if (status === "FAILED") {
            stopPolling();
            setDetail("The verification charge failed or was declined.");
            refresh();
          }
          // PENDING → keep polling
        })
        .catch(() => {
          /* transient network/verify errors — keep polling */
        });
    }, VERIFY_POLL_MS);
  }

  function stopPolling() {
    if (pollTimer.current) clearInterval(pollTimer.current);
    pollTimer.current = null;
    setAwaitingApproval(false);
  }

  const verifyCharge = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("initialize-momo-transaction", {
        body: { action: "initialize", momo_phone: phone, momo_network: network, full_name: profile?.full_name ?? "" },
      });
      if (error) throw new Error(await describeFunctionError(error));
      const body = data as { reference?: string; verification_status?: string; display_text?: string | null };
      if (!body.reference) throw new Error("INITIALIZATION_FAILED");
      return body;
    },
    onSuccess: (body) => {
      toast.success("Verification charge sent to your phone");
      setDetail(
        body.display_text ??
          "Approve the GHS 1.00 prompt on your phone to confirm this number belongs to you.",
      );
      refresh();
      if (body.verification_status === "PENDING" && body.reference) startPolling(body.reference);
    },
    onError: async (e) => {
      stopPolling();
      const message = describeError(e, "Verification could not be started.");
      toast.error(message);
      // Keep the provider's own decline reason visible inline, not just in the toast.
      setDetail(message);
      refresh();
    },
  });

  if (!user) return null;

  const status = row?.verification_status ?? "NOT_VERIFIED";
  const digitsValid = normalizeGhanaPhone(phone) !== null;
  const canSubmit = digitsValid && network !== "" && !saveDetails.isPending && !verifyCharge.isPending;
  const busy = saveDetails.isPending || verifyCharge.isPending || awaitingApproval;

  return (
    <section className="panel p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold">Mobile Money</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Your payout number. Verification is a GHS 1.00 charge you approve on your own phone — it proves the
            number is yours.
          </p>
        </div>
        <StatusBadge status={awaitingApproval ? "PENDING" : status} raw />
      </div>

      {status === "VERIFIED" && row?.verified_at ? (
        <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-status-verified/30 bg-status-verified-bg p-4 text-sm text-status-verified">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          Verified {formatDateTime(row.verified_at)}.
        </div>
      ) : null}

      {status === "FAILED" ? (
        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-status-danger/30 bg-status-danger-bg p-4 text-sm text-status-danger">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            {detail && status === "FAILED"
              ? detail
              : "The last verification attempt failed. Check the number and try again — submitting new details clears the failure."}
          </span>
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="momo-name">Full name</Label>
          <Input id="momo-name" value={profile?.full_name ?? ""} disabled />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="momo-phone">MoMo phone number</Label>
          <Input
            id="momo-phone"
            inputMode="tel"
            placeholder="024 000 0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={busy}
          />
          {phone !== "" && !digitsValid ? (
            <p className="text-xs text-status-danger">Enter a valid Ghana mobile number (e.g. 024 123 4567).</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label>Mobile Money network</Label>
          <Select value={network} onValueChange={setNetwork} disabled={busy}>
            <SelectTrigger aria-label="Mobile Money network">
              <SelectValue placeholder="Select network" />
            </SelectTrigger>
            <SelectContent>
              {NETWORKS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {row?.paystack_transaction_reference ? (
          <div className="space-y-1.5">
            <Label>Latest verification reference</Label>
            <p className="font-mono text-xs leading-[2.4] tabular text-muted-foreground">
              {row.paystack_transaction_reference}
            </p>
          </div>
        ) : null}
      </div>

      {awaitingApproval ? (
        <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-status-pending/30 bg-status-pending-bg p-4 text-sm text-status-pending">
          <Smartphone className="h-4 w-4 shrink-0" aria-hidden />
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          {detail ?? "Waiting for your approval on the phone…"}
        </div>
      ) : detail ? (
        <p className="mt-4 text-sm text-muted-foreground">{detail}</p>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => saveDetails.mutate()} disabled={!canSubmit || awaitingApproval}>
          {saveDetails.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
          Save details
        </Button>
        <Button onClick={() => verifyCharge.mutate()} disabled={!canSubmit || awaitingApproval}>
          {verifyCharge.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Smartphone className="mr-2 h-4 w-4" />}
          Verify number (GHS 1.00)
        </Button>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Never enter your MoMo PIN, OTP or banking password in this app. Verification happens only through the
        approval prompt on your phone. A saved number is not a verified number.
      </p>
    </section>
  );
}
