import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { isLocale, LOCALE_COOKIE, matchLocale } from "@/i18n/config";

/**
 * 1. Путь без языка → редирект на /{язык}/… (cookie выбора, затем Accept-Language).
 * 2. Кабинет без cookie сессии → на вход. Это быстрая проверка; настоящая — в layout кабинета.
 * 3. Вход/регистрация с сессией → сразу в кабинет.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const [, first, second] = pathname.split("/");

  if (!isLocale(first)) {
    const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
    const locale = isLocale(cookie) ? cookie : matchLocale(request.headers.get("accept-language"));
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
  if ((second === "sign-in" || second === "sign-up") && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = `/${first}/dashboard`;
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Всё, кроме API, служебных путей Next и файлов с расширением (логотипы, favicon).
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
