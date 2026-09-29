import "server-only";
import { apiError, type ErrorCode } from "./errors";
import { forward } from "./forward";
import { admit, record } from "./limits";
import { type Actor, approxTokens, precheck, settle } from "./meter";
import { resolveModel } from "./routes";
import type { Model } from "@/lib/site";

type Usage = { prompt_tokens?: number; completion_tokens?: number };

export const newRequestId = () => `req_${crypto.randomUUID().replaceAll("-", "")}`;

/**
 * Чат-запрос через шлюз (SPEC §5 «Жизненный цикл запроса»): лимиты → модель → предпроверка баланса →
 * хостер (с запасными) → списание по usage. Кто платит — `actor`: ключ API или сессия кабинета (чат).
 * Ответ — в формате OpenAI, со стримом или без.
 */
export async function runChat(request: Request, actor: Actor, requestId = newRequestId()) {
  const started = Date.now();
  // Лимиты считаются на ключ; чат кабинета — отдельный счётчик на пользователя.
  const limitId = actor.keyId ?? `user:${actor.userId}`;

  const gate = admit(limitId);
  if (!gate.ok) {
    if (gate.code === "rate_limited") record(limitId, 429);
    return apiError(gate.code, requestId, { retryAfter: gate.retryAfter });
  }
  const fail = (code: ErrorCode, opts?: Parameters<typeof apiError>[2]) => {
    const res = apiError(code, requestId, opts);
    record(limitId, res.status);
    return res;
  };

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail("invalid_request", { message: "Request body must be JSON." });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return fail("invalid_request");
  if (!Array.isArray(body.messages) || body.messages.length === 0) return fail("invalid_request", { message: "`messages` must be a non-empty array." });

  const route = resolveModel(body.model);
  if (!route.ok) return fail(route.code);
  if (actor.allowedModels && !actor.allowedModels.includes(route.model.id)) return fail("model_not_allowed");

  const denied = await precheck(actor, route.model, body);
  if (denied) return fail(denied);

  const stream = body.stream === true;
  const clientWantsUsage = (body.stream_options as { include_usage?: boolean } | undefined)?.include_usage === true;
  // usage в конце стрима нужен нам для списания, даже если клиент его не просил.
  const upstreamBody = stream ? { ...body, stream_options: { ...(body.stream_options as object), include_usage: true } } : body;

  const upstream = await forward(route, upstreamBody, request.signal);
  const base = { requestId, actor, model: route.model, stream };

  if (!upstream.ok) {
    if (upstream.kind === "client") {
      settle({ ...base, provider: upstream.provider, status: upstream.status, errorCode: "upstream_rejected", inputTokens: 0, outputTokens: 0 });
      record(limitId, upstream.status);
      return Response.json(
        { error: { message: upstream.message, type: "invalid_request_error", code: "upstream_rejected" } },
        { status: upstream.status, headers: { "x-request-id": requestId } },
      );
    }
    const code = route.deployments.length ? "upstream_error" : "model_unavailable";
    settle({ ...base, provider: null, status: code === "upstream_error" ? 502 : 503, errorCode: code, inputTokens: 0, outputTokens: 0 });
    return apiError(code, requestId);
  }

  const headers = { "x-request-id": requestId, "cache-control": "no-store" };

  if (!stream) {
    const json = (await upstream.response.json()) as { model?: string; usage?: Usage };
    json.model = route.model.id;
    const cost = settle({
      ...base,
      provider: upstream.provider,
      status: 200,
      inputTokens: json.usage?.prompt_tokens ?? 0,
      outputTokens: json.usage?.completion_tokens ?? 0,
      latencyMs: Date.now() - started,
    });
    return Response.json(json, { headers: { ...headers, "x-cost-usd": (cost / 1_000_000).toFixed(6) } });
  }

  return new Response(meterStream(upstream.response, {
      ...base,
      provider: upstream.provider,
      started,
      clientWantsUsage,
      inputEstimate: approxTokens(JSON.stringify(body.messages)),
    }), {
    headers: { ...headers, "content-type": "text/event-stream; charset=utf-8", connection: "keep-alive", "x-accel-buffering": "no" },
  });
}

/**
 * Пропускает SSE хостера к клиенту: подменяет model на наш id, забирает usage для списания и
 * убирает usage-чанк, если клиент его не просил. Списание — один раз: по завершении стрима или
 * при обрыве клиентом (тогда за сгенерированное до обрыва, SPEC §5 п.6).
 */
function meterStream(
  upstream: Response,
  ctx: { requestId: string; actor: Actor; model: Model; stream: boolean; provider: string; started: number; clientWantsUsage: boolean; inputEstimate: number },
) {
  const reader = upstream.body!.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  let usage: Usage | null = null;
  let outputChars = 0;
  let ttft: number | null = null;
  let settled = false;

  const finish = (interrupted: "client_aborted" | "upstream_interrupted" | null) => {
    if (settled) return;
    settled = true;
    const estimated = !usage;
    settle({
      ...ctx,
      status: 200,
      errorCode: interrupted,
      inputTokens: usage?.prompt_tokens ?? ctx.inputEstimate,
      outputTokens: usage?.completion_tokens ?? Math.ceil(outputChars / 4),
      estimated,
      latencyMs: Date.now() - ctx.started,
      ttftMs: ttft,
    });
  };

  const rewrite = (event: string): string | null => {
    const data = event.startsWith("data:") ? event.slice(5).trim() : null;
    if (!data || data === "[DONE]") return event;
    let chunk: { model?: string; usage?: Usage | null; choices?: { delta?: { content?: string; reasoning_content?: string } }[] };
    try {
      chunk = JSON.parse(data);
    } catch {
      return event;
    }
    if (chunk.usage) usage = chunk.usage;
    for (const c of chunk.choices ?? []) {
      const piece = (c.delta?.content ?? "") + (c.delta?.reasoning_content ?? "");
      if (piece && ttft == null) ttft = Date.now() - ctx.started;
      outputChars += piece.length;
    }
    if (!ctx.clientWantsUsage && chunk.usage) {
      if (!chunk.choices?.length) return null;
      delete chunk.usage;
    }
    chunk.model = ctx.model.id;
    return `data: ${JSON.stringify(chunk)}`;
  };

  const flushEvents = (controller: ReadableStreamDefaultController<Uint8Array>, final: boolean) => {
    const parts = buffer.split(/\r?\n\r?\n/);
    buffer = final ? "" : (parts.pop() ?? "");
    for (const part of parts) {
      if (!part.trim()) continue;
      const out = part
        .split(/\r?\n/)
        .map((line) => (line.startsWith("data:") ? rewrite(line) : line))
        .filter((l): l is string => l != null)
        .join("\n");
      if (out) controller.enqueue(encoder.encode(out + "\n\n"));
    }
  };

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          buffer += decoder.decode();
          flushEvents(controller, true);
          finish(null);
          controller.close();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        flushEvents(controller, false);
      } catch (e) {
        // Хостер оборвал стрим посреди ответа: списываем за то, что клиент успел получить.
        console.warn(`[gateway] ${ctx.provider} stream error:`, (e as Error).message);
        finish("upstream_interrupted");
        controller.error(e);
      }
    },
    async cancel() {
      finish("client_aborted");
      await reader.cancel().catch(() => {});
    },
  });
}
