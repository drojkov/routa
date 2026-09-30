import "server-only";
import { and, eq, lt } from "drizzle-orm";
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

let lastPurge = 0;

/** Удаляет тексты старше срока хранения. Не чаще раза в час — вызывается из шлюза при записи. */
export function purgeExpiredContent(now = Date.now()) {
  if (now - lastPurge < 3_600_000) return;
  lastPurge = now;
  const cutoff = new Date(now - CONTENT_RETENTION_DAYS * 86_400_000);
  db.delete(schema.requestContent).where(lt(schema.requestContent.createdAt, cutoff)).run();
}

export function getRequestContent(userId: string, id: string) {
  return db.query.requestContent.findFirst({
    columns: { request: true, response: true },
    where: and(eq(schema.requestContent.id, id), eq(schema.requestContent.userId, userId)),
  });
}
