import "server-only";
import { MODELS, type Model } from "@/lib/site";
import { hasKeys, type ProviderId } from "./upstreams";

type Deployment = {
  provider: ProviderId;
  model: string;
  /** Закупка у хостера, USD за 1M токенов. */
  cost: { in: number; out: number };
};

/**
 * Откуда шлюз берёт каждую публичную модель. Порядок = приоритет: при 429 / 5xx / сбое сети
 * запрос уходит к следующему хостеру.
 *
 * Имена и закупка сверены с каталогом DeepInfra (GET /v1/openai/models) 2026-09-29.
 * Together и Fireworks добавлять сюда только после такой же сверки по их каталогу.
 * Закрытые модели (GPT, Claude, Gemini) добавляются, когда появится доступ, вместе с
 * `available: true` в `lib/site.ts`.
 */
export const ROUTES: Record<string, Deployment[]> = {
  "deepseek/deepseek-v3.1": [{ provider: "deepinfra", model: "deepseek-ai/DeepSeek-V3.1", cost: { in: 0.25, out: 0.95 } }],
  "qwen/qwen3-coder": [{ provider: "deepinfra", model: "Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo", cost: { in: 0.3, out: 1 } }],
  "openai/gpt-oss-120b": [{ provider: "deepinfra", model: "openai/gpt-oss-120b", cost: { in: 0.037, out: 0.17 } }],
  "moonshotai/kimi-k2.6": [{ provider: "deepinfra", model: "moonshotai/Kimi-K2.6", cost: { in: 0.75, out: 3.5 } }],
  "meta-llama/llama-3.3-70b": [{ provider: "deepinfra", model: "meta-llama/Llama-3.3-70B-Instruct-Turbo", cost: { in: 0.1, out: 0.32 } }],
};

/** Не продаём в минус: хостер, чья закупка выше нашей цены продажи, в ротацию не попадает. */
const profitable = (model: Model, d: Deployment) => d.cost.in <= model.priceIn && d.cost.out <= model.priceOut;

/**
 * Мок-апстрим: пока ключей хостеров нет, шлюз отвечает сгенерированным текстом и честно
 * списывает деньги — так весь путь (ключ → баланс → списание) проверяется без закупки.
 * Вне production включён по умолчанию, в production — только с GATEWAY_MOCK=true.
 */
export function mockEnabled() {
  const flag = process.env.GATEWAY_MOCK;
  if (flag) return flag === "true";
  return process.env.NODE_ENV !== "production";
}

export type Resolved =
  | { ok: true; model: Model; deployments: Deployment[]; mock: boolean }
  | { ok: false; code: "model_not_found" | "model_unavailable" };

export function resolveModel(id: unknown): Resolved {
  const model = typeof id === "string" ? MODELS.find((m) => m.id === id) : undefined;
  if (!model) return { ok: false, code: "model_not_found" };
  if (!model.available) return { ok: false, code: "model_unavailable" };
  const deployments = (ROUTES[model.id] ?? []).filter((d) => hasKeys(d.provider) && profitable(model, d));
  if (deployments.length) return { ok: true, model, deployments, mock: false };
  if (mockEnabled()) return { ok: true, model, deployments: [], mock: true };
  return { ok: false, code: "model_unavailable" };
}
