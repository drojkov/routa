import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";

/**
 * Зачисляет оплаченный заказ: payment → paid и проводка topup в ledger, одной транзакцией.
 * Идемпотентно (ledger.ref = id заказа): повторный вебхук ничего не удвоит.
 * Эту функцию вызовет вебхук провайдера оплаты — после проверки подписи (SPEC §5 «Пополнение»).
 */
export function creditPayment(paymentId: string, provider: string, providerRef?: string) {
  return db.transaction((tx) => {
    const order = tx.select().from(schema.payment).where(eq(schema.payment.id, paymentId)).get();
    if (!order) return { ok: false as const, error: "not_found" as const };
    if (order.status === "paid") return { ok: true as const, already: true };
    if (order.status !== "pending") return { ok: false as const, error: "not_pending" as const };

    tx.update(schema.payment)
      .set({ status: "paid", provider, providerRef: providerRef ?? null })
      .where(and(eq(schema.payment.id, paymentId), eq(schema.payment.status, "pending")))
      .run();
    tx.insert(schema.ledger)
      .values({ id: crypto.randomUUID(), userId: order.userId, kind: "topup", amountMicros: order.amountMicros, ref: paymentId })
      .onConflictDoNothing()
      .run();
    return { ok: true as const, already: false };
  });
}

/**
 * Демо-оплата: пока провайдера нет, заказ можно отметить оплаченным кнопкой на странице заказа.
 * Вне production включена по умолчанию, в production — только с PAYMENTS_DEMO=true.
 */
export function demoPaymentsEnabled() {
  const flag = process.env.PAYMENTS_DEMO;
  if (flag) return flag === "true";
  return process.env.NODE_ENV !== "production";
}
