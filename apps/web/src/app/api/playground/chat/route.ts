import { auth } from "@/lib/auth";
import { newRequestId, runChat } from "@/lib/gateway/chat";
import { apiError } from "@/lib/gateway/errors";
import { logContentEnabled } from "@/lib/request-content";

/**
 * Чат в кабинете: тот же шлюз, но платит владелец сессии, ключ не нужен.
 * Пропускаем только поля, которые задаёт интерфейс чата, и всегда стримим с usage — по нему
 * интерфейс показывает стоимость каждого ответа.
 */
export async function POST(request: Request) {
  const requestId = newRequestId();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return apiError("invalid_api_key", requestId, { message: "Sign in to use the chat." });

  let input: { model?: unknown; messages?: unknown; temperature?: unknown; max_tokens?: unknown };
  try {
    input = await request.json();
  } catch {
    return apiError("invalid_request", requestId);
  }
  const body = {
    model: input.model,
    messages: input.messages,
    ...(typeof input.temperature === "number" ? { temperature: input.temperature } : {}),
    ...(typeof input.max_tokens === "number" ? { max_tokens: input.max_tokens } : {}),
    stream: true,
    stream_options: { include_usage: true },
  };
  const proxied = new Request(request.url, { method: "POST", body: JSON.stringify(body), signal: request.signal });
  const userId = session.user.id;
  const actor = { userId, keyId: null, limitMicros: null, allowedModels: null, logContent: await logContentEnabled(userId) };
  return runChat(proxied, actor, requestId);
}
