import { auth } from "@/lib/auth";
import { parseActivityQuery } from "@/lib/activity-query";
import { listRequests } from "@/lib/usage";

/** Выгрузка ленты запросов в CSV (фильтры — как на странице «Активность»). */
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return new Response("Unauthorized", { status: 401 });
  const q = parseActivityQuery(Object.fromEntries(new URL(request.url).searchParams));
  const rows = await listRequests(session.user.id, q.filter, 100_000);
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  const head = ["request_id", "time_utc", "model", "source", "status", "error_code", "input_tokens", "output_tokens", "cost_usd", "estimated", "latency_ms"];
  const lines = rows.map((r) =>
    [
      r.id,
      r.createdAt.toISOString(),
      r.model,
      r.apiKeyId ? r.keyName : "chat",
      r.status,
      r.errorCode,
      r.inputTokens,
      r.outputTokens,
      (r.costMicros / 1_000_000).toFixed(6),
      r.estimated ? 1 : 0,
      r.latencyMs,
    ]
      .map(esc)
      .join(","),
  );
  return new Response([head.join(","), ...lines].join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="harvanera-usage-${q.range}d.csv"`,
      "cache-control": "no-store",
    },
  });
}
