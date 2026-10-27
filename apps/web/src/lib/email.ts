import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

/**
 * Отправка писем по SMTP через почтовый сервер компании (mail.harvanera.com, ящик info@) —
 * та же схема, что у других витрин в GitLab. Без EMAIL_HOST письмо пишется в лог —
 * так весь путь проверяется локально. Отправитель — EMAIL_FROM, иначе EMAIL_USER.
 */
export type Email = { to: string; subject: string; text: string; html: string; replyTo?: string };

// Сначала EMAIL_PORT, потом запасные: у хостингов часто закрыт исходящий 587 или 25.
const FALLBACK_PORTS = [465, 2525, 25];
// Ошибки сети — пробуем следующий порт. Ошибки входа или адреса — нет: на другом порту будет то же самое.
const NETWORK_ERRORS = new Set(["ETIMEDOUT", "ECONNECTION", "ESOCKET", "ECONNREFUSED", "ECONNRESET", "EDNS"]);

const transports = new Map<number, Transporter>();
let workingPort: number | null = null;

function ports() {
  const first = Number(process.env.EMAIL_PORT ?? 587);
  const list = [first, ...FALLBACK_PORTS.filter((p) => p !== first)];
  return workingPort ? [workingPort, ...list.filter((p) => p !== workingPort)] : list;
}

function getTransport(port: number) {
  const cached = transports.get(port);
  if (cached) return cached;
  const configured = port === Number(process.env.EMAIL_PORT ?? 587);
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    // 465 — сразу TLS, остальные — STARTTLS
    secure: configured && process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === "true" : port === 465,
    auth: process.env.EMAIL_USER ? { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS ?? "" } : undefined,
    // у сервера компании сертификат на чужое имя и бывает просрочен
    tls: { rejectUnauthorized: process.env.EMAIL_TLS_REJECT_UNAUTHORIZED !== "false" },
    connectionTimeout: 5_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
  });
  transports.set(port, transport);
  return transport;
}

export async function sendEmail(mail: Email) {
  const from = process.env.EMAIL_FROM ?? (process.env.EMAIL_USER ? `Harvanera <${process.env.EMAIL_USER}>` : "Harvanera <info@harvanera.com>");
  if (!process.env.EMAIL_HOST) {
    console.info(`[email] EMAIL_HOST не задан — письмо не отправлено.\nTo: ${mail.to}\nSubject: ${mail.subject}\n\n${mail.text}`);
    return { ok: false as const, skipped: true };
  }
  for (const port of ports()) {
    try {
      await getTransport(port).sendMail({ from, to: mail.to, subject: mail.subject, text: mail.text, html: mail.html, replyTo: mail.replyTo });
      if (workingPort !== port) console.info(`[email] SMTP works on port ${port}`);
      workingPort = port;
      return { ok: true as const };
    } catch (e) {
      const err = e as Error & { code?: string };
      console.error(`[email] send failed on port ${port}:`, err.code ?? "", err.message);
      if (!err.code || !NETWORK_ERRORS.has(err.code)) break;
    }
  }
  return { ok: false as const, skipped: false };
}

/** Публичный адрес сайта для ссылок в письмах (SITE_URL — только для тестовых стендов). */
export const siteUrl = () => (process.env.SITE_URL ??"https://harvanera.com").replace(/\/$/, "");

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
