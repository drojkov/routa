"use client";

import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Component as CardShell, Field } from "@/components/ui/sign-in-card-2";
import { fmtNodes } from "@/i18n/fmt";
import { useI18n } from "@/i18n/provider";
import { demoSocialSignIn } from "@/lib/actions/auth";
import { authClient } from "@/lib/auth-client";
import { safeNext } from "@/lib/safe-next";
import { BRAND } from "@/lib/site";

export type ProviderMode = "live" | "demo" | "off";
type Provider = "google";

/** Вход и регистрация: email + пароль или Google. */
export function AuthCard({
  mode,
  providers,
  next,
}: {
  mode: "sign-in" | "sign-up";
  providers: Record<Provider, ProviderMode>;
  next?: string;
}) {
  const { dict, href, money, t } = useI18n();
  const a = dict.auth;
  const router = useRouter();
  const signUp = mode === "sign-up";
  const target = safeNext(next, href("/dashboard"));

  const [showPassword, setShowPassword] = React.useState(false);
  const [focused, setFocused] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<"email" | Provider | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [consent, setConsent] = React.useState(false);
  const [adult, setAdult] = React.useState(false);
  const consentsOk = !signUp || (consent && adult);

  function errorText(code?: string) {
    if (code === "INVALID_EMAIL_OR_PASSWORD") return a.errors.invalid;
    if (code === "USER_ALREADY_EXISTS" || code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") return a.errors.exists;
    if (code === "PASSWORD_TOO_SHORT") return a.errors.weak;
    return a.errors.generic;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!consentsOk) return setError(a.errors.consent);
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email"));
    const password = String(f.get("password"));
    setBusy("email");
    setError(null);
    const res = signUp
      ? await authClient.signUp.email({ email, password, name: String(f.get("name")) || email.split("@")[0] })
      : await authClient.signIn.email({ email, password, rememberMe: f.get("remember") === "on" });
    if (res.error) {
      setBusy(null);
      return setError(errorText(res.error.code));
    }
    router.push(target);
    router.refresh();
  }

  async function onSocial(p: Provider) {
    if (!consentsOk) return setError(a.errors.consent);
    setBusy(p);
    setError(null);
    try {
      if (providers[p] === "demo") {
        await demoSocialSignIn(p, target, href("/dashboard"));
        return;
      }
      const res = await authClient.signIn.social({
        provider: p,
        callbackURL: target,
        errorCallbackURL: href(signUp ? "/sign-up" : "/sign-in"),
      });
      if (res.error) throw new Error(res.error.message);
    } catch (err) {
      // redirect() из server action приходит как исключение — это не ошибка.
      if (err && typeof err === "object" && "digest" in err && String(err.digest).startsWith("NEXT_REDIRECT")) throw err;
      setBusy(null);
      setError(a.errors.unavailable);
    }
  }

  const legalLink = (doc: "terms" | "privacy") => (
    <Link key={doc} href={href(`/legal/${doc}`)} target="_blank" className="text-teal-300 underline-offset-2 hover:underline">
      {dict.legalNames[doc]}
    </Link>
  );

  const visible = (["google"] as const).filter((p) => providers[p] !== "off");
  const demo = visible.some((p) => providers[p] === "demo");

  return (
    <CardShell wide={signUp}>
      <div className="mb-7 text-center">
        <div className="mx-auto mb-4 grid size-11 place-items-center rounded-2xl border border-white/15 bg-white/10 text-lg font-semibold text-white">
          {BRAND[0]}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">{signUp ? a.signUpTitle : a.signInTitle}</h1>
        <p className="mt-1 text-sm text-white/55">{signUp ? t(a.signUpSub, { amount: money(1) }) : a.signInSub}</p>
      </div>

      {visible.length > 0 && (
        <>
          <div className="grid gap-2">
            {visible.map((p) => (
              <button
                key={p}
                type="button"
                disabled={!!busy}
                onClick={() => onSocial(p)}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/85 transition hover:bg-white/10 disabled:opacity-60"
              >
                {busy === p ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
                {a[p]}
              </button>
            ))}
          </div>
          {demo && <p className="mt-2 text-center text-[11px] leading-snug text-amber-200/70">{a.demo}</p>}
          <div className="flex items-center gap-3 py-4 text-[11px] tracking-wider text-white/35 uppercase">
            <span className="h-px flex-1 bg-white/10" /> {a.or} <span className="h-px flex-1 bg-white/10" />
          </div>
        </>
      )}

      <form onSubmit={onSubmit} className="space-y-3" noValidate={false}>
        {signUp && (
          <Field icon={User} focused={focused === "name"}>
            <input
              name="name"
              autoComplete="name"
              placeholder={a.name}
              aria-label={a.name}
              maxLength={80}
              onFocus={() => setFocused("name")}
              onBlur={() => setFocused(null)}
              className="h-11 w-full bg-transparent pr-3 pl-10 text-sm text-white outline-none placeholder:text-white/35"
            />
          </Field>
        )}
        <Field icon={Mail} focused={focused === "email"}>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={a.email}
            aria-label={a.email}
            onFocus={() => setFocused("email")}
            onBlur={() => setFocused(null)}
            className="h-11 w-full bg-transparent pr-3 pl-10 text-sm text-white outline-none placeholder:text-white/35"
          />
        </Field>
        <Field icon={Lock} focused={focused === "password"}>
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            maxLength={128}
            autoComplete={signUp ? "new-password" : "current-password"}
            placeholder={signUp ? `${a.password} · ${a.passwordHint}` : a.password}
            aria-label={a.password}
            onFocus={() => setFocused("password")}
            onBlur={() => setFocused(null)}
            className="h-11 w-full bg-transparent pr-10 pl-10 text-sm text-white outline-none placeholder:text-white/35"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? a.hidePassword : a.showPassword}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-white/40 transition hover:text-white"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </Field>

        {signUp ? (
          <div className="space-y-2 pt-1 text-xs leading-snug text-white/60">
            <Check checked={consent} onChange={setConsent}>
              {fmtNodes(a.consent, { terms: legalLink("terms"), privacy: legalLink("privacy") })}
            </Check>
            <Check checked={adult} onChange={setAdult}>
              {a.age}
            </Check>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center gap-2 pt-1 text-xs text-white/55">
            <input type="checkbox" name="remember" defaultChecked className="size-3.5 accent-teal-400" /> {a.remember}
          </label>
        )}

        {error && (
          <p role="alert" className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!!busy}
          aria-busy={busy === "email"}
          className="group relative mt-2 flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-white text-sm font-medium text-black transition hover:scale-[1.01] active:scale-[0.98] disabled:opacity-80"
        >
          {busy === "email" ? (
            <>
              <Loader2 className="size-4 animate-spin" /> {signUp ? a.signingUp : a.signingIn}
            </>
          ) : (
            <>
              {signUp ? a.submitSignUp : a.submitSignIn} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>

        <p className="pt-3 text-center text-xs text-white/50">
          {signUp ? a.haveAccount : a.noAccount}{" "}
          <Link
            href={`${href(signUp ? "/sign-in" : "/sign-up")}${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="text-teal-300 hover:underline"
          >
            {signUp ? a.signInLink : a.signUpLink}
          </Link>
        </p>
      </form>
    </CardShell>
  );
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-2">
      <input
        type="checkbox"
        required
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-3.5 shrink-0 accent-teal-400"
      />
      <span>{children}</span>
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-4" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.7-.4-3.9z"
      />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A11.9 11.9 0 0 1 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.7-.4-3.9z" />
    </svg>
  );
}
