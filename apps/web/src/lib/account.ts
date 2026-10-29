import "server-only";
import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import { db, schema } from "@/db";
import { auth } from "@/lib/auth";
import { KEY_PREFIX } from "@/lib/billing";
import { safeNext } from "@/lib/safe-next";

/** Текущий пользователь или редирект на вход. */
export async function requireUser(lang: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(`/${lang}/sign-in?next=/${lang}/dashboard`);
  return session.user;
}

/**
 * Вход/регистрация при действующей сессии → сразу в кабинет (или в `next`).
 * Проверка — по базе, а не по наличию cookie: с протухшей cookie страница входа должна открыться,
 * иначе кабинет и вход бесконечно перекидывают друг на друга.
 */
export async function redirectIfSignedIn(lang: string, next?: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect(safeNext(next, `/${lang}/dashboard`));
}

/** Для server actions: без редиректа, просто отказ. */
export async function currentUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  return session.user.id;
}

export async function getBalanceMicros(userId: string) {
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${schema.ledger.amountMicros}), 0)` })
    .from(schema.ledger)
    .where(eq(schema.ledger.userId, userId));
  return Number(row?.total ?? 0);
}

export async function getMonthSpendMicros(userId: string) {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${schema.ledger.amountMicros}), 0)` })
    .from(schema.ledger)
    .where(and(eq(schema.ledger.userId, userId), eq(schema.ledger.kind, "debit"), gte(schema.ledger.createdAt, start)));
  return Math.abs(Number(row?.total ?? 0));
}

export function listKeys(userId: string) {
  return db
    .select({
      id: schema.apiKey.id,
      name: schema.apiKey.name,
      prefix: schema.apiKey.prefix,
      limitMicros: schema.apiKey.limitMicros,
      createdAt: schema.apiKey.createdAt,
      lastUsedAt: schema.apiKey.lastUsedAt,
      disabledAt: schema.apiKey.disabledAt,
      blockedAt: schema.apiKey.blockedAt,
      allowedModels: schema.apiKey.allowedModels,
      revokedAt: schema.apiKey.revokedAt,
    })
    .from(schema.apiKey)
    .where(eq(schema.apiKey.userId, userId))
    .orderBy(isNull(schema.apiKey.revokedAt), desc(schema.apiKey.createdAt));
}

export function listLedger(userId: string, limit = 20, kind?: (typeof schema.ledger.kind.enumValues)[number]) {
  return db
    .select({
      id: schema.ledger.id,
      kind: schema.ledger.kind,
      amountMicros: schema.ledger.amountMicros,
      note: schema.ledger.note,
      createdAt: schema.ledger.createdAt,
    })
    .from(schema.ledger)
    .where(kind ? and(eq(schema.ledger.userId, userId), eq(schema.ledger.kind, kind)) : eq(schema.ledger.userId, userId))
    .orderBy(desc(schema.ledger.createdAt))
    .limit(limit);
}

/** Ключ: sk-harvanera- + 40 символов base62. В БД — только sha256 и узнаваемый префикс. */
export function generateKey() {
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const bytes = randomBytes(40);
  const body = Array.from(bytes, (b) => alphabet[b % 62]).join("");
  const plain = KEY_PREFIX + body;
  return { plain, hash: hashKey(plain), prefix: `${KEY_PREFIX}${body.slice(0, 4)}…${body.slice(-4)}` };
}

export const hashKey = (plain: string) => createHash("sha256").update(plain).digest("hex");
