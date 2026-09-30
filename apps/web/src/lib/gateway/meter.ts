import "server-only";
import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { getBalanceMicros, hashKey } from "@/lib/account";
import { KEY_PREFIX } from "@/lib/billing";
import { clip, logContentEnabled, purgeExpiredContent } from "@/lib/request-content";
import type { Model } from "@/lib/site";

/**
 * Кто платит за запрос. keyId = null — чат в кабинете (по сессии, без ключа).
 * allowedModels = null — ключу доступны все модели. logContent — хранить тексты запроса и ответа.
 */
export type Actor = { userId: string; keyId: string | null; limitMicros: number | null; allowedModels: string[] | null; logContent: boolean };

/** Authorization: Bearer sk-harvanera-… → активный (не отозванный и не выключенный) ключ или null. */
export async function authenticate(request: Request): Promise<Actor | null> {
  const header = request.headers.get("authorization") ?? "";
  const plain = header.replace(/^Bearer\s+/i, "").trim();
  if (!plain.startsWith(KEY_PREFIX)) return null;
  const key = await db.query.apiKey.findFirst({
    columns: { id: true, userId: true, limitMicros: true, lastUsedAt: true, allowedModels: true },
    where: and(eq(schema.apiKey.hash, hashKey(plain)), isNull(schema.apiKey.revokedAt), isNull(schema.apiKey.disabledAt)),
  });
  if (!key) return null;
  // last_used_at с точностью до минуты — не пишем в БД на каждый запрос.
  if (!key.lastUsedAt || Date.now() - key.lastUsedAt.getTime() > 60_000) {
    await db.update(schema.apiKey).set({ lastUsedAt: new Date() }).where(eq(schema.apiKey.id, key.id));
  }
  return {
    userId: key.userId,
    keyId: key.id,
    limitMicros: key.limitMicros,
    allowedModels: key.allowedModels ?? null,
    logContent: await logContentEnabled(key.userId),
  };
}

/** Грубая оценка токенов: ~4 символа на токен. Только для предпроверки и обрыва стрима без usage. */
export const approxTokens = (text: string) => Math.ceil(text.length / 4);

/** Цена в прайсе — USD за 1M токенов, то есть ровно микро-USD за токен. */
export const costMicros = (model: Model, input: number, output: number) => Math.ceil(input * model.priceIn + output * model.priceOut);

/** Лимит вывода для предпроверки, если клиент не задал max_tokens. */
const DEFAULT_MAX_OUTPUT = 4096;
/** Допустимый минус от параллельных запросов (SPEC §5): предпроверка не резервирует деньги. */
const OVERDRAFT_MICROS = 0;

function monthStart() {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function keySpendMicros(keyId: string) {
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${schema.requestLog.costMicros}), 0)` })
    .from(schema.requestLog)
    .where(and(eq(schema.requestLog.apiKeyId, keyId), gte(schema.requestLog.createdAt, monthStart())));
  return Number(row?.total ?? 0);
}

/** Предпроверка (SPEC §5 п.2): хватит ли баланса и лимита ключа на худший случай ответа. */
export async function precheck(actor: Actor, model: Model, body: Record<string, unknown>) {
  const maxOut = Number(body.max_completion_tokens ?? body.max_tokens) || DEFAULT_MAX_OUTPUT;
  const estimate = costMicros(model, approxTokens(JSON.stringify(body.messages ?? "")), maxOut);
  const balance = await getBalanceMicros(actor.userId);
  if (balance - estimate < -OVERDRAFT_MICROS) return "insufficient_balance" as const;
  if (actor.keyId && actor.limitMicros != null && (await keySpendMicros(actor.keyId)) >= actor.limitMicros) {
    return "key_limit_exceeded" as const;
  }
  return null;
}

export type Settlement = {
  requestId: string;
  actor: Actor;
  model: Model;
  provider: string | null;
  status: number;
  errorCode?: string | null;
  stream: boolean;
  inputTokens: number;
  outputTokens: number;
  estimated?: boolean;
  latencyMs?: number;
  ttftMs?: number | null;
  /** Тексты для журнала — пишутся, только если у пользователя включено логирование. */
  content?: { request: string; response: string };
};

/**
 * Итог запроса: строка в request_log, тексты (если включено логирование) и, если есть расход,
 * проводка debit в ledger — одной транзакцией. ledger.ref = request_id, поэтому повторное списание невозможно.
 */
export function settle(s: Settlement) {
  const cost = s.status < 400 ? costMicros(s.model, s.inputTokens, s.outputTokens) : 0;
  db.transaction((tx) => {
    tx.insert(schema.requestLog)
      .values({
        id: s.requestId,
        userId: s.actor.userId,
        apiKeyId: s.actor.keyId,
        model: s.model.id,
        provider: s.provider,
        status: s.status,
        errorCode: s.errorCode ?? null,
        stream: s.stream,
        inputTokens: s.inputTokens,
        outputTokens: s.outputTokens,
        costMicros: cost,
        estimated: s.estimated ?? false,
        latencyMs: s.latencyMs ?? null,
        ttftMs: s.ttftMs ?? null,
      })
      .onConflictDoNothing()
      .run();
    if (s.actor.logContent && s.content) {
      tx.insert(schema.requestContent)
        .values({ id: s.requestId, userId: s.actor.userId, request: clip(s.content.request), response: clip(s.content.response) })
        .onConflictDoNothing()
        .run();
    }
    if (cost > 0) {
      tx.insert(schema.ledger)
        .values({ id: crypto.randomUUID(), userId: s.actor.userId, kind: "debit", amountMicros: -cost, ref: s.requestId, note: s.model.id })
        .onConflictDoNothing()
        .run();
    }
  });
  if (s.content) purgeExpiredContent();
  return cost;
}
