import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db, schema } from "@/db";
import { SIGNUP_BONUS_USD } from "@/lib/billing";

const env = process.env;

const SITE_URL = "https://harvanera.com";
const PROD_ORIGINS = [SITE_URL, "https://www.harvanera.com", "https://web-production-06476.up.railway.app"];

/**
 * Какие провайдеры реально настроены. Без ключей кнопка работает в демо-режиме
 * (см. demoSocialSignIn) — только вне production или с AUTH_DEMO_OAUTH=true.
 */
export const OAUTH = {
  google: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
};
export const DEMO_OAUTH = env.AUTH_DEMO_OAUTH === "true" || (env.NODE_ENV !== "production" && env.AUTH_DEMO_OAUTH !== "false");

export const auth = betterAuth({
  appName: "Harvanera",
  // Прод — боевой домен (BETTER_AUTH_URL — для стенда); в dev — из запроса (localhost, туннели).
  // Без этого Better Auth считал своим railway-адрес и отвечал 403 Invalid origin на harvanera.com.
  baseURL: env.BETTER_AUTH_URL ?? (env.NODE_ENV === "production" ? SITE_URL : undefined),
  database: drizzleAdapter(db, { provider: "sqlite", schema }),
  // Прод: боевой домен и адрес Railway. Dev: туннели (см. DEV_TUNNELS в next.config.ts).
  trustedOrigins: env.NODE_ENV === "production" ? PROD_ORIGINS : ["https://*.serveousercontent.com", "https://*.free.pinggy.net", "https://*.run.pinggy-free.link","https://*.lhr.life", "https://*.trycloudflare.com"],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // Почтового провайдера пока нет: подтверждение email и сброс пароля включаются вместе с ним.
    requireEmailVerification: false,
  },
  socialProviders: OAUTH.google
    ? { google: { clientId: env.GOOGLE_CLIENT_ID!, clientSecret: env.GOOGLE_CLIENT_SECRET!, prompt: "select_account" } }
    : {},
  account: { accountLinking: { enabled: true, trustedProviders: ["google"] } },
  user: { deleteUser: { enabled: true } },
  databaseHooks: {
    user: {
      create: {
        // Бонус на тест — одна проводка на пользователя (ref уникален).
        after: async (u) => {
          await db
            .insert(schema.ledger)
            .values({
              id: crypto.randomUUID(),
              userId: u.id,
              kind: "bonus",
              amountMicros: SIGNUP_BONUS_USD * 1_000_000,
              ref: `signup-bonus:${u.id}`,
              note: "Welcome credit",
            })
            .onConflictDoNothing();
        },
      },
    },
  },
  rateLimit: { enabled: true, window: 60, max: 30 },
  plugins: [
    nextCookies(), // последним: проставляет cookie из server actions
  ],
});

export type Session = typeof auth.$Infer.Session;
