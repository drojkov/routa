import "server-only";
import { MODELS } from "@/lib/site";
import type { RequestFilter } from "@/lib/usage";
import { daysAgo } from "@/lib/usage";

/** Разбор фильтров «Активности» из query-параметров — общий для страницы и выгрузки CSV. */
export function parseActivityQuery(sp: Record<string, string | string[] | undefined>) {
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
  const r = Number(one(sp.range));
  const range: 7 | 30 | 90 = r === 7 || r === 90 ? r : 30;
  const model = MODELS.some((m) => m.id === one(sp.model)) ? one(sp.model) : undefined;
  const key = one(sp.key) || undefined;
  const limit = Math.min(1000, Math.max(50, Number(one(sp.limit)) || 50));
  const since = daysAgo(range);
  const filter: RequestFilter = { model, keyId: key, since };
  return { range, model, key, limit, since, filter };
}
