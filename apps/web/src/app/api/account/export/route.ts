import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { auth } from "@/lib/auth";

/** Выгрузка своих данных (GDPR ст. 15/20): профиль, ключи без секретов, проводки, заказы. */
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return new Response("Unauthorized", { status: 401 });
  const userId = session.user.id;

  const [profile, accounts, keys, ledger, payments] = await Promise.all([
    db.query.user.findFirst({ where: eq(schema.user.id, userId) }),
    db
      .select({ provider: schema.account.providerId, createdAt: schema.account.createdAt })
      .from(schema.account)
      .where(eq(schema.account.userId, userId)),
    db
      .select({
        name: schema.apiKey.name,
        prefix: schema.apiKey.prefix,
        limitMicros: schema.apiKey.limitMicros,
        createdAt: schema.apiKey.createdAt,
        lastUsedAt: schema.apiKey.lastUsedAt,
        revokedAt: schema.apiKey.revokedAt,
      })
      .from(schema.apiKey)
      .where(eq(schema.apiKey.userId, userId)),
    db.select().from(schema.ledger).where(eq(schema.ledger.userId, userId)).orderBy(desc(schema.ledger.createdAt)),
    db.select().from(schema.payment).where(eq(schema.payment.userId, userId)).orderBy(desc(schema.payment.createdAt)),
  ]);

  const body = JSON.stringify({ exportedAt: new Date(), profile, signInMethods: accounts, apiKeys: keys, ledger, payments }, null, 2);
  return new Response(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="harvanera-data-${new Date().toISOString().slice(0, 10)}.json"`,
      "cache-control": "no-store",
    },
  });
}
