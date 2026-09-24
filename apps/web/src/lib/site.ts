/** Рабочее название. Меняется здесь — и везде на сайте. */
export const BRAND = "Routa";
/** Домен — заглушка до регистрации. */
export const API_BASE = "https://api.routa.ai/v1";
export const API_HOST = "https://api.routa.ai";

/**
 * Реквизиты компании (Гонконг). Подставляются в футер и юридические документы.
 * До запуска заполнить реальными данными из Business Registration / Certificate of Incorporation.
 */
export const COMPANY = {
  legalName: "[COMPANY NAME] Limited",
  jurisdiction: "Hong Kong SAR",
  crNumber: "[CR NUMBER]",
  brNumber: "[BR NUMBER]",
  address: "[REGISTERED OFFICE ADDRESS], Hong Kong",
  director: "[DIRECTOR NAME]",
  email: "support@routa.ai",
  privacyEmail: "privacy@routa.ai",
  legalEmail: "legal@routa.ai",
  euRep: "[EU REPRESENTATIVE NAME AND ADDRESS]",
  ukRep: "[UK REPRESENTATIVE NAME AND ADDRESS]",
};

/** Дата вступления юридических документов в силу. Ставится при публикации. */
export const LEGAL_EFFECTIVE_DATE = "[EFFECTIVE DATE]";

export const LEGAL_DOCS = [
  "terms",
  "privacy",
  "cookies",
  "refunds",
  "acceptable-use",
  "subprocessors",
  "accessibility",
  "notice",
  "consent-ru",
] as const;
export type LegalDoc = (typeof LEGAL_DOCS)[number];

export const NAV = [
  { href: "/", key: "home" },
  { href: "/models", key: "models" },
  { href: "/compare", key: "compare" },
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
};

type ModelInput = Omit<Model, "typical">;
const typical = (m: ModelInput): Model => ({ ...m, typical: (1000 * m.priceIn + 500 * m.priceOut) / 1_000_000 });

// Цены — ориентир по прайсам вендоров; скорость и качество условные до сбора реальных метрик.
export const MODELS: Model[] = (
  [
    {
      id: "openai/gpt-5",
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
      name: "DeepSeek V3.1",
      vendor: "DeepSeek",
      tier: "general",
      context: "128K",
      priceIn: 0.27,
      priceOut: 1.1,
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
      name: "Qwen3 Coder",
      vendor: "Alibaba",
      tier: "fast",
      context: "256K",
      priceIn: 0.23,
      priceOut: 1,
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
