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
 * Имена и закупка сверены с каталогом DeepInfra (GET /v1/openai/models): первые пять — 2026-09-29,
 * остальные — 2026-10-27. Together и Fireworks добавлять сюда только после такой же сверки по их каталогу.
 * В каталоге только модели с открытыми весами (см. `MODELS` в `lib/site.ts`).
 */
export const ROUTES: Record<string, Deployment[]> = {
  "deepseek/deepseek-v3.1": [{ provider: "deepinfra", model: "deepseek-ai/DeepSeek-V3.1", cost: { in: 0.25, out: 0.95 } }],
  "deepseek/deepseek-v3.2": [{ provider: "deepinfra", model: "deepseek-ai/DeepSeek-V3.2", cost: { in: 0.26, out: 0.38 } }],
  "deepseek/deepseek-r1-0528": [{ provider: "deepinfra", model: "deepseek-ai/DeepSeek-R1-0528", cost: { in: 0.5, out: 2.15 } }],
  "qwen/qwen3-coder": [{ provider: "deepinfra", model: "Qwen/Qwen3-Coder-480B-A35B-Instruct-Turbo", cost: { in: 0.3, out: 1 } }],
  "qwen/qwen3-235b-a22b-2507": [{ provider: "deepinfra", model: "Qwen/Qwen3-235B-A22B-Instruct-2507", cost: { in: 0.09, out: 0.55 } }],
  "openai/gpt-oss-120b": [{ provider: "deepinfra", model: "openai/gpt-oss-120b", cost: { in: 0.037, out: 0.17 } }],
  "moonshotai/kimi-k2.6": [{ provider: "deepinfra", model: "moonshotai/Kimi-K2.6", cost: { in: 0.75, out: 3.5 } }],
  "z-ai/glm-4.7": [{ provider: "deepinfra", model: "zai-org/GLM-4.7", cost: { in: 0.4, out: 1.75 } }],
  "meta-llama/llama-4-scout": [{ provider: "deepinfra", model: "meta-llama/Llama-4-Scout-17B-16E-Instruct", cost: { in: 0.1, out: 0.3 } }],
  "meta-llama/llama-3.3-70b": [{ provider: "deepinfra", model: "meta-llama/Llama-3.3-70B-Instruct-Turbo", cost: { in: 0.1, out: 0.32 } }],
  "meta-llama/llama-3.1-8b": [{ provider: "deepinfra", model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo", cost: { in: 0.02, out: 0.04 } }],
  "mistralai/mistral-small-3.2": [{ provider: "deepinfra", model: "mistralai/Mistral-Small-3.2-24B-Instruct-2506", cost: { in: 0.075, out: 0.2 } }],
  "microsoft/phi-4": [{ provider: "deepinfra", model: "microsoft/phi-4", cost: { in: 0.07, out: 0.14 } }],
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
