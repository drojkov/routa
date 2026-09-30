"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { type Currency, isCurrency, isLocale, USD_RATES } from "@/i18n/config";
import { currentUserId, generateKey } from "@/lib/account";
import { MAX_TOPUP_USD, MIN_TOPUP_USD, toMicros } from "@/lib/billing";
import { creditPayment, demoPaymentsEnabled } from "@/lib/payments";
import { getRequestContent } from "@/lib/request-content";
import { MODELS } from "@/lib/site";

const MAX_KEYS = 25;

export type CreateKeyResult = { ok: true; key: string } | { ok: false; error: "name" | "limit" | "models" | "too_many" };

export async function createApiKey(input: {
  name: string;
  limit: string;
  currency: string;
  allowedModels?: string[] | null;
}): Promise<CreateKeyResult> {
  const userId = await currentUserId();
  const name = input.name.trim().slice(0, 60);
  if (!name) return { ok: false, error: "name" };

  let limitMicros: number | null = null;
  if (input.limit.trim()) {
    const v = Number(input.limit.replace(",", "."));
    const currency: Currency = isCurrency(input.currency) ? input.currency : "USD";
    if (!Number.isFinite(v) || v <= 0) return { ok: false, error: "limit" };
    limitMicros = toMicros(v / USD_RATES[currency]);
  }

  const active = await db
    .select({ id: schema.apiKey.id })
    .from(schema.apiKey)
    .where(and(eq(schema.apiKey.userId, userId), isNull(schema.apiKey.revokedAt)));
  if (active.length >= MAX_KEYS) return { ok: false, error: "too_many" };

  let allowedModels: string[] | null = null;
  if (input.allowedModels) {
    allowedModels = [...new Set(input.allowedModels)].filter((id) => MODELS.some((m) => m.id === id));
    if (!allowedModels.length) return { ok: false, error: "models" };
  }

  const { plain, hash, prefix } = generateKey();
  await db.insert(schema.apiKey).values({ id: crypto.randomUUID(), userId, name, prefix, hash, limitMicros, allowedModels });
  revalidatePath("/[lang]/dashboard", "layout");
  return { ok: true, key: plain };
}

export type UpdateKeyResult = { ok: true } | { ok: false; error: "name" | "limit" | "models" | "not_found" };

/**
 * Правка ключа владельцем. Передаются только меняемые поля:
 * limit — строка в валюте показа ("" — снять лимит); allowedModels — null = все модели.
 */
export async function updateApiKey(input: {
  id: string;
  name?: string;
  limit?: string;
  currency?: string;
  disabled?: boolean;
  allowedModels?: string[] | null;
}): Promise<UpdateKeyResult> {
  const userId = await currentUserId();
  const set: Partial<typeof schema.apiKey.$inferInsert> = {};

  if (input.name !== undefined) {
    const name = input.name.trim().slice(0, 60);
    if (!name) return { ok: false, error: "name" };
    set.name = name;
  }
  if (input.limit !== undefined) {
    if (!input.limit.trim()) set.limitMicros = null;
    else {
      const v = Number(input.limit.replace(",", "."));
      const currency: Currency = isCurrency(input.currency) ? input.currency : "USD";
      if (!Number.isFinite(v) || v <= 0) return { ok: false, error: "limit" };
      set.limitMicros = toMicros(v / USD_RATES[currency]);
    }
  }
  if (input.disabled !== undefined) set.disabledAt = input.disabled ? new Date() : null;
  if (input.allowedModels !== undefined) {
    if (input.allowedModels === null) set.allowedModels = null;
    else {
      const ids = [...new Set(input.allowedModels)].filter((id) => MODELS.some((m) => m.id === id));
      if (!ids.length) return { ok: false, error: "models" };
      set.allowedModels = ids;
    }
  }
  if (!Object.keys(set).length) return { ok: true };

  const res = await db
    .update(schema.apiKey)
    .set(set)
    .where(and(eq(schema.apiKey.id, input.id), eq(schema.apiKey.userId, userId), isNull(schema.apiKey.revokedAt)))
    .returning({ id: schema.apiKey.id });
  if (!res.length) return { ok: false, error: "not_found" };
  revalidatePath("/[lang]/dashboard", "layout");
  return { ok: true };
}

export async function revokeApiKey(id: string) {
  const userId = await currentUserId();
  await db
    .update(schema.apiKey)
    .set({ revokedAt: new Date() })
    .where(and(eq(schema.apiKey.id, id), eq(schema.apiKey.userId, userId), isNull(schema.apiKey.revokedAt)));
  revalidatePath("/[lang]/dashboard", "layout");
}

export type TopUpResult = { ok: false; error: "min" | "max" | "waiver" };

/**
 * Создаёт заказ на пополнение и ведёт на страницу оплаты.
 * Провайдер (Stripe / Paddle / ЮKassa…) подключается на следующем этапе: там же — вебхук, который
 * переводит заказ в paid и пишет проводку topup в ledger.
 */
export async function createTopUp(input: { amount: number; currency: string; waiver: boolean; lang: string }): Promise<TopUpResult> {
  const userId = await currentUserId();
  const currency: Currency = isCurrency(input.currency) ? input.currency : "USD";
  const lang = isLocale(input.lang) ? input.lang : "en";
  const usd = input.amount / USD_RATES[currency];
  if (!Number.isFinite(usd) || usd < MIN_TOPUP_USD - 1e-9) return { ok: false, error: "min" };
  if (usd > MAX_TOPUP_USD) return { ok: false, error: "max" };
  // Согласие на немедленное начало услуги (отказ от 14-дневного права отзыва для потраченного) — ЕС/UK.
  if (!input.waiver) return { ok: false, error: "waiver" };

  const minor = currency === "JPY" ? 1 : 100;
  const id = crypto.randomUUID();
  await db.insert(schema.payment).values({
    id,
    userId,
    amountMicros: toMicros(usd),
    currency,
    amountMinor: Math.round(input.amount * minor),
    status: "pending",
  });
  redirect(`/${lang}/dashboard/checkout/${id}`);
}

/** Демо-оплата заказа (см. `demoPaymentsEnabled`). Настоящее зачисление — только по вебхуку. */
export async function demoPay(input: { id: string; lang: string }) {
  const userId = await currentUserId();
  if (!demoPaymentsEnabled()) throw new Error("Demo payments are disabled");
  const order = await db.query.payment.findFirst({
    columns: { id: true },
    where: and(eq(schema.payment.id, input.id), eq(schema.payment.userId, userId)),
  });
  if (!order) throw new Error("Not found");
  creditPayment(order.id, "demo");
  const lang = isLocale(input.lang) ? input.lang : "en";
  revalidatePath("/[lang]/dashboard", "layout");
  redirect(`/${lang}/dashboard/checkout/${order.id}`);
}

/** Включить или выключить хранение текстов запросов. Уже сохранённые тексты не трогает. */
export async function setLogContent(enabled: boolean) {
  const userId = await currentUserId();
  await db.update(schema.user).set({ logContent: enabled }).where(eq(schema.user.id, userId));
  revalidatePath("/[lang]/dashboard", "layout");
}

/** Удалить все сохранённые тексты запросов пользователя. */
export async function deleteRequestContent() {
  const userId = await currentUserId();
  await db.delete(schema.requestContent).where(eq(schema.requestContent.userId, userId));
  revalidatePath("/[lang]/dashboard", "layout");
}

/** Текст запроса и ответа для ленты активности (только свои). */
export async function readRequestContent(id: string) {
  const userId = await currentUserId();
  return (await getRequestContent(userId, id)) ?? null;
}
