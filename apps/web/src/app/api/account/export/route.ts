import { and, desc, eq, gte, isNull, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { auth } from "@/lib/auth";
import { contentCutoff } from "@/lib/request-content";

/**
 * Выгрузка всех своих данных (Privacy §9, GDPR ст. 15/20): профиль, способы входа, ключи без секретов,
 * проводки, заказы, заявки на возврат, журнал входов, журнал запросов, обращения и сохранённые тексты запросов.
 */
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return new Response("Unauthorized", { status: 401 });
  const userId = session.user.id;
  // Обращения, отправленные с этого email без входа, — только при подтверждённом email:
  // иначе чужие сообщения прочитал бы любой, кто зарегистрировался на этот адрес.
  const email = session.user.email.toLowerCase();
  const ownMessages = session.user.emailVerified
    ? or(eq(schema.contactMessage.userId, userId), and(isNull(schema.contactMessage.userId), sql`lower(${schema.contactMessage.email}) = ${email}`))
    : eq(schema.contactMessage.userId, userId);

  const [profile, accounts, sessions, keys, ledger, payments, refundRequests, signIns, requests, messages, requestContent] = await Promise.all([
    db.query.user.findFirst({ where: eq(schema.user.id, userId) }),
    db
      .select({ provider: schema.account.providerId, createdAt: schema.account.createdAt })
      .from(schema.account)
      .where(eq(schema.account.userId, userId)),
    db
      .select({ createdAt: schema.session.createdAt, expiresAt: schema.session.expiresAt, ipAddress: schema.session.ipAddress, userAgent: schema.session.userAgent })
      .from(schema.session)
      .where(eq(schema.session.userId, userId)),
    db
      .select({
        name: schema.apiKey.name,
        prefix: schema.apiKey.prefix,
        limitMicros: schema.apiKey.limitMicros,
        allowedModels: schema.apiKey.allowedModels,
        createdAt: schema.apiKey.createdAt,
        lastUsedAt: schema.apiKey.lastUsedAt,
        disabledAt: schema.apiKey.disabledAt,
        blockedAt: schema.apiKey.blockedAt,
        revokedAt: schema.apiKey.revokedAt,
      })
      .from(schema.apiKey)
      .where(eq(schema.apiKey.userId, userId)),
    db.select().from(schema.ledger).where(eq(schema.ledger.userId, userId)).orderBy(desc(schema.ledger.createdAt)),
    db.select().from(schema.payment).where(eq(schema.payment.userId, userId)).orderBy(desc(schema.payment.createdAt)),
    db.select().from(schema.refundRequest).where(eq(schema.refundRequest.userId, userId)).orderBy(desc(schema.refundRequest.createdAt)),
    db.select().from(schema.loginEvent).where(eq(schema.loginEvent.userId, userId)).orderBy(desc(schema.loginEvent.createdAt)),
    db.select().from(schema.requestLog).where(eq(schema.requestLog.userId, userId)).orderBy(desc(schema.requestLog.createdAt)),
    db.select().from(schema.contactMessage).where(ownMessages).orderBy(desc(schema.contactMessage.createdAt)),
    db
      .select({ requestId: schema.requestContent.id, request: schema.requestContent.request, response: schema.requestContent.response, createdAt: schema.requestContent.createdAt })
      .from(schema.requestContent)
      .where(and(eq(schema.requestContent.userId, userId), gte(schema.requestContent.createdAt, contentCutoff())))
      .orderBy(desc(schema.requestContent.createdAt)),
  ]);

  const body = JSON.stringify(
    {
      exportedAt: new Date(),
      profile,
      signInMethods: accounts,
      activeSessions: sessions,
      apiKeys: keys,
      ledger,
      payments,
      refundRequests,
      signInHistory: signIns,
      requestLog: requests,
      contactMessages: messages,
      requestContent,
    },
    null,
    2,
  );
  return new Response(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="harvanera-data-${new Date().toISOString().slice(0, 10)}.json"`,
      "cache-control": "no-store",
    },
  });
}
