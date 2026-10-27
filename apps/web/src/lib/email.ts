import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

/**
 * Отправка писем по SMTP через почтовый сервер компании (mail.harvanera.com, ящик info@) —
 * та же схема, что у других витрин в GitLab. Без EMAIL_HOST письмо пишется в лог —
 * так весь путь проверяется локально. Отправитель — EMAIL_FROM, иначе EMAIL_USER.
 */
export type Email = { to: string; subject: string; text: string; html: string; replyTo?: string };

let transport: Transporter | null = null;

function getTransport() {
  if (transport) return transport;
  const port = Number(process.env.EMAIL_PORT ?? 587);
  transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    // 465 — сразу TLS, 587 — STARTTLS
    secure: process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === "true" : port === 465,
    auth: process.env.EMAIL_USER ? { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS ?? "" } : undefined,
    // у сервера компании сертификат на чужое имя и бывает просрочен
    tls: { rejectUnauthorized: process.env.EMAIL_TLS_REJECT_UNAUTHORIZED !== "false" },
    connectionTimeout: 15_000,
  });
  return transport;
}

export async function sendEmail(mail: Email) {
  const from = process.env.EMAIL_FROM ?? (process.env.EMAIL_USER ? `Harvanera <${process.env.EMAIL_USER}>` : "Harvanera <info@harvanera.com>");
  if (!process.env.EMAIL_HOST) {
    console.info(`[email] EMAIL_HOST не задан — письмо не отправлено.\nTo: ${mail.to}\nSubject: ${mail.subject}\n\n${mail.text}`);
    return { ok: false as const, skipped: true };
  }
  try {
    await getTransport().sendMail({ from, to: mail.to, subject: mail.subject, text: mail.text, html: mail.html, replyTo: mail.replyTo });
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
