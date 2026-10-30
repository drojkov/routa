import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { and, eq, gte, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { SIGNUP_BONUS_USD } from "@/lib/billing";
import { escapeHtml, sendEmail } from "@/lib/email";
import { CLIENT_IP_HEADER, CLIENT_IP_HEADERS, clientIp, countryOf } from "@/lib/geo";

const env = process.env;

const SITE_URL = "https://harvanera.com";
/** Окно, в котором второй аккаунт с того же IP не получает бонус. */
const BONUS_IP_WINDOW_MS = 30 * 86_400_000;
const PROD_ORIGINS = [SITE_URL, "https://www.harvanera.com"];

export const auth = betterAuth({
  appName: "Harvanera",
  // Во время `next build` модули маршрутов загружаются без секретов — заглушка, чтобы Better Auth не ругался.
  // В работе — только BETTER_AUTH_SECRET.
  secret: env.BETTER_AUTH_SECRET ?? (env.NEXT_PHASE === "phase-production-build" ? "build-only-placeholder-secret-never-used-at-runtime" : undefined),
  // Прод — боевой домен (BETTER_AUTH_URL — для стенда); в dev — из запроса (localhost, туннели).
  // Без этого Better Auth брал адрес из запроса и отвечал 403 Invalid origin на harvanera.com.
  baseURL: env.BETTER_AUTH_URL ?? (env.NODE_ENV === "production" ? SITE_URL : undefined),
  database: drizzleAdapter(db, { provider: "sqlite", schema }),
  // Прод: боевой домен и www. Dev: туннели (см. DEV_TUNNELS в next.config.ts).
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
      // В фоне: пользователь не ждёт почтовый сервер (ошибки sendEmail пишет в лог сам).
      void sendEmail({ to: user.email, subject: "Harvanera: confirm your email", text, html });
    },
  },
  // Те же заголовки IP, что у геоблокировки (CLIENT_IP_HEADERS в lib/geo.ts).
  advanced: {
    // IP считает proxy.ts (с учётом Cloudflare); запасные — если запрос прошёл мимо него.
    ipAddress: { ipAddressHeaders: [CLIENT_IP_HEADER, ...CLIENT_IP_HEADERS] },
    // Имя cookie сессии — ровно как в Cookie Policy: `better-auth.session_token`, без префикса __Secure-.
    // Флаг Secure ставим сами (на проде — https).
    useSecureCookies: false,
    defaultCookieAttributes: { secure: env.NODE_ENV === "production" },
  },
  // Вход только по email и паролю (Google убран 2026-10-27).
  // Удаления аккаунта нет: закрытие — lib/account-close.ts (финансовые записи хранятся, Privacy §7).
  user: { deleteUser: { enabled: false } },
  databaseHooks: {
    session: {
      create: {
        // Закрытый или заблокированный поддержкой аккаунт войти не может (Terms §11). code читает auth-card.tsx.
        before: async (sess) => {
          const u = await db.query.user.findFirst({
            columns: { suspendedAt: true, closedAt: true },
            where: eq(schema.user.id, sess.userId),
          });
          if (u?.closedAt) throw new APIError("FORBIDDEN", { message: "This account has been closed.", code: "ACCOUNT_CLOSED" });
          if (u?.suspendedAt) throw new APIError("FORBIDDEN", { message: "This account is suspended. Contact info@harvanera.com.", code: "ACCOUNT_SUSPENDED" });
        },
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
        // Terms §5.4 / AUP §2.5: один бонус на человека — если с этого IP за 30 дней уже входил
        // другой аккаунт, бонус не даём (защита от мультиаккаунтов ради $1).
        after: async (u, ctx) => {
          const headers = ctx?.request?.headers ?? ctx?.headers;
          const ip = headers ? clientIp(headers) : null;
          if (ip) {
            const seen = await db.query.loginEvent.findFirst({
              columns: { id: true },
              where: and(eq(schema.loginEvent.ipAddress, ip), ne(schema.loginEvent.userId, u.id), gte(schema.loginEvent.createdAt, new Date(Date.now() - BONUS_IP_WINDOW_MS))),
            });
            if (seen) {
              console.warn(`[auth] welcome credit withheld for ${u.id}: IP already used by another account in 30 days`);
              return;
            }
          }
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
  // Согласия при регистрации (Terms, 18+, не из закрытой страны) проверяются и на сервере,
  // иначе прямой запрос к API регистрирует без них. Флаги шлёт auth-card.tsx.
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;
      const c = ctx.body?.consents;
      if (!c || c.terms !== true || c.adult !== true || c.location !== true) {
        throw new APIError("BAD_REQUEST", { message: "You must accept the Terms, confirm your age and confirm you are not in a restricted location.", code: "CONSENTS_REQUIRED" });
      }
    }),
  },
  // Регистрации — не больше 3 в час с одного IP (Privacy §4: автоматические сигналы подозрительных регистраций).
  rateLimit: { enabled: true, window: 60, max: 30, customRules: { "/sign-up/email": { window: 3600, max: 3 } } },
  plugins: [
    nextCookies(), // последним: проставляет cookie из server actions
  ],
});

export type Session = typeof auth.$Infer.Session;
