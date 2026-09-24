/** Куда вернуть после входа: только относительный путь на этом же сайте (защита от open redirect). */
export function safeNext(next: string | null | undefined, fallback: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
