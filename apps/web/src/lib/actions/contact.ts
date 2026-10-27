"use server";

import { and, eq, gte } from "drizzle-orm";
import { headers } from "next/headers";
import { db, schema } from "@/db";
import { auth } from "@/lib/auth";
import { escapeHtml, sendEmail } from "@/lib/email";
import { clientIp } from "@/lib/geo";
import { COMPANY, CONTACT_TOPICS, type ContactTopic as Topic } from "@/lib/site";

/** С одного IP — не больше 5 сообщений в час. */
const PER_HOUR = 5;

export type ContactResult = { ok: true } | { ok: false; error: "invalid" | "too_many" };

/**
 * Сообщение из формы /contact: сохраняется в базе (contact_message) и уходит письмом в поддержку
 * с Reply-To клиента. Если почта не настроена, сообщение всё равно остаётся в базе.
 */
export async function sendContactMessage(input: { name: string; email: string; topic: string; message: string; website?: string }): Promise<ContactResult> {
  // Скрытое поле-ловушка для ботов: человек его не видит и не заполняет.
  if (input.website) return { ok: true };
  const name = input.name.trim().slice(0, 100);
  const email = input.email.trim().slice(0, 200);
  const message = input.message.trim().slice(0, 5000);
  const topic: Topic = (CONTACT_TOPICS as readonly string[]).includes(input.topic) ? (input.topic as Topic) : "general";
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 10) return { ok: false, error: "invalid" };

  const h = await headers();
  const ip = clientIp(h);
  if (ip) {
    const recent = await db
      .select({ id: schema.contactMessage.id })
      .from(schema.contactMessage)
      .where(and(eq(schema.contactMessage.ipAddress, ip), gte(schema.contactMessage.createdAt, new Date(Date.now() - 60 * 60_000))));
    if (recent.length >= PER_HOUR) return { ok: false, error: "too_many" };
  }
  const session = await auth.api.getSession({ headers: h });
  const id = crypto.randomUUID();
  await db.insert(schema.contactMessage).values({ id, userId: session?.user.id ?? null, name, email, topic, message, ipAddress: ip });

  const ref = id.slice(0, 8).toUpperCase();
  const account = session ? `${session.user.email} (${session.user.id})` : "not signed in";
  void sendEmail({
    to: COMPANY.email,
    replyTo: email,
    subject: `[contact:${topic}] #${ref} ${name}`,
    text: `From: ${name} <${email}>\nAccount: ${account}\nTopic: ${topic}\n\n${message}`,
    html: `<p>From: ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;<br>Account: ${escapeHtml(account)}<br>Topic: ${topic}</p><p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
  });
  return { ok: true };
}
