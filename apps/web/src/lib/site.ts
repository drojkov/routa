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

/** Ответ поддержки — в течение 2 рабочих дней (страница /contact). */
export const SUPPORT_RESPONSE_DAYS = 2;
export const CONTACT_TOPICS = ["general", "billing", "refund", "technical", "abuse"] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

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
  /** Лицензия открытых весов — показывается на странице модели. */
  license: string;
  /**
   * Продаётся ли модель сейчас. false — в каталоге с плашкой «временно недоступна», шлюз отвечает 503.
   * Откуда шлюз берёт модель — `lib/gateway/routes.ts`.
   */
  available: boolean;
};

type ModelInput = Omit<Model, "typical">;
const typical = (m: ModelInput): Model => ({ ...m, typical: (1000 * m.priceIn + 500 * m.priceOut) / 1_000_000 });

/**
 * Каталог — только модели с открытыми весами (решение 2026-10-27: GPT, Claude и Gemini убраны с сайта,
 * иначе эквайер требует договоры реселлера с OpenAI/Anthropic/Google). Лицензия — по карточке модели
 * на Hugging Face (сверено 2026-10-27).
 * Цена продажи = закупка у хостера × 1.05, округлено вверх (до 2 значащих цифр ниже $1, до цента выше) —
 * закупка и сверка в `lib/gateway/routes.ts`. Скорость и качество условные до сбора реальных метрик.
 */
export const MODELS: Model[] = (
  [
    {
      id: "moonshotai/kimi-k2.6",
      available: true,
      name: "Kimi K2.6",
      vendor: "Moonshot AI",
      license: "Modified MIT",
      tier: "flagship",
      context: "256K",
      priceIn: 0.79,
      priceOut: 3.68,
      speed: 55,
      ttft: 1.2,
      quality: 86,
      gradient: ["#eef0f3", "#b9c0cc", "#4b5563"],
      stripe: "#111827",
      ink: "dark",
      tags: ["code", "tools", "vision", "context"],
    },
    {
      id: "z-ai/glm-4.7",
      available: true,
      name: "GLM-4.7",
      vendor: "Z.ai",
      license: "MIT",
      tier: "flagship",
      context: "200K",
      priceIn: 0.42,
      priceOut: 1.84,
      speed: 60,
      ttft: 1.1,
      quality: 85,
      gradient: ["#e9fbd5", "#9be15d", "#3ccf4e"],
      stripe: "#35c23f",
      ink: "dark",
      tags: ["reasoning", "code", "tools"],
    },
    {
      id: "deepseek/deepseek-r1-0528",
      available: true,
      name: "DeepSeek R1",
      vendor: "DeepSeek",
      license: "MIT",
      tier: "flagship",
      context: "160K",
      priceIn: 0.53,
      priceOut: 2.26,
      speed: 45,
      ttft: 2.4,
      quality: 85,
      gradient: ["#e7e9ff", "#a5b0ff", "#6f7cf7"],
      stripe: "#ffffff",
      ink: "dark",
      tags: ["reasoning", "code"],
    },
    {
      id: "deepseek/deepseek-v3.1",
      available: true,
      name: "DeepSeek V3.1",
      vendor: "DeepSeek",
      license: "MIT",
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
      id: "deepseek/deepseek-v3.2",
      available: true,
      name: "DeepSeek V3.2",
      vendor: "DeepSeek",
      license: "MIT",
      tier: "general",
      context: "160K",
      priceIn: 0.28,
      priceOut: 0.4,
      speed: 62,
      ttft: 1.4,
      quality: 84,
      gradient: ["#fde2ef", "#f5a3c7", "#ec4899"],
      stripe: "#e2177a",
      ink: "dark",
      tags: ["reasoning", "code", "context"],
    },
    {
      id: "qwen/qwen3-235b-a22b-2507",
      available: true,
      name: "Qwen3 235B",
      vendor: "Alibaba",
      license: "Apache 2.0",
      tier: "general",
      context: "256K",
      priceIn: 0.095,
      priceOut: 0.58,
      speed: 75,
      ttft: 0.9,
      quality: 82,
      gradient: ["#ede6ff", "#c3a8ff", "#8b5cf6"],
      stripe: "#6d28d9",
      ink: "dark",
      tags: ["tools", "context"],
    },
    {
      id: "qwen/qwen3-coder",
      available: true,
      name: "Qwen3 Coder",
      vendor: "Alibaba",
      license: "Apache 2.0",
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
      id: "meta-llama/llama-4-scout",
      available: true,
      name: "Llama 4 Scout",
      vendor: "Meta",
      license: "Llama 4 Community License",
      tier: "fast",
      context: "320K",
      priceIn: 0.11,
      priceOut: 0.32,
      speed: 150,
      ttft: 0.5,
      quality: 74,
      gradient: ["#fff0e0", "#ffc48a", "#ff8a3d"],
      stripe: "#ff6a00",
      ink: "dark",
      tags: ["vision", "fast", "context"],
    },
    {
      id: "meta-llama/llama-3.3-70b",
      available: true,
      name: "Llama 3.3 70B",
      vendor: "Meta",
      license: "Llama 3.3 Community License",
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
    {
      id: "mistralai/mistral-small-3.2",
      available: true,
      name: "Mistral Small 3.2",
      vendor: "Mistral AI",
      license: "Apache 2.0",
      tier: "fast",
      context: "128K",
      priceIn: 0.079,
      priceOut: 0.21,
      speed: 130,
      ttft: 0.4,
      quality: 70,
      gradient: ["#fbffd9", "#eaff6b", "#d4e800"],
      stripe: "#f5ff00",
      ink: "dark",
      tags: ["vision", "tools", "fast"],
    },
    {
      id: "openai/gpt-oss-120b",
      available: true,
      name: "gpt-oss-120b",
      vendor: "OpenAI",
      license: "Apache 2.0",
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
      id: "microsoft/phi-4",
      available: true,
      name: "Phi-4",
      vendor: "Microsoft",
      license: "MIT",
      tier: "budget",
      context: "16K",
      priceIn: 0.074,
      priceOut: 0.15,
      speed: 110,
      ttft: 0.4,
      quality: 66,
      gradient: ["#f4f0ff", "#d9ccff", "#a78bfa"],
      stripe: "#7c3aed",
      ink: "dark",
      tags: ["reasoning", "fast"],
    },
    {
      id: "meta-llama/llama-3.1-8b",
      available: true,
      name: "Llama 3.1 8B",
      vendor: "Meta",
      license: "Llama 3.1 Community License",
      tier: "budget",
      context: "128K",
      priceIn: 0.021,
      priceOut: 0.042,
      speed: 220,
      ttft: 0.3,
      quality: 58,
      gradient: ["#f0fdfa", "#99f6e4", "#14b8a6"],
      stripe: "#0f766e",
      ink: "dark",
      tags: ["fast"],
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
