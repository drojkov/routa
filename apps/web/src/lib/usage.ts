import "server-only";
import { and, desc, eq, gte, isNotNull, isNull, lt, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import { contentCutoff } from "@/lib/request-content";

/** Выборки по журналу запросов (request_log) для кабинета: активность, расход по ключам и моделям. */

const r = schema.requestLog;

export function daysAgo(days: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return d;
}

export function monthStart() {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function usageSummary(userId: string, since: Date) {
  const [row] = await db
    .select({
      cost: sql<number>`coalesce(sum(${r.costMicros}), 0)`,
      requests: sql<number>`count(*)`,
      errors: sql<number>`coalesce(sum(case when ${r.status} >= 400 then 1 else 0 end), 0)`,
      inputTokens: sql<number>`coalesce(sum(${r.inputTokens}), 0)`,
      outputTokens: sql<number>`coalesce(sum(${r.outputTokens}), 0)`,
    })
    .from(r)
    .where(and(eq(r.userId, userId), gte(r.createdAt, since)));
  return {
    costMicros: Number(row.cost),
    requests: Number(row.requests),
    errors: Number(row.errors),
    inputTokens: Number(row.inputTokens),
    outputTokens: Number(row.outputTokens),
  };
}

/** Расход по дням (UTC) и моделям — для графика. */
export async function usageByDay(userId: string, since: Date) {
  const day = sql<string>`strftime('%Y-%m-%d', ${r.createdAt} / 1000, 'unixepoch')`;
  const rows = await db
    .select({ day, model: r.model, cost: sql<number>`sum(${r.costMicros})`, requests: sql<number>`count(*)` })
    .from(r)
    .where(and(eq(r.userId, userId), gte(r.createdAt, since)))
    .groupBy(day, r.model);
  return rows.map((x) => ({ day: x.day, model: x.model, costMicros: Number(x.cost), requests: Number(x.requests) }));
}

export async function usageByModel(userId: string, since: Date) {
  const rows = await db
    .select({
      model: r.model,
      requests: sql<number>`count(*)`,
      inputTokens: sql<number>`sum(${r.inputTokens})`,
      outputTokens: sql<number>`sum(${r.outputTokens})`,
      cost: sql<number>`sum(${r.costMicros})`,
    })
    .from(r)
    .where(and(eq(r.userId, userId), gte(r.createdAt, since)))
    .groupBy(r.model)
    .orderBy(desc(sql`sum(${r.costMicros})`));
  return rows.map((x) => ({
    model: x.model,
    requests: Number(x.requests),
    inputTokens: Number(x.inputTokens),
    outputTokens: Number(x.outputTokens),
    costMicros: Number(x.cost),
  }));
}

export type RequestFilter = { model?: string; keyId?: string | "chat"; before?: Date; since?: Date };

/** Лента запросов, новые сверху. keyId = "chat" — запросы из чата кабинета. */
export async function listRequests(userId: string, f: RequestFilter, limit = 50) {
  const where: SQL[] = [eq(r.userId, userId)];
  if (f.model) where.push(eq(r.model, f.model));
  if (f.keyId === "chat") where.push(isNull(r.apiKeyId));
  else if (f.keyId) where.push(eq(r.apiKeyId, f.keyId));
  if (f.before) where.push(lt(r.createdAt, f.before));
  if (f.since) where.push(gte(r.createdAt, f.since));
  return db
    .select({
      id: r.id,
      createdAt: r.createdAt,
      model: r.model,
      apiKeyId: r.apiKeyId,
      keyName: schema.apiKey.name,
      status: r.status,
      errorCode: r.errorCode,
      stream: r.stream,
      inputTokens: r.inputTokens,
      outputTokens: r.outputTokens,
      costMicros: r.costMicros,
      estimated: r.estimated,
      latencyMs: r.latencyMs,
      ttftMs: r.ttftMs,
      hasContent: sql<number>`${schema.requestContent.id} is not null`,
    })
    .from(r)
    .leftJoin(schema.apiKey, eq(schema.apiKey.id, r.apiKeyId))
    .leftJoin(schema.requestContent, and(eq(schema.requestContent.id, r.id), gte(schema.requestContent.createdAt, contentCutoff())))
    .where(and(...where))
    .orderBy(desc(r.createdAt))
    .limit(limit);
}

/** Расход и число запросов по каждому ключу за период. */
export async function spendByKey(userId: string, since: Date) {
  const rows = await db
    .select({ keyId: r.apiKeyId, cost: sql<number>`sum(${r.costMicros})`, requests: sql<number>`count(*)` })
    .from(r)
    .where(and(eq(r.userId, userId), gte(r.createdAt, since), isNotNull(r.apiKeyId)))
    .groupBy(r.apiKeyId);
  return new Map(rows.map((x) => [x.keyId!, { costMicros: Number(x.cost), requests: Number(x.requests) }]));
}

export function listPayments(userId: string, limit = 50) {
  return db
    .select()
    .from(schema.payment)
    .where(eq(schema.payment.userId, userId))
    .orderBy(desc(schema.payment.createdAt))
    .limit(limit);
}
