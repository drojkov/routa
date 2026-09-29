"use client";

import { ArrowUp, Code2, Plus, Settings2, Square } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useI18n } from "@/i18n/provider";
import { MODELS } from "@/lib/site";
import { KEY_PLACEHOLDER } from "@/lib/snippets";
import { cn } from "@/lib/utils";
import { ChatMarkdown } from "./markdown";
import { CodeBlock, ModelSelect, PageTitle } from "./ui";

type Usage = { input: number; output: number; costUsd: number };
type Msg =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; reasoning: string; model: string; usage?: Usage; error?: { code: string; message: string } };

const firstAvailable = MODELS.find((m) => m.available)?.id ?? MODELS[0].id;

/** Цена по прайсу модели — та же формула, что в шлюзе (микро-USD, округление вверх). */
function costUsd(modelId: string, input: number, output: number) {
  const m = MODELS.find((x) => x.id === modelId);
  return m ? Math.ceil(input * m.priceIn + output * m.priceOut) / 1_000_000 : 0;
}

/**
 * Чат (playground): запросы идут через тот же шлюз, что и API, и списываются с баланса.
 * Ответ приходит стримом; в конце — usage, по нему показываем стоимость.
 */
export function Chat({ initialModel, baseUrl }: { initialModel?: string; baseUrl: string }) {
  const { dict, money, t, href } = useI18n();
  const c = dict.cab.chat;
  const router = useRouter();
  const valid = MODELS.find((m) => m.id === initialModel && m.available);
  const [model, setModel] = React.useState(valid?.id ?? firstAvailable);
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [system, setSystem] = React.useState("");
  const [temperature, setTemperature] = React.useState(0.7);
  const [maxTokens, setMaxTokens] = React.useState(2048);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showCode, setShowCode] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const abort = React.useRef<AbortController | null>(null);
  const bottom = React.useRef<HTMLDivElement>(null);
  const current = MODELS.find((m) => m.id === model)!;

  const total = messages.reduce((s, m) => s + (m.role === "assistant" ? (m.usage?.costUsd ?? 0) : 0), 0);

  React.useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  function patchLast(fn: (m: Extract<Msg, { role: "assistant" }>) => Extract<Msg, { role: "assistant" }>) {
    setMessages((list) => {
      const last = list.at(-1);
      if (!last || last.role !== "assistant") return list;
      return [...list.slice(0, -1), fn(last)];
    });
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const history: Msg[] = [...messages, { role: "user", content: text }];
    setMessages([...history, { role: "assistant", content: "", reasoning: "", model }]);
    setInput("");
    setBusy(true);
    const ctrl = new AbortController();
    abort.current = ctrl;

    const payload = [
      ...(system.trim() ? [{ role: "system", content: system.trim() }] : []),
      // Ответы с ошибкой в историю не отправляем.
      ...history.filter((m) => m.role === "user" || !m.error).map((m) => ({ role: m.role, content: m.content })),
    ];

    try {
      const res = await fetch("/api/playground/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model, messages: payload, temperature, max_tokens: maxTokens }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const j = (await res.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null;
        patchLast((m) => ({ ...m, error: { code: j?.error?.code ?? "generic", message: j?.error?.message ?? `HTTP ${res.status}` } }));
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const events = buf.split("\n\n");
        buf = events.pop() ?? "";
        for (const ev of events) {
          const data = ev.replace(/^data:\s*/, "").trim();
          if (!data || data === "[DONE]") continue;
          let chunk: {
            choices?: { delta?: { content?: string; reasoning_content?: string; reasoning?: string } }[];
            usage?: { prompt_tokens: number; completion_tokens: number };
          };
          try {
            chunk = JSON.parse(data);
          } catch {
            continue;
          }
          const delta = chunk.choices?.[0]?.delta;
          const piece = delta?.content ?? "";
          const thought = delta?.reasoning_content ?? delta?.reasoning ?? "";
          if (piece || thought) patchLast((m) => ({ ...m, content: m.content + piece, reasoning: m.reasoning + thought }));
          if (chunk.usage) {
            const u = chunk.usage;
            patchLast((m) => ({ ...m, usage: { input: u.prompt_tokens, output: u.completion_tokens, costUsd: costUsd(m.model, u.prompt_tokens, u.completion_tokens) } }));
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") patchLast((m) => ({ ...m, error: { code: "generic", message: (e as Error).message } }));
    } finally {
      setBusy(false);
      abort.current = null;
      router.refresh(); // баланс в шапке
    }
  }

  const errorText = (e: { code: string; message: string }) =>
    e.code in c.errors ? c.errors[e.code as keyof typeof c.errors] : t(c.errors.generic, { message: e.message });

  return (
    <div>
      <PageTitle title={c.title} sub={c.sub} />
      <div className="shadow-soft flex min-h-[70vh] flex-col overflow-hidden rounded-3xl border border-border bg-card">
        {/* Панель модели */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <ModelSelect value={model} onChange={setModel} className="max-w-full min-w-0 flex-1 sm:flex-none" />
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {money(current.priceIn)} / {money(current.priceOut)} · 1M
          </span>
          <div className="ml-auto flex items-center gap-1">
            {total > 0 && <span className="px-2 text-xs text-muted-foreground tabular-nums">{t(c.total, { cost: money(total) })}</span>}
            <IconBtn active={showSettings} onClick={() => setShowSettings((v) => !v)} label={c.system}>
              <Settings2 className="size-4" />
            </IconBtn>
            <IconBtn active={showCode} onClick={() => setShowCode((v) => !v)} label={c.getCode}>
              <Code2 className="size-4" />
            </IconBtn>
            <button
              type="button"
              onClick={() => {
                abort.current?.abort();
                setMessages([]);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-medium transition hover:bg-muted"
            >
              <Plus className="size-3.5" /> {c.newChat}
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="grid gap-3 border-b border-border bg-muted/40 p-3 sm:grid-cols-[1fr_auto_auto]">
            <label className="text-xs text-muted-foreground">
              {c.system}
              <textarea
                value={system}
                onChange={(e) => setSystem(e.target.value)}
                rows={2}
                placeholder={c.systemPlaceholder}
                className="mt-1 w-full resize-y rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-brand"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              {c.temperature}: <span className="font-mono text-foreground">{temperature.toFixed(1)}</span>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="mt-3 block w-40 accent-[var(--brand)]"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              {c.maxTokens}
              <input
                type="number"
                min={16}
                max={32768}
                value={maxTokens}
                onChange={(e) => setMaxTokens(Math.max(16, Number(e.target.value) || 16))}
                className="mt-1 block h-9 w-28 rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-brand"
              />
            </label>
          </div>
        )}

        {showCode && (
          <div className="border-b border-border p-3">
            <CodeBlock key={model} baseUrl={baseUrl} apiKey={KEY_PLACEHOLDER} model={model} />
            <p className="mt-2 text-xs text-muted-foreground">{dict.cab.code.keyHint}</p>
          </div>
        )}

        {/* Сообщения */}
        <div className="flex-1 space-y-5 overflow-y-auto p-4 md:p-6">
          {messages.length === 0 ? (
            <div className="grid h-full min-h-[40vh] place-items-center text-center">
              <div>
                <p className="text-lg font-medium">{c.empty}</p>
                <p className="mt-1 text-sm text-muted-foreground">{c.emptyHint}</p>
              </div>
            </div>
          ) : (
            messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-foreground px-4 py-2.5 text-sm whitespace-pre-wrap text-background">{m.content}</div>
                </div>
              ) : (
                <div key={i} className="max-w-[92%]">
                  <p className="mb-1 font-mono text-[11px] text-muted-foreground">{m.model}</p>
                  {m.reasoning && (
                    <details className="mb-2 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                      <summary className="cursor-pointer select-none">{c.reasoning}</summary>
                      <p className="mt-2 whitespace-pre-wrap">{m.reasoning}</p>
                    </details>
                  )}
                  {m.content ? (
                    <div className="text-sm">
                      <ChatMarkdown text={m.content} />
                    </div>
                  ) : (
                    !m.error && busy && i === messages.length - 1 && <TypingDots />
                  )}
                  {m.error && (
                    <p role="alert" className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                      {errorText(m.error)}{" "}
                      {m.error.code === "insufficient_balance" && (
                        <Link href={href("/dashboard/billing")} className="font-medium underline underline-offset-2">
                          {c.topUpLink}
                        </Link>
                      )}
                    </p>
                  )}
                  {m.usage && (
                    <p className="mt-1.5 text-[11px] text-muted-foreground tabular-nums">
                      {t(c.usage, { input: m.usage.input, output: m.usage.output, cost: money(m.usage.costUsd) })}
                    </p>
                  )}
                </div>
              ),
            )
          )}
          <div ref={bottom} />
        </div>

        {/* Ввод */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="border-t border-border p-3"
        >
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/20">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder={t(c.placeholder, { model: current.name })}
              className="max-h-48 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none field-sizing-content"
            />
            {busy ? (
              <button
                type="button"
                onClick={() => abort.current?.abort()}
                aria-label={c.stop}
                className="grid size-9 shrink-0 place-items-center rounded-xl bg-foreground text-background"
              >
                <Square className="size-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                aria-label={c.send}
                disabled={!input.trim()}
                className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand text-white transition hover:bg-brand-strong disabled:opacity-40"
              >
                <ArrowUp className="size-4" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function IconBtn({ children, active, onClick, label }: { children: React.ReactNode; active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn("grid size-9 place-items-center rounded-xl border transition", active ? "border-brand bg-brand-soft/60 text-brand-strong" : "border-border hover:bg-muted")}
    >
      {children}
    </button>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 py-2">
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 120}ms` }} />
      ))}
    </span>
  );
}
