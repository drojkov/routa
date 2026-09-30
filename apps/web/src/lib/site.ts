/** Рабочее название. Меняется здесь — и везде на сайте. */
export const BRAND = "Harvanera";
/** Публичный адрес шлюза. Поддомена api. в DNS нет (2026-09-30) — шлюз на основном домене, /v1. */
export const API_BASE = "https://harvanera.com/v1";

/**
 * Реквизиты компании (Гонконг). Подставляются в футер и юридические документы ({{company.*}}).
 * Сами документы (src/content/legal) содержат реквизиты текстом — при смене править и там.
 */
export const COMPANY = {
  legalName: "Harvanera Limited",
  jurisdiction: "Hong Kong SAR",
  crNumber: "81275806",
  address: "Unit 704C, 7/F, Block 3, Nan Fung Industrial City, 18 Tin Hau Road, Tuen Mun, N.T., Hong Kong",
  email: "info@harvanera.com",
};

/** Дата вступления юридических документов в силу. */
export const LEGAL_EFFECTIVE_DATE = "30 September 2026";

export const LEGAL_DOCS = [
  "terms",
  "privacy",
  "cookies",
  "refunds",
  "acceptable-use",
] as const;
export type LegalDoc = (typeof LEGAL_DOCS)[number];

export const NAV = [
  { href: "/", key: "home" },
  { href: "/models", key: "models" },
  { href: "/compare", key: "compare" },
  { href: "/docs", key: "docs" },
  { href: "/#pricing", key: "pricing" },
  { href: "/#faq", key: "faq" },
] as const;

export const TIERS = ["flagship", "general", "fast", "budget"] as const;
export type Tier = (typeof TIERS)[number];
export type Tag = "reasoning" | "tools" | "vision" | "code" | "context" | "pdf" | "fast";

export type Model = {
  id: string;
  name: string;
  vendor: string;
  tier: Tier;
  context: string;
  /** USD за 1M входных / выходных токенов */
  priceIn: number;
  priceOut: number;
  /** ≈ USD за типичный ответ в чате (1k вход / 500 выход) */
  typical: number;
  /** токенов в секунду */
  speed: number;
  /** время до первого токена, с */
  ttft: number;
  /** сводный индекс качества 0–100 */
  quality: number;
  /** Градиент карточки (реф. 4) */
  gradient: [string, string, string];
  stripe: string;
  ink: "dark" | "light";
  tags: Tag[];
  /**
   * Продаётся ли модель сейчас. false — в каталоге с плашкой «временно недоступна», шлюз отвечает 503.
   * Откуда шлюз берёт модель — `lib/gateway/routes.ts`.
   */
  available: boolean;
};

type ModelInput = Omit<Model, "typical">;
const typical = (m: ModelInput): Model => ({ ...m, typical: (1000 * m.priceIn + 500 * m.priceOut) / 1_000_000 });

/**
 * Цены продажи. Для доступных моделей = закупка у хостера × 1.05, округлено вверх
 * (до 2 значащих цифр ниже $1, до цента выше) — закупка и сверка в `lib/gateway/routes.ts`.
 * Для недоступных (GPT, Claude, Gemini) — прайс вендора, пересчитать при подключении.
 * Скорость и качество условные до сбора реальных метрик.
 */
