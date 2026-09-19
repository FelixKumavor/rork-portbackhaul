import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

/**
 * Landing route for email confirmation links.
 *
 * Emails point here with ?token_hash=...&type=signup — admin-generated links
 * cannot use the PKCE code flow, so we exchange the token hash for a session
 * via verifyOtp and then route the user by role. Legacy ?code= links (which
 * detectSessionInUrl can consume) still work through the fallback branch.
 */
export default function AuthCallback() {
  const { verifyEmailToken, refresh } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get("token_hash");
    const type = params.get("type");

    // Remove the token from the address bar so it never lingers in history.
    if (tokenHash) {
      window.history.replaceState({}, "", window.location.pathname);
    }

    async function run() {
      try {
        if (tokenHash && type === "signup") {
          await verifyEmailToken(tokenHash, "signup");
          if (!cancelled) navigate("/app", { replace: true });
          return;
        }
        if (tokenHash && type) {
          // A token type that does not belong on this route.
          throw new Error("This confirmation link is not valid for this page.");
        }
        await refresh();
        if (!cancelled) navigate("/app", { replace: true });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not confirm your email.");
      }
    }

    const timer = window.setTimeout(() => void run(), 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [verifyEmailToken, refresh, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6">
      <Seo title="Signing you in · PortBackhaul" description="Completing sign-in." path="/auth/callback" noIndex />
      {error ? (
        <>
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-status-rejected-bg text-status-rejected">
            <AlertTriangle className="h-6 w-6" aria-hidden />
          </span>
          <h1 className="text-lg font-bold">Link could not be confirmed</h1>
          <p className="max-w-sm text-center text-sm text-muted-foreground">{error}</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline">
              <Link to="/login">Back to sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/verify-email">Resend confirmation email</Link>
            </Button>
          </div>
        </>
      ) : (
        <>
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
          <p className="text-sm text-muted-foreground">Confirming your email and signing you in…</p>
        </>
      )}
    </div>
  );
}
