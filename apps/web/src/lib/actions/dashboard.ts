"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { type Currency, isCurrency, isLocale, USD_RATES } from "@/i18n/config";
import { currentUserId, generateKey } from "@/lib/account";
import { MAX_TOPUP_USD, MIN_TOPUP_USD, toMicros } from "@/lib/billing";

const MAX_KEYS = 25;

export type CreateKeyResult = { ok: true; key: string } | { ok: false; error: "name" | "limit" | "too_many" };

export async function createApiKey(input: { name: string; limit: string; currency: string }): Promise<CreateKeyResult> {
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

  const { plain, hash, prefix } = generateKey();
  await db.insert(schema.apiKey).values({ id: crypto.randomUUID(), userId, name, prefix, hash, limitMicros });
  revalidatePath("/[lang]/dashboard", "page");
  return { ok: true, key: plain };
}

export async function revokeApiKey(id: string) {
  const userId = await currentUserId();
  await db
    .update(schema.apiKey)
    .set({ revokedAt: new Date() })
    .where(and(eq(schema.apiKey.id, id), eq(schema.apiKey.userId, userId), isNull(schema.apiKey.revokedAt)));
  revalidatePath("/[lang]/dashboard", "page");
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
