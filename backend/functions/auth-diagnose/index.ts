import { authorize, createAdminClient, errorResponse, json, requireAuth } from "../_shared/auth.ts";

/**
 * auth-diagnose (temporary, admin-only)
 *
 * Reproduces the exact signup -> verification -> login cycle server-side to
 * find why "same email + password" logins fail after email confirmation:
 *
 *   A. full cycle   generateLink(signup, password) -> login (unconfirmed)
 *                   -> verifyOtp(token_hash, "signup")  [the REAL client path]
 *                   -> login (confirmed) -> wrong-password control -> cleanup
 *   B. resend path  generateLink(signup, NO password) -> login -> cleanup
 *                   (proves/disproves that resend-created users get a random
 *                    password they could never know)
 *   C. real account read-only inspection (no writes, no secret material)
 *
 * Only throwaway @diag.portbackhaul.app users are created and always deleted.
 * Responses carry booleans, error codes and timestamps only — never tokens,
 * password values or password hashes.
 */

const DIAG_DOMAIN = "@diag.portbackhaul.app";
const APP_ORIGIN = "https://t0liy8q6u90jb7f74z2cm-web-portbackhaul.rork.live";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "INVALID_ACTION" }, 405);

  try {
    const admin = createAdminClient();
    const caller = await requireAuth(req);
    await authorize(admin, caller.id, { roles: ["ADMIN"] });

    const body = (await req.json().catch(() => ({}))) as { inspectEmail?: string };
    const results: Record<string, unknown> = {};
    const stamp = Date.now();

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const pub = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      auth: { persistSession: false, autoRefreshToken: false, flowType: "pkce", detectSessionInUrl: false },
    });

    // ---- A: full cycle with password -------------------------------------
    const emailA = `diag-full-${stamp}${DIAG_DOMAIN}`;
    const password = `Diag-${stamp}-xQ7!`;
    try {
      const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
        type: "signup",
        email: emailA,
        password,
        options: {
          redirectTo: `${APP_ORIGIN}/auth/callback`,
          data: { role: "CARGO_OWNER", full_name: "Diag Full" },
        },
      });
      if (linkErr || !link) throw new Error(`generateLink: ${linkErr?.message ?? "no link"}`);
      const uid = link.user.id;
      const raw = link.user as unknown as { email_confirmed_at: string | null; encrypted_password?: string | null };
      results.A_created = {
        hasEncryptedPassword: Boolean(raw.encrypted_password),
        emailConfirmedAt: raw.email_confirmed_at,
      };

      const login1 = await pub.auth.signInWithPassword({ email: emailA, password });
      results.A_login_unconfirmed = {
        ok: !login1.error,
        detail: login1.error ? `${login1.error.code ?? ""} ${login1.error.message}`.slice(0, 140) : "signed in",
      };

      // The exact client-side verification call (verifyOtp with token_hash).
      const verify = await pub.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: "signup" });
      results.A_verifyOtp = {
        ok: !verify.error,
        gotSession: Boolean(verify.data.session),
        detail: verify.error ? verify.error.message.slice(0, 140) : "verified",
      };

      const login2 = await pub.auth.signInWithPassword({ email: emailA, password });
      results.A_login_confirmed_same_password = {
        ok: !login2.error,
        detail: login2.error ? `${login2.error.code ?? ""} ${login2.error.message}`.slice(0, 140) : "signed in",
      };

      const login3 = await pub.auth.signInWithPassword({ email: emailA, password: `${password}-wrong` });
      results.A_login_wrong_password_control = {
        ok: !login3.error,
        detail: login3.error ? `${login3.error.code ?? ""} ${login3.error.message}`.slice(0, 140) : "signed in",
      };

      const { error: delErr } = await admin.auth.admin.deleteUser(uid);
      results.A_cleanup = delErr ? `delete failed: ${delErr.message.slice(0, 100)}` : "deleted";
    } catch (errA) {
      results.A_error = String(errA instanceof Error ? errA.message : errA).slice(0, 200);
    }

    // ---- B: resend path (no password) ------------------------------------
    const emailB = `diag-resend-${stamp}${DIAG_DOMAIN}`;
    try {
      const { data: linkB, error: linkBErr } = await admin.auth.admin.generateLink({ type: "signup", email: emailB });
      if (linkBErr || !linkB) throw new Error(`generateLink: ${linkBErr?.message ?? "no link"}`);
      const uidB = linkB.user.id;
      const rawB = linkB.user as unknown as { encrypted_password?: string | null };
      const loginB = await pub.auth.signInWithPassword({ email: emailB, password });
      results.B_resend_without_password = {
        createdUserHasPassword: Boolean(rawB.encrypted_password),
        loginWithTypedPassword: {
          ok: !loginB.error,
          detail: loginB.error ? `${loginB.error.code ?? ""} ${loginB.error.message}`.slice(0, 140) : "signed in",
        },
      };
      const { error: delBErr } = await admin.auth.admin.deleteUser(uidB);
      results.B_cleanup = delBErr ? `delete failed: ${delBErr.message.slice(0, 100)}` : "deleted";
    } catch (errB) {
      results.B_error = String(errB instanceof Error ? errB.message : errB).slice(0, 200);
    }

    // ---- C: read-only inspection + password-field signal validation ------
    const inspectEmail = typeof body.inspectEmail === "string" ? body.inspectEmail.trim().toLowerCase() : null;
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) results.C_error = listErr.message.slice(0, 140);
    else if (inspectEmail) {
      if (!/^[^\s@]+@[^\s@]+$/.test(inspectEmail)) return json({ error: "EMAIL_INVALID" }, 400);
      // demo.admin is a known-good control: it signs in with a password, so if
      // listUsers exposes encrypted_password for it but not for the inspected
      // account, the signal is trustworthy.
      const read = (email: string) => {
        const found = list.users.find((u) => (u.email ?? "").toLowerCase() === email);
        if (!found) return { found: false } as Record<string, unknown>;
        const raw = found as unknown as {
          encrypted_password?: string | null;
          email_confirmed_at: string | null;
          confirmed_at: string | null;
          last_sign_in_at: string | null;
          created_at: string;
          updated_at: string | null;
          confirmation_sent_at: string | null;
          providers: string[] | null;
        };
        return {
          found: true,
          passwordFieldPresent: raw.encrypted_password != null,
          hasPassword: Boolean(raw.encrypted_password),
          emailConfirmedAt: raw.email_confirmed_at ?? raw.confirmed_at,
          confirmationSentAt: raw.confirmation_sent_at,
          lastSignInAt: raw.last_sign_in_at,
          createdAt: raw.created_at,
          updatedAt: raw.updated_at,
          providers: raw.providers ?? ["email"],
          role: (found.user_metadata as Record<string, unknown> | null)?.role ?? null,
        } as Record<string, unknown>;
      };
      results.C_account = read(inspectEmail);
      results.C_control_demo_admin = read("demo.admin@demo.portbackhaul.app");
    }

    // ---- D: passwordless account reproduction + healing ------------------
    // Recreates the suspected legacy state (user with NO password) and proves
    // (a) what login returns for it and (b) that a retried signup heals it.
    const emailD = `diag-legacy-${stamp}${DIAG_DOMAIN}`;
    try {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: emailD,
        email_confirm: true,
        user_metadata: { role: "CARGO_OWNER", full_name: "Diag Legacy" },
      });
      if (createErr || !created?.user) throw new Error(`createUser: ${createErr?.message ?? "no user"}`);
      const uidD = created.user.id;
      const rawD = created.user as unknown as { encrypted_password?: string | null };

      const loginD1 = await pub.auth.signInWithPassword({ email: emailD, password });
      results.D_passwordless_login = {
        createdUserHasPasswordField: rawD.encrypted_password != null,
        detail: loginD1.error ? `${loginD1.error.code ?? ""} ${loginD1.error.message}`.slice(0, 140) : "signed in",
      };

      // Retried signup against the existing user, then the exact sync the
      // signup function runs (updateUserById with the typed password).
      const { data: linkD, error: linkDErr } = await admin.auth.admin.generateLink({
        type: "signup",
        email: emailD,
        password,
        options: { redirectTo: `${APP_ORIGIN}/auth/callback` },
      });
      results.D_retried_signup_generateLink = {
        ok: !linkDErr && Boolean(linkD),
        detail: linkDErr ? linkDErr.message.slice(0, 140) : "link returned",
      };
      if (linkD) {
        const { error: syncErr } = await admin.auth.admin.updateUserById(uidD, { password });
        results.D_password_sync = { ok: !syncErr, detail: syncErr ? syncErr.message.slice(0, 140) : "password set" };
        const loginD2 = await pub.auth.signInWithPassword({ email: emailD, password });
        results.D_login_after_heal = {
          ok: !loginD2.error,
          detail: loginD2.error ? `${loginD2.error.code ?? ""} ${loginD2.error.message}`.slice(0, 140) : "signed in",
        };
      }

      // Cleanup: the profile row (DB trigger) blocks user deletion otherwise.
      await admin.from("profiles").delete().eq("id", uidD);
      const { error: delDErr } = await admin.auth.admin.deleteUser(uidD);
      results.D_cleanup = delDErr ? `delete failed: ${delDErr.message.slice(0, 100)}` : "deleted";
    } catch (errD) {
      results.D_error = String(errD instanceof Error ? errD.message : errD).slice(0, 200);
    }

    // ---- Cleanup of leftovers from the previous diagnostic run -----------
    try {
      const leftovers = list?.users.filter((u) => (u.email ?? "").endsWith(DIAG_DOMAIN)) ?? [];
      const cleaned: string[] = [];
      for (const u of leftovers) {
        await admin.from("profiles").delete().eq("id", u.id);
        const { error: delErr } = await admin.auth.admin.deleteUser(u.id);
        if (!delErr) cleaned.push(u.email ?? u.id);
      }
      results.leftover_cleanup = { found: leftovers.length, deleted: cleaned.length };
    } catch (errL) {
      results.leftover_cleanup = String(errL instanceof Error ? errL.message : errL).slice(0, 140);
    }

    return json(results);
  } catch (err) {
    return errorResponse(err);
  }
});
