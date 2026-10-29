import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from "@/i18n/config";
import { CLIENT_IP_HEADER, GEO_BYPASS_COOKIE, hasBypass, isBlocked, resolveClientIp } from "@/lib/geo";

/**
 * 0. Геоблокировка (Terms §2, `lib/geo.ts`): из закрытых стран недоступен сам сервис — вход,
 *    регистрация, кабинет, оплата и API. Витрина (лендинг, модели, цены, документация, юр. тексты)
 *    открыта всем. `?geo_bypass=<GEO_BYPASS_TOKEN>` ставит cookie обхода для команды.
 * 1. Путь без языка → редирект на /{язык}/…: язык из cookie выбора, иначе английский (язык браузера не учитываем).
 *    Старые ссылки на убранный русский (/ru/…) ведут на английскую версию.
 * 2. Кабинет без cookie сессии → на вход. Это быстрая проверка; настоящая — в layout кабинета.
 * Вход/регистрация с сессией → в кабинет: это делают сами страницы (`redirectIfSignedIn`), по базе.
 * Здесь видна только cookie, а с протухшей cookie такой редирект зацикливался с кабинетом.
 * IP клиента считается здесь один раз (Cloudflare или напрямую — `resolveClientIp`) и уходит дальше
 * в CLIENT_IP_HEADER: его читают Better Auth (лимит регистраций, журнал входов), действия кабинета и шлюз.
 */
export function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;
  const [, first, second] = pathname.split("/");
  const ip = resolveClientIp(request.headers);
  const forwardHeaders = new Headers(request.headers);
  if (ip) forwardHeaders.set(CLIENT_IP_HEADER, ip);
  else forwardHeaders.delete(CLIENT_IP_HEADER);
  const next = () => NextResponse.next({ request: { headers: forwardHeaders } });

  const bypassParam = searchParams.get("geo_bypass");
  if (bypassParam) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("geo_bypass");
    const res = NextResponse.redirect(url);
    // Служебная cookie команды — только при верном токене (обычным посетителям не ставится, Cookie Policy §2).
    if (hasBypass(bypassParam)) res.cookies.set(GEO_BYPASS_COOKIE, bypassParam, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 31536000 });
    return res;
  }

  const isApi = first === "api" || first === "v1";
  if (isApi) {
    if (isServiceApi(pathname) && isBlocked(ip, request.cookies.get(GEO_BYPASS_COOKIE)?.value)) {
      return Response.json(
        { error: { message: "Harvanera is not available in your country or region.", type: "permission_error", code: "region_unavailable" } },
        { status: 451 },
      );
    }
    return next();
  }

  if (first === "ru") {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}${pathname.slice(3)}`;
    return NextResponse.redirect(url, 308);
  }

  if (!isLocale(first)) {
    const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
    const locale = isLocale(cookie) ? cookie : DEFAULT_LOCALE;
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    url.search = search;
    return NextResponse.redirect(url);
  }

  if (SERVICE_PAGES.has(second) && isBlocked(ip, request.cookies.get(GEO_BYPASS_COOKIE)?.value)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${first}/unavailable`;
    url.search = "";
    return NextResponse.redirect(url);
  }

  const hasSession = !!getSessionCookie(request);
  if (second === "dashboard" && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = `/${first}/sign-in`;
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return next();
}

/** Страницы сервиса (закрываются геоблокировкой); остальное — витрина. */
const SERVICE_PAGES = new Set(["sign-in", "sign-up", "dashboard"]);

/** API сервиса: вход, кабинет, чат, шлюз. Каталог моделей — открытый (он же healthcheck контейнера). */
function isServiceApi(pathname: string) {
  if (pathname === "/v1/models" || pathname === "/api/v1/models") return false;
  return /^\/(v1|api\/(v1|auth|playground|account))(\/|$)/.test(pathname);
}

export const config = {
  // Всё, кроме служебных путей Next и файлов с расширением (логотипы, favicon). API — только ради геоблокировки.
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)", "/api/account/usage.csv"],
};
