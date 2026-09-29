import "server-only";

/**
 * Хостеры моделей (апстримы) и пул их ключей.
 *
 * Все хостеры здесь OpenAI-совместимые: тот же /chat/completions, тот же SSE, тот же usage.
 * Ключи — из переменных окружения, несколько через запятую: DEEPINFRA_API_KEYS=key1,key2.
 * Адрес можно переопределить: DEEPINFRA_BASE_URL=… (региональный эндпоинт, egress-прокси, тестовый стенд).
 * Состояние пула (cooldown, disabled) живёт в памяти процесса — при нескольких инстансах
 * его нужно вынести в Redis или таблицу provider_key (SPEC §4).
 */
export const PROVIDERS = {
  deepinfra: { baseURL: "https://api.deepinfra.com/v1/openai", env: "DEEPINFRA_API_KEYS" },
  together: { baseURL: "https://api.together.xyz/v1", env: "TOGETHER_API_KEYS" },
  fireworks: { baseURL: "https://api.fireworks.ai/inference/v1", env: "FIREWORKS_API_KEYS" },
} as const;

export type ProviderId = keyof typeof PROVIDERS;

export function baseURL(provider: ProviderId) {
  return process.env[PROVIDERS[provider].env.replace("_API_KEYS", "_BASE_URL")] || PROVIDERS[provider].baseURL;
}

type KeyState = { cooldownUntil: number; disabled: boolean };

const g = globalThis as unknown as { __gatewayKeys?: Map<string, KeyState> };
const state = (g.__gatewayKeys ??= new Map());

function keysOf(provider: ProviderId): string[] {
  return (process.env[PROVIDERS[provider].env] ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

export function hasKeys(provider: ProviderId) {
  return keysOf(provider).length > 0;
}

/** Живые ключи хостера в случайном порядке — нагрузка расходится по пулу. */
export function liveKeys(provider: ProviderId): string[] {
  const now = Date.now();
  const live = keysOf(provider).filter((k) => {
    const s = state.get(k);
    return !s || (!s.disabled && s.cooldownUntil <= now);
  });
  for (let i = live.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [live[i], live[j]] = [live[j], live[i]];
  }
  return live;
}

const tail = (key: string) => `…${key.slice(-4)}`;

/** 429 / 5xx / сеть: ключ временно выводится из ротации. */
export function cooldown(provider: ProviderId, key: string, ms: number) {
  state.set(key, { disabled: false, cooldownUntil: Date.now() + ms });
  console.warn(`[gateway] ${provider} key ${tail(key)} cooldown ${ms / 1000}s`);
}

/** 401 / 403: ключ отозван или забанен — до перезапуска не используем. */
export function disable(provider: ProviderId, key: string, status: number) {
  state.set(key, { disabled: true, cooldownUntil: 0 });
  // TODO: алерт владельцу (Telegram), SPEC §4.
  console.error(`[gateway] ALERT: ${provider} key ${tail(key)} disabled after HTTP ${status}`);
}
