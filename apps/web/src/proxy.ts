import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE } from "@/i18n/config";

/**
 * 1. Путь без языка → редирект на /{язык}/…: язык из cookie выбора, иначе английский (язык браузера не учитываем).
 *    Старые ссылки на убранный русский (/ru/…) ведут на английскую версию.
 * 2. Кабинет без cookie сессии → на вход. Это быстрая проверка; настоящая — в layout кабинета.
 * Вход/регистрация с сессией → в кабинет: это делают сами страницы (`redirectIfSignedIn`), по базе.
 * Здесь видна только cookie, а с протухшей cookie такой редирект зацикливался с кабинетом.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const [, first, second] = pathname.split("/");

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

  const hasSession = !!getSessionCookie(request);
  if (second === "dashboard" && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = `/${first}/sign-in`;
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Всё, кроме API (включая шлюз /v1), служебных путей Next и файлов с расширением (логотипы, favicon).
  matcher: ["/((?!api|v1/|_next/static|_next/image|.*\\..*).*)"],
};
