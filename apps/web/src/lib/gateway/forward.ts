import "server-only";
import { mockUpstream } from "./mock";
import type { Resolved } from "./routes";
import { baseURL, cooldown, disable, liveKeys } from "./upstreams";

type Route = Extract<Resolved, { ok: true }>;

export type Forwarded =
  | { ok: true; response: Response; provider: string }
  /** Хостер отклонил сам запрос (400, 413, 422…) — ошибка клиента, отдаём его статус и текст. */
  | { ok: false; kind: "client"; status: number; message: string; provider: string }
  | { ok: false; kind: "exhausted" };

const UPSTREAM_TIMEOUT_MS = 30_000;

/**
 * Отправляет запрос хостерам по очереди (SPEC §4):
 * 429 / 5xx / сеть / таймаут до заголовков → ключ в cooldown, пробуем следующий ключ или хостера;
 * 401 / 403 → ключ отключается; 402 (нет денег у хостера) → cooldown; 404 → следующий хостер;
 * прочие 4xx — ошибка запроса клиента, не повторяем.
 * Переключение возможно только до начала ответа: начатый стрим не переносится.
 */
export async function forward(route: Route, body: Record<string, unknown>, signal: AbortSignal): Promise<Forwarded> {
  if (route.mock) return { ok: true, response: mockUpstream({ ...body, model: route.model.id }, signal), provider: "mock" };

  for (const d of route.deployments) {
    for (const key of liveKeys(d.provider)) {
      if (signal.aborted) return { ok: false, kind: "exhausted" };
      // Таймаут — только на ожидание заголовков: долгую генерацию он обрывать не должен.
      const headersTimeout = new AbortController();
      const timer = setTimeout(() => headersTimeout.abort(), UPSTREAM_TIMEOUT_MS);
      let res: Response;
      try {
        res = await fetch(`${baseURL(d.provider)}/chat/completions`, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
          body: JSON.stringify({ ...body, model: d.model }),
          signal: AbortSignal.any([signal, headersTimeout.signal]),
        });
      } catch (e) {
        if (signal.aborted) return { ok: false, kind: "exhausted" };
        console.warn(`[gateway] ${d.provider} network error:`, (e as Error).message);
        cooldown(d.provider, key, 15_000);
        continue;
      } finally {
        clearTimeout(timer);
      }
      if (res.ok) return { ok: true, response: res, provider: d.provider };

      if (res.status === 401 || res.status === 403) disable(d.provider, key, res.status);
      // 402 — кончились деньги у нас на счёте хостера, 404 — хостер не знает модель (ошибка в routes.ts).
      // Это наши проблемы, а не клиента: текст хостера не показываем, пробуем дальше.
      else if (res.status === 402) {
        console.error(`[gateway] ALERT: ${d.provider} account out of balance (402) — top up at the provider`);
        cooldown(d.provider, key, 300_000);
      } else if (res.status === 404) {
        console.error(`[gateway] ALERT: ${d.provider} does not know model ${d.model} (404) — check lib/gateway/routes.ts`);
        await res.body?.cancel().catch(() => {});
        break;
      } else if (res.status === 429) cooldown(d.provider, key, retryAfterMs(res) ?? 30_000);
      else if (res.status >= 500 || res.status === 408) cooldown(d.provider, key, 15_000);
      else {
        // Имя модели у хостера заменяем на наше — клиенту не нужно знать, кто исполняет запрос.
        const message = (await upstreamMessage(res)).replaceAll(d.model, route.model.id);
        return { ok: false, kind: "client", status: res.status, message, provider: d.provider };
      }
      await res.body?.cancel().catch(() => {});
    }
  }
  return { ok: false, kind: "exhausted" };
}

function retryAfterMs(res: Response) {
  const s = Number(res.headers.get("retry-after"));
  return Number.isFinite(s) && s > 0 ? Math.min(s * 1000, 300_000) : null;
}

async function upstreamMessage(res: Response) {
  const text = await res.text().catch(() => "");
  try {
    const j = JSON.parse(text) as { error?: { message?: unknown } | string; detail?: unknown; message?: unknown };
    const m = typeof j.error === "string" ? j.error : (j.error?.message ?? j.detail ?? j.message);
    if (typeof m === "string" && m) return m.slice(0, 500);
  } catch {}
  return "The request was rejected by the model provider.";
}
