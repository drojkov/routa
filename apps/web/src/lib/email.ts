import "server-only";

/**
 * Отправка писем через Resend (HTTP API, без SDK). Без RESEND_API_KEY письмо пишется в лог —
 * так весь путь проверяется локально. Отправитель — EMAIL_FROM (домен должен быть подтверждён в Resend).
 */
export type Email = { to: string; subject: string; text: string; html: string; replyTo?: string };

export async function sendEmail(mail: Email) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Harvanera <info@harvanera.com>";
  if (!key) {
    console.info(`[email] RESEND_API_KEY не задан — письмо не отправлено.\nTo: ${mail.to}\nSubject: ${mail.subject}\n\n${mail.text}`);
    return { ok: false as const, skipped: true };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ from, to: [mail.to], subject: mail.subject, text: mail.text, html: mail.html, ...(mail.replyTo ? { reply_to: mail.replyTo } : {}) }),
    });
    if (!res.ok) {
      console.error(`[email] Resend ${res.status}: ${await res.text()}`);
      return { ok: false as const, skipped: false };
    }
    return { ok: true as const };
  } catch (e) {
    console.error("[email] send failed:", (e as Error).message);
    return { ok: false as const, skipped: false };
  }
}

/** Публичный адрес сайта для ссылок в письмах (SITE_URL — только для тестовых стендов). */
export const siteUrl = () => (process.env.SITE_URL ??"https://harvanera.com").replace(/\/$/, "");

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
