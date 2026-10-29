import "server-only";
import { and, desc, eq, gt, isNull, notExists, or } from "drizzle-orm";
import { db, schema } from "@/db";

/**
 * Уведомления в кабинете (Terms §17, §19): общие (user_id = null) и личные, не истёкшие и не скрытые
 * этим пользователем. Добавляет поддержка — scripts/notice.mjs.
 */
export function listActiveNotices(userId: string) {
  const n = schema.notice;
  return db
    .select({ id: n.id, title: n.title, body: n.body, createdAt: n.createdAt })
    .from(n)
    .where(
      and(
        or(isNull(n.userId), eq(n.userId, userId)),
        or(isNull(n.expiresAt), gt(n.expiresAt, new Date())),
        notExists(
          db
            .select({ x: schema.noticeDismissal.noticeId })
            .from(schema.noticeDismissal)
            .where(and(eq(schema.noticeDismissal.noticeId, n.id), eq(schema.noticeDismissal.userId, userId))),
        ),
      ),
    )
    .orderBy(desc(n.createdAt))
    .limit(5)
    .all();
}

/** Скрыть уведомление для пользователя — только то, которое ему адресовано. */
export function dismissNoticeFor(userId: string, noticeId: string) {
  const n = db.select({ userId: schema.notice.userId }).from(schema.notice).where(eq(schema.notice.id, noticeId)).get();
  if (!n || (n.userId && n.userId !== userId)) return false;
  db.insert(schema.noticeDismissal).values({ noticeId, userId }).onConflictDoNothing().run();
  return true;
}
