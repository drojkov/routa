"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac } from "node:crypto";
import { db, schema } from "@/db";
import { auth, DEMO_OAUTH, OAUTH } from "@/lib/auth";
import { safeNext } from "@/lib/safe-next";

const DEMO_NAMES = { google: "Google Demo", yandex: "Yandex Demo" } as const;

/**
 * Имитация входа через Google / Яндекс, пока нет OAuth-ключей.
 * Заводит (или открывает) демо-аккаунт demo-<provider>@example.com и ставит обычную сессию —
 * дальше кабинет, ключи и баланс работают по-настоящему. С ключами в .env кнопки идут в реальный OAuth.
 */
export async function demoSocialSignIn(provider: "google" | "yandex", next: string, fallback: string) {
  if (!DEMO_OAUTH || OAUTH[provider]) throw new Error("Demo sign-in is disabled");

  const email = `demo-${provider}@example.com`;
  // Пароль выводится из секрета: снаружи его не узнать, а нам не нужно его хранить.
  const password = createHmac("sha256", process.env.BETTER_AUTH_SECRET ?? "dev").update(email).digest("hex").slice(0, 48);
  const h = await headers();

  const existing = await db.query.user.findFirst({ where: eq(schema.user.email, email) });
  if (existing) await auth.api.signInEmail({ body: { email, password, rememberMe: true }, headers: h });
  else await auth.api.signUpEmail({ body: { email, password, name: DEMO_NAMES[provider] }, headers: h });

  redirect(safeNext(next, fallback));
}
