"use client";

import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Component as CardShell, Field } from "@/components/ui/sign-in-card-2";
import { fmtNodes } from "@/i18n/fmt";
import { useI18n } from "@/i18n/provider";
import { authClient } from "@/lib/auth-client";
import { safeNext } from "@/lib/safe-next";
import { BRAND } from "@/lib/site";

/** Вход и регистрация: email + пароль. */
export function AuthCard({ mode, next }: { mode: "sign-in" | "sign-up"; next?: string }) {
  const { dict, href, money, t } = useI18n();
  const a = dict.auth;
  const router = useRouter();
  const signUp = mode === "sign-up";
  const target = safeNext(next, href("/dashboard"));

  const [showPassword, setShowPassword] = React.useState(false);
  const [focused, setFocused] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<"email" | null>(null);
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
      ? await authClient.signUp.email({
          email,
          password,
          name: String(f.get("name")) || email.split("@")[0],
          // Ссылка из письма подтверждения ведёт в «Баланс»: без подтверждения пополнение закрыто.
          callbackURL: href("/dashboard/billing?verified=1"),
        })
      : await authClient.signIn.email({ email, password, rememberMe: f.get("remember") === "on" });
    if (res.error) {
      setBusy(null);
      return setError(errorText(res.error.code));
    }
    router.push(target);
    router.refresh();
  }

  const legalLink = (doc: "terms" | "privacy") => (
    <Link key={doc} href={href(`/legal/${doc}`)} target="_blank" className="text-teal-300 underline-offset-2 hover:underline">
      {dict.legalNames[doc]}
    </Link>
  );

  return (
    <CardShell wide={signUp}>
      <div className="mb-7 text-center">
        <div className="mx-auto mb-4 grid size-11 place-items-center rounded-2xl border border-white/15 bg-white/10 text-lg font-semibold text-white">
          {BRAND[0]}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">{signUp ? a.signUpTitle : a.signInTitle}</h1>
        <p className="mt-1 text-sm text-white/55">{signUp ? t(a.signUpSub, { amount: money(1) }) : a.signInSub}</p>
      </div>

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
