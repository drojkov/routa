"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import * as React from "react";
import { useI18n } from "@/i18n/provider";
import { sendContactMessage } from "@/lib/actions/contact";
import { CONTACT_TOPICS, SUPPORT_RESPONSE_DAYS } from "@/lib/site";

const field =
  "mt-1 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-brand focus:ring-3 focus:ring-brand/20";

export function ContactForm() {
  const { dict, t } = useI18n();
  const c = dict.contact;
  const [sentTo, setSentTo] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();

  if (sentTo) {
    return (
      <div className="py-6 text-center">
        <CheckCircle2 className="mx-auto size-10 text-brand" />
        <p className="mt-3 text-lg font-semibold">{c.sentTitle}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t(c.sentText, { email: sentTo, days: SUPPORT_RESPONSE_DAYS })}</p>
        <button type="button" onClick={() => setSentTo(null)} className="mt-5 text-sm underline underline-offset-2">
          {c.another}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const input = {
          name: String(f.get("name") ?? ""),
          email: String(f.get("email") ?? ""),
          topic: String(f.get("topic") ?? "general"),
          message: String(f.get("message") ?? ""),
          website: String(f.get("website") ?? ""),
        };
        setError(null);
        start(async () => {
          const res = await sendContactMessage(input);
          if (res.ok) setSentTo(input.email);
          else setError(res.error === "too_many" ? c.errorTooMany : c.errorInvalid);
        });
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          {c.name}
          <input name="name" required maxLength={100} autoComplete="name" className={`${field} h-11`} />
        </label>
        <label className="block text-sm">
          {c.email}
          <input name="email" type="email" required maxLength={200} autoComplete="email" className={`${field} h-11`} />
        </label>
      </div>
      <label className="block text-sm">
        {c.topic}
        <select name="topic" defaultValue="general" className={`${field} h-11`}>
          {CONTACT_TOPICS.map((k) => (
            <option key={k} value={k}>
              {c.topics[k]}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        {c.message}
        <textarea name="message" required minLength={10} maxLength={5000} rows={6} placeholder={c.messagePlaceholder} className={`${field} py-2`} />
      </label>
      {/* Ловушка для ботов: скрыта от людей и от скринридеров. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background disabled:opacity-70"
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        {pending ? c.sending : c.send}
      </button>
    </form>
  );
}
