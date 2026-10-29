import "server-only";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { createRefundRequest, notifyRefundRequest } from "@/lib/refunds";

/**
 * Закрытие аккаунта (Terms §11.1, Privacy §7, Refund Policy §2). Не удаление: финансовые записи,
 * журнал входов, заказы и журнал запросов хранятся — они нужны для бухгалтерии и чарджбэков.
 *
 * 1. Неиспользованный оплаченный баланс сразу уходит в заявку на возврат (сумма замораживается).
 * 2. Ключи отзываются, сессии и пароль удаляются (войти больше нельзя), сохранённые тексты запросов стираются.
 * 3. Email и имя обезличиваются (и в обращениях из формы /contact) — сразу или, если есть заявка на возврат в работе, после её решения
 *    (scripts/refund.mjs): до этого email нужен, чтобы связаться с клиентом по возврату.
 *
 * Та же логика для закрытия по письму — `npm run account close <email>` (scripts/account.mjs).
 */
export async function closeAccount(userId: string, ip: string | null) {
  const user = await db.query.user.findFirst({ columns: { email: true, closedAt: true }, where: eq(schema.user.id, userId) });
  if (!user || user.closedAt) return { ok: false as const };

  const refund = createRefundRequest(userId, "Account closure", ip);
  if (refund.ok) await notifyRefundRequest({ id: refund.id, email: user.email, amountMicros: refund.amountMicros, reason: "Account closure" });

  const now = new Date();
  db.transaction((tx) => {
    tx.update(schema.user).set({ closedAt: now, logContent: false }).where(eq(schema.user.id, userId)).run();
    tx.update(schema.apiKey).set({ revokedAt: now }).where(and(eq(schema.apiKey.userId, userId), isNull(schema.apiKey.revokedAt))).run();
    tx.delete(schema.requestContent).where(eq(schema.requestContent.userId, userId)).run();
    tx.delete(schema.session).where(eq(schema.session.userId, userId)).run();
    tx.delete(schema.account).where(eq(schema.account.userId, userId)).run();
  });
  anonymizeIfSettled(userId);
  return { ok: true as const };
}

/** Обезличить закрытый аккаунт, если по нему не осталось заявок на возврат в работе. */
export function anonymizeIfSettled(userId: string) {
  db.transaction((tx) => {
    const u = tx.select({ closedAt: schema.user.closedAt, email: schema.user.email }).from(schema.user).where(eq(schema.user.id, userId)).get();
    if (!u?.closedAt) return;
    const pending = tx
      .select({ id: schema.refundRequest.id })
      .from(schema.refundRequest)
      .where(and(eq(schema.refundRequest.userId, userId), eq(schema.refundRequest.status, "pending")))
      .get();
    if (pending) return;
    const closedEmail = `closed-${userId}@closed.invalid`;
    // Обращения из формы /contact — и привязанные к аккаунту, и отправленные гостем с того же email.
    tx.update(schema.contactMessage)
      .set({ name: "Closed account", email: closedEmail, userId })
      .where(or(eq(schema.contactMessage.userId, userId), sql`lower(${schema.contactMessage.email}) = lower(${u.email})`))
      .run();
    tx.update(schema.user).set({ email: closedEmail, name: "Closed account", image: null, emailVerified: false }).where(eq(schema.user.id, userId)).run();
  });
}
