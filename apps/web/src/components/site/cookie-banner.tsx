"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Cookie } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { CONSENT_COOKIE, setClientCookie } from "@/i18n/config";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

/** Событие для кнопки «Настройки cookie» в футере. */
export const OPEN_COOKIE_SETTINGS = "open-cookie-settings";

/** Версия текста согласия: меняется при изменении категорий — баннер покажется снова. */
const CONSENT_VERSION = 1;
/** 6 месяцев — рекомендация CNIL для повторного запроса. */
const MAX_AGE = 60 * 60 * 24 * 182;

export type Consent = { v: number; analytics: boolean; marketing: boolean; ts: number; gpc: boolean };

export function readConsent(): Consent | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie.split("; ").find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
  if (!raw) return null;
  try {
    const c = JSON.parse(decodeURIComponent(raw.split("=").slice(1).join("="))) as Consent;
    return c.v === CONSENT_VERSION ? c : null;
  } catch {
    return null;
  }
}

function writeConsent(analytics: boolean, marketing: boolean, gpc: boolean) {
  const c: Consent = { v: CONSENT_VERSION, analytics, marketing, ts: Date.now(), gpc };
  setClientCookie(CONSENT_COOKIE, encodeURIComponent(JSON.stringify(c)), MAX_AGE);
  // Подписчики (будущие скрипты аналитики) грузятся только после этого события и только при согласии.
  window.dispatchEvent(new CustomEvent("cookie-consent", { detail: c }));
}

/**
 * Баннер согласия (GDPR/ePrivacy, рекомендации EDPB и CNIL):
 * «Принять» и «Отклонить» на первом экране и одинаково заметны, категории выключены по умолчанию,
 * выбор можно поменять из футера, сигнал Global Privacy Control отключает маркетинг и аналитику.
 */
export function CookieBanner() {
  const { dict, href } = useI18n();
  const c = dict.cookies;
  const [open, setOpen] = React.useState(false);
  const [custom, setCustom] = React.useState(false);
  const [analytics, setAnalytics] = React.useState(false);
  const [marketing, setMarketing] = React.useState(false);
  const [gpc, setGpc] = React.useState(false);

  React.useEffect(() => {
    const signal = (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
    const saved = readConsent();
    // Состояние из cookie доступно только в браузере — синхронизируем после монтирования.
    /* eslint-disable react-hooks/set-state-in-effect */
    setGpc(signal);
    if (saved) {
      setAnalytics(saved.analytics);
      setMarketing(saved.marketing);
    } else {
      setOpen(true);
    }
    /* eslint-enable react-hooks/set-state-in-effect */

    const reopen = () => {
      const cur = readConsent();
      setAnalytics(cur?.analytics ?? false);
      setMarketing(cur?.marketing ?? false);
      setCustom(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS, reopen);
  }, []);

  function decide(an: boolean, mk: boolean) {
    writeConsent(an && !gpc, mk && !gpc, gpc);
    setOpen(false);
    setCustom(false);
  }

  const btn = "h-10 flex-1 rounded-xl px-4 text-sm font-medium transition active:scale-[0.98]";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-title"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-xl rounded-3xl border border-border bg-card/95 p-5 shadow-float backdrop-blur-xl sm:bottom-5"
        >
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-strong">
              <Cookie className="size-4.5" />
            </span>
            <div className="min-w-0">
              <h2 id="cookie-title" className="font-semibold">
                {c.title}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {c.text}{" "}
                <Link href={href("/legal/cookies")} className="text-foreground underline underline-offset-2">
                  {c.policy}
                </Link>
              </p>
              {gpc && <p className="mt-2 text-xs text-brand-strong">{c.gpc}</p>}
            </div>
          </div>

          {custom && (
            <div className="mt-4 space-y-2">
              <Row title={c.necessary} text={c.necessaryText} checked disabled badge={c.alwaysOn} />
              <Row title={c.analytics} text={c.analyticsText} checked={analytics} disabled={gpc} onChange={setAnalytics} />
              <Row title={c.marketing} text={c.marketingText} checked={marketing} disabled={gpc} onChange={setMarketing} />
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {/* Одинаковый вес «Отклонить» и «Принять» — требование EDPB/CNIL. */}
            <button type="button" onClick={() => decide(false, false)} className={cn(btn, "bg-foreground text-background hover:bg-foreground/90")}>
              {c.rejectAll}
            </button>
            {custom ? (
              <button type="button" onClick={() => decide(analytics, marketing)} className={cn(btn, "border border-border bg-card hover:bg-muted")}>
                {c.save}
              </button>
            ) : (
              <button type="button" onClick={() => setCustom(true)} className={cn(btn, "border border-border bg-card hover:bg-muted")}>
                {c.customize}
              </button>
            )}
            <button type="button" onClick={() => decide(true, true)} className={cn(btn, "bg-foreground text-background hover:bg-foreground/90")}>
              {c.acceptAll}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Row({
  title,
  text,
  checked,
  disabled,
  onChange,
  badge,
}: {
  title: string;
  text: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
  badge?: string;
}) {
  const id = React.useId();
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-muted/60 p-3">
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="text-sm font-medium">
          {title}
        </label>
        <p className="text-xs text-muted-foreground">{text}</p>
      </div>
      {badge ? (
        <span className="shrink-0 rounded-full bg-card px-2 py-0.5 text-[11px] text-muted-foreground">{badge}</span>
      ) : (
        <button
          id={id}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onChange?.(!checked)}
          className={cn(
            "relative h-6 w-10 shrink-0 rounded-full transition-colors disabled:opacity-50",
            checked ? "bg-brand" : "bg-foreground/20",
          )}
        >
          <span className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform", checked && "translate-x-4")} />
        </button>
      )}
    </div>
  );
}
