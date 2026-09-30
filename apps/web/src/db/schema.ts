import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const now = sql`(unixepoch() * 1000)`;
const createdAt = () => integer("created_at", { mode: "timestamp_ms" }).notNull().default(now);
const updatedAt = () =>
  integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(now)
    .$onUpdate(() => new Date());

/* ——— Таблицы Better Auth (имена полей — как ждёт адаптер) ——— */

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  /** Хранить тексты запросов и ответов (Terms §7.4, Privacy §3). По умолчанию выключено. */
  logContent: integer("log_content", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

/* ——— Продукт ——— */

/** Ключ хранится только хешем (sha256). Открытый текст показывается один раз при создании. */
export const apiKey = sqliteTable(
  "api_key",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** Первые символы для узнавания в списке: sk-harvanera-ab12… */
    prefix: text("prefix").notNull(),
    hash: text("hash").notNull().unique(),
    /** Месячный лимит в микро-USD; null — без лимита. */
    limitMicros: integer("limit_micros"),
    createdAt: createdAt(),
    lastUsedAt: integer("last_used_at", { mode: "timestamp_ms" }),
    /** Временно выключен владельцем (в отличие от revoked — можно включить обратно). */
    disabledAt: integer("disabled_at", { mode: "timestamp_ms" }),
    /** Белый список моделей (id из каталога); null — все модели. */
    allowedModels: text("allowed_models", { mode: "json" }).$type<string[]>(),
    revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
  },
  (t) => [index("api_key_user_idx").on(t.userId)],
);

/**
 * Журнал проводок — источник правды по балансу (SPEC §4). Баланс = SUM(amount_micros).
 * Суммы в микро-USD (1 USD = 1 000 000), чтобы копеечные списания за токены не терялись.
 */
export const ledger = sqliteTable(
  "ledger",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["bonus", "topup", "debit", "refund", "adjust"] }).notNull(),
    amountMicros: integer("amount_micros").notNull(),
    /** Идемпотентность: request_id запроса к модели или id платежа. */
    ref: text("ref").unique(),
    note: text("note"),
    createdAt: createdAt(),
  },
  (t) => [index("ledger_user_idx").on(t.userId)],
);

/** Заказ на пополнение. Провайдер оплаты подключается на следующем этапе. */
export const payment = sqliteTable(
  "payment",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** Сумма к зачислению на баланс, микро-USD. */
    amountMicros: integer("amount_micros").notNull(),
    /** Что увидит пользователь на оплате: валюта и сумма в минорных единицах. */
    currency: text("currency").notNull(),
    amountMinor: integer("amount_minor").notNull(),
    status: text("status", { enum: ["pending", "paid", "failed", "canceled"] }).notNull().default("pending"),
    provider: text("provider"),
    providerRef: text("provider_ref"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("payment_user_idx").on(t.userId)],
);

/**
 * Журнал запросов к шлюзу (SPEC §5 п.5): метаданные без текста промптов.
 * id = x-request-id ответа = ledger.ref списания.
 */
export const requestLog = sqliteTable(
  "request_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** null — запрос из чата в кабинете (по сессии, без ключа). */
    apiKeyId: text("api_key_id").references(() => apiKey.id, { onDelete: "set null" }),
    model: text("model").notNull(),
    /** Хостер, который ответил: deepinfra, together, mock… null — до апстрима не дошло. */
    provider: text("provider"),
    status: integer("status").notNull(),
    errorCode: text("error_code"),
    stream: integer("stream", { mode: "boolean" }).notNull().default(false),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    /** Списано с клиента, микро-USD. */
    costMicros: integer("cost_micros").notNull().default(0),
    /** Токены посчитаны нами (обрыв стрима без usage), а не взяты у хостера. */
    estimated: integer("estimated", { mode: "boolean" }).notNull().default(false),
    latencyMs: integer("latency_ms"),
    ttftMs: integer("ttft_ms"),
    createdAt: createdAt(),
  },
  (t) => [index("request_log_user_idx").on(t.userId, t.createdAt), index("request_log_key_idx").on(t.apiKeyId, t.createdAt)],
);

/**
 * Тексты запроса и ответа — только если у пользователя включено логирование (user.log_content).
 * Хранятся CONTENT_RETENTION_DAYS (lib/request-content.ts), затем удаляются.
 */
export const requestContent = sqliteTable(
  "request_content",
  {
    id: text("id")
      .primaryKey()
      .references(() => requestLog.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** JSON массива messages. */
    request: text("request").notNull(),
    /** Текст ответа модели. */
    response: text("response").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("request_content_user_idx").on(t.userId), index("request_content_created_idx").on(t.createdAt)],
);
