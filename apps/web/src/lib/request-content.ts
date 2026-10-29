import "server-only";
import { and, eq, gte } from "drizzle-orm";
import { db, schema } from "@/db";

/** Логирование текстов запросов (Terms §7.4, Privacy §3): включается пользователем в настройках. */

/** Сколько дней храним тексты. Метаданные (request_log) живут дольше — по ним биллинг. */
export const CONTENT_RETENTION_DAYS = 30;
/** Потолок на одно поле — чтобы один огромный запрос не раздул базу. */
const MAX_CHARS = 200_000;

export const clip = (s: string) => (s.length > MAX_CHARS ? `${s.slice(0, MAX_CHARS)}\n…[truncated]` : s);

export async function logContentEnabled(userId: string) {
  const row = await db.query.user.findFirst({ columns: { logContent: true }, where: eq(schema.user.id, userId) });
  return row?.logContent ?? false;
}

/** Тексты старше срока не показываем, даже если плановая чистка (db/index.ts) ещё не дошла до них. */
export const contentCutoff = () => new Date(Date.now() - CONTENT_RETENTION_DAYS * 86_400_000);

export function getRequestContent(userId: string, id: string) {
  return db.query.requestContent.findFirst({
    columns: { request: true, response: true },
    where: and(eq(schema.requestContent.id, id), eq(schema.requestContent.userId, userId), gte(schema.requestContent.createdAt, contentCutoff())),
  });
}
