import type { Metadata } from "next";
import { Activity, type ActivityData } from "@/components/dashboard/activity";
import { loadLocale } from "@/i18n/server";
import { listKeys, requireUser } from "@/lib/account";
import { parseActivityQuery } from "@/lib/activity-query";
import { listRequests, usageByDay, usageByModel, usageSummary } from "@/lib/usage";

export async function generateMetadata({ params }: PageProps<"/[lang]/dashboard/activity">): Promise<Metadata> {
  const { dict } = await loadLocale(params);
  return { title: dict.cab.activity.title, robots: { index: false } };
}

const usd = (micros: number) => micros / 1_000_000;

export default async function ActivityPage({ params, searchParams }: PageProps<"/[lang]/dashboard/activity">) {
  const { lang } = await loadLocale(params);
  const user = await requireUser(lang);
  const q = parseActivityQuery(await searchParams);

  // Сводка и график — по всему периоду (по фильтрам модели/источника — только лента запросов).
  const [summary, byDay, byModel, rows, keys] = await Promise.all([
    usageSummary(user.id, q.since),
    usageByDay(user.id, q.since),
    usageByModel(user.id, q.since),
    listRequests(user.id, q.filter, q.limit + 1),
    listKeys(user.id),
  ]);

  // Все дни периода, включая пустые — иначе ось времени врёт.
  const days: ActivityData["days"] = [];
  for (let i = 0; i < q.range; i++) {
    const d = new Date(q.since.getTime() + i * 86_400_000).toISOString().slice(0, 10);
    const items = byDay.filter((x) => x.day === d);
    days.push({
      day: d,
      byModel: Object.fromEntries(items.map((x) => [x.model, usd(x.costMicros)])),
      requests: items.reduce((s, x) => s + x.requests, 0),
    });
  }

  const data: ActivityData = {
    range: q.range,
    filter: { model: q.model, key: q.key },
    keys: keys.map((k) => ({ id: k.id, name: k.name })),
    summary: { ...summary, costUsd: usd(summary.costMicros) },
    days,
    byModel: byModel.map((m) => ({ ...m, costUsd: usd(m.costMicros) })),
    rows: rows.slice(0, q.limit).map((r) => ({
      id: r.id,
      at: r.createdAt.getTime(),
      model: r.model,
      source: r.apiKeyId ? (r.keyName ?? "—") : null,
      status: r.status,
      errorCode: r.errorCode,
      inputTokens: r.inputTokens,
      outputTokens: r.outputTokens,
      costUsd: usd(r.costMicros),
      estimated: r.estimated,
      latencyMs: r.latencyMs,
      hasContent: Boolean(r.hasContent),
    })),
    hasMore: rows.length > q.limit,
  };
  return <Activity data={data} />;
}
