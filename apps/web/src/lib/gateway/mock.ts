import "server-only";
import { approxTokens } from "./meter";

/**
 * Мок-хостер в формате OpenAI: обычный ответ и SSE-стрим с usage в последнем чанке.
 * Ведёт себя как настоящий апстрим, поэтому шлюз обрабатывает его тем же кодом.
 */
export function mockUpstream(body: Record<string, unknown>, signal: AbortSignal): Response {
  const model = String(body.model);
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const last = messages.at(-1) as { content?: unknown } | undefined;
  const prompt = typeof last?.content === "string" ? last.content : JSON.stringify(last?.content ?? "");
  const text = `Mock response from ${model}. Real providers are not connected yet, but billing is live. You said: "${prompt.slice(0, 200)}"`;

  const id = `chatcmpl-mock-${crypto.randomUUID().slice(0, 8)}`;
  const created = Math.floor(Date.now() / 1000);
  const usage = {
    prompt_tokens: approxTokens(JSON.stringify(messages)),
    completion_tokens: approxTokens(text),
    total_tokens: 0,
  };
  usage.total_tokens = usage.prompt_tokens + usage.completion_tokens;

  if (!body.stream) {
    return Response.json({
      id,
      object: "chat.completion",
      created,
      model,
      choices: [{ index: 0, message: { role: "assistant", content: text }, finish_reason: "stop" }],
      usage,
    });
  }

  const includeUsage = (body.stream_options as { include_usage?: boolean } | undefined)?.include_usage;
  const words = text.split(/(?<= )/);
  const encoder = new TextEncoder();
  const chunk = (delta: object, finish: string | null) =>
    `data: ${JSON.stringify({ id, object: "chat.completion.chunk", created, model, choices: [{ index: 0, delta, finish_reason: finish }] })}\n\n`;

  // Клиент может оборвать стрим посреди ответа — после cancel() писать в контроллер нельзя.
  let canceled = false;
  const stream = new ReadableStream<Uint8Array>({
    cancel() {
      canceled = true;
    },
    async start(controller) {
      controller.enqueue(encoder.encode(chunk({ role: "assistant", content: "" }, null)));
      for (const w of words) {
        await new Promise((r) => setTimeout(r, 25));
        if (signal.aborted || canceled) return;
        controller.enqueue(encoder.encode(chunk({ content: w }, null)));
      }
      controller.enqueue(encoder.encode(chunk({}, "stop")));
      if (includeUsage) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ id, object: "chat.completion.chunk", created, model, choices: [], usage })}\n\n`));
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
  return new Response(stream, { headers: { "content-type": "text/event-stream" } });
}