export const MODELS: Model[] = (
  [
    {
      id: "openai/gpt-5",
      available: false,
      name: "GPT-5",
      vendor: "OpenAI",
      tier: "flagship",
      context: "400K",
      priceIn: 1.25,
      priceOut: 10,
      speed: 82,
      ttft: 0.9,
      quality: 92,
      gradient: ["#e9fbd5", "#9be15d", "#3ccf4e"],
      stripe: "#35c23f",
      ink: "dark",
      tags: ["reasoning", "tools", "vision"],
    },
    {
      id: "anthropic/claude-sonnet-4.5",
      available: false,
      name: "Claude Sonnet 4.5",
      vendor: "Anthropic",
      tier: "flagship",
      context: "1M",
      priceIn: 3,
      priceOut: 15,
      speed: 71,
      ttft: 1.1,
      quality: 91,
      gradient: ["#fde2ef", "#f5a3c7", "#ec4899"],
      stripe: "#e2177a",
      ink: "dark",
      tags: ["code", "tools", "vision"],
    },
    {
      id: "google/gemini-2.5-pro",
      available: false,
      name: "Gemini 2.5 Pro",
      vendor: "Google",
      tier: "flagship",
      context: "1M",
      priceIn: 1.25,
      priceOut: 10,
      speed: 96,
      ttft: 1.4,
      quality: 89,
      gradient: ["#e7e9ff", "#a5b0ff", "#6f7cf7"],
      stripe: "#ffffff",
      ink: "dark",
      tags: ["context", "vision", "pdf"],
    },
    {
      id: "deepseek/deepseek-v3.1",
      available: true,
      name: "DeepSeek V3.1",
      vendor: "DeepSeek",
      tier: "general",
      context: "160K",
      priceIn: 0.27,
      priceOut: 1.0,
      speed: 58,
      ttft: 1.6,
      quality: 84,
      gradient: ["#dff8ff", "#8fe3f4", "#3b9ef2"],
      stripe: "#3b82f6",
      ink: "dark",
      tags: ["reasoning", "code"],
    },
    {
      id: "qwen/qwen3-coder",
      available: true,
      name: "Qwen3 Coder",
      vendor: "Alibaba",
      tier: "fast",
      context: "256K",
      priceIn: 0.32,
      priceOut: 1.05,
      speed: 140,
      ttft: 0.6,
      quality: 81,
      gradient: ["#f2f2f2", "#c9cbd0", "#8b8f98"],
      stripe: "#1f2023",
      ink: "dark",
      tags: ["code", "tools"],
    },
    {
      id: "openai/gpt-5-mini",
      available: false,
      name: "GPT-5 mini",
      vendor: "OpenAI",
      tier: "budget",
      context: "400K",
      priceIn: 0.25,
      priceOut: 2,
      speed: 160,
      ttft: 0.5,
      quality: 80,
      gradient: ["#fbffd9", "#eaff6b", "#d4e800"],
      stripe: "#f5ff00",
      ink: "dark",
      tags: ["fast", "tools"],
    },
    {
      id: "anthropic/claude-haiku-4.5",
      available: false,
      name: "Claude Haiku 4.5",
      vendor: "Anthropic",
      tier: "fast",
      context: "200K",
      priceIn: 1,
      priceOut: 5,
      speed: 150,
      ttft: 0.5,
      quality: 82,
      gradient: ["#fff0e0", "#ffc48a", "#ff8a3d"],
      stripe: "#ff6a00",
      ink: "dark",
      tags: ["fast", "code"],
    },
    {
      id: "google/gemini-2.5-flash",
      available: false,
      name: "Gemini 2.5 Flash",
      vendor: "Google",
      tier: "budget",
      context: "1M",
      priceIn: 0.3,
      priceOut: 2.5,
      speed: 190,
      ttft: 0.4,
      quality: 79,
      gradient: ["#ede6ff", "#c3a8ff", "#8b5cf6"],
      stripe: "#6d28d9",
      ink: "dark",
      tags: ["vision", "fast"],
    },
    {
      id: "openai/gpt-oss-120b",
      available: true,
      name: "gpt-oss-120b",
      vendor: "OpenAI",
      tier: "budget",
      context: "128K",
      priceIn: 0.039,
      priceOut: 0.18,
      speed: 180,
      ttft: 0.5,
      quality: 78,
      gradient: ["#e6fff4", "#8ff0c4", "#1baf7a"],
      stripe: "#0f7a55",
      ink: "dark",
      tags: ["reasoning", "tools", "fast"],
    },
    {
      id: "moonshotai/kimi-k2.6",
      available: true,
      name: "Kimi K2.6",
      vendor: "Moonshot AI",
      tier: "general",
      context: "256K",
      priceIn: 0.79,
      priceOut: 3.68,
      speed: 55,
      ttft: 1.2,
      quality: 86,
      gradient: ["#eef0f3", "#b9c0cc", "#4b5563"],
      stripe: "#111827",
      ink: "dark",
      tags: ["code", "tools", "context"],
    },
    {
      id: "meta-llama/llama-3.3-70b",
      available: true,
      name: "Llama 3.3 70B",
      vendor: "Meta",
      tier: "fast",
      context: "128K",
      priceIn: 0.11,
      priceOut: 0.34,
      speed: 120,
      ttft: 0.5,
      quality: 72,
      gradient: ["#e5f0ff", "#93c1ff", "#2a78d6"],
      stripe: "#1d4ed8",
      ink: "dark",
      tags: ["fast", "tools"],
    },
  ] satisfies ModelInput[]
).map(typical);

export type Integration = { name: string; logo: string; gradient: { from: string; via: string; to: string } };

/** Для marquee «С кем мы работаем»: инструменты, с которыми ключ работает из коробки. Логотипы — локальные SVG в public/logos. */
export const INTEGRATIONS: Integration[] = [
  { name: "Cursor", logo: "/logos/cursor.svg", gradient: { from: "#8AA7FF", via: "#5F86FF", to: "#3A5ACC" } },
  { name: "Cline", logo: "/logos/cline.svg", gradient: { from: "#67F0D1", via: "#2AE5B9", to: "#1B8F72" } },
  { name: "LangChain", logo: "/logos/langchain.svg", gradient: { from: "#C4C2FF", via: "#9896FF", to: "#5B4DCC" } },
  { name: "n8n", logo: "/logos/n8n.svg", gradient: { from: "#FF66A1", via: "#FF007A", to: "#B3005A" } },
  { name: "Ollama", logo: "/logos/ollama.svg", gradient: { from: "#D9FF5A", via: "#AFFF01", to: "#7A9900" } },
  { name: "JetBrains AI", logo: "/logos/jetbrains.svg", gradient: { from: "#FFE766", via: "#FFCE00", to: "#B38F00" } },
  { name: "Zed", logo: "/logos/zed.svg", gradient: { from: "#668CFF", via: "#0049FF", to: "#003199" } },
  { name: "Obsidian", logo: "/logos/obsidian.svg", gradient: { from: "#6690F0", via: "#255BE3", to: "#193B99" } },
];
