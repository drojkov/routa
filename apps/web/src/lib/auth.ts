import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db, schema } from "@/db";
import { SIGNUP_BONUS_USD } from "@/lib/billing";
import { escapeHtml, sendEmail } from "@/lib/email";
import { CLIENT_IP_HEADERS, countryOf } from "@/lib/geo";

const env = process.env;

const SITE_URL = "https://harvanera.com";
const PROD_ORIGINS = [SITE_URL, "https://www.harvanera.com", "https://web-production-06476.up.railway.app"];

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
    // Вход без подтверждения, но пополнение — только с подтверждённым email (защита от card testing).
    requireEmailVerification: false,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24,
    sendVerificationEmail: async ({ user, url }) => {
      const text = `Confirm your email address for Harvanera by opening this link:\n\n${url}\n\nThe link is valid for 24 hours. If you didn't create an account, ignore this email.`;
      const html = `<div style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;color:#111;max-width:560px">
<p>Confirm your email address for Harvanera.</p>
<p><a href="${escapeHtml(url)}" style="display:inline-block;background:#111;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none">Confirm email</a></p>
<p style="color:#666;font-size:12px">The link is valid for 24 hours. If you didn't create an account, ignore this email.</p>
</div>`;
      await sendEmail({ to: user.email, subject: "Harvanera: confirm your email", text, html });
    },
  },
  // Те же заголовки IP, что у геоблокировки (CLIENT_IP_HEADERS в lib/geo.ts).
  advanced: { ipAddress: { ipAddressHeaders: CLIENT_IP_HEADERS } },
  // Вход только по email и паролю (Google убран 2026-10-27).
  user: { deleteUser: { enabled: true } },
  databaseHooks: {
    session: {
      create: {
        // Журнал входов для разбора чарджбэков (сессии удаляются при выходе, журнал — нет).
        after: async (sess) => {
          await db.insert(schema.loginEvent).values({
            id: crypto.randomUUID(),
            userId: sess.userId,
            ipAddress: sess.ipAddress ?? null,
            country: countryOf(sess.ipAddress ?? null),
            userAgent: sess.userAgent?.slice(0, 500) ?? null,
          });
        },
      },
    },
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
