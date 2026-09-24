/** Рабочее название. Меняется здесь — и везде на сайте. */
export const BRAND = "Routa";
export const API_BASE = "https://api.routa.ru/v1";

export const NAV = [
  { href: "/", label: "Главная" },
  { href: "/models", label: "Модели" },
  { href: "/compare", label: "Сравнение" },
  { href: "/#pricing", label: "Цены" },
  { href: "/#faq", label: "FAQ" },
] as const;

export type Tier = "Флагман" | "Универсальная" | "Быстрая" | "Экономичная";

export type Model = {
  id: string;
  name: string;
  vendor: string;
  tagline: string;
  tier: Tier;
  context: string;
  /** ₽ за 1M входных / выходных токенов */
  priceIn: number;
  priceOut: number;
  /** ≈ ₽ за типичный ответ в чате (1k вход / 500 выход) */
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
  tags: string[];
};

// Демо-данные для макета: цены и метрики условные.
export const MODELS: Model[] = [
  {
    id: "openai/gpt-5",
    name: "GPT-5",
    vendor: "OpenAI",
    tagline: "Сильнейшая универсальная модель: код, анализ, агенты",
    tier: "Флагман",
    context: "400K",
    priceIn: 140,
    priceOut: 1120,
    typical: 0.7,
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
    tagline: "Лучшая модель для вайб-кодинга и длинных задач",
    tier: "Флагман",
    context: "1M",
    priceIn: 330,
    priceOut: 1650,
    typical: 1.2,
    speed: 71,
    ttft: 1.1,
    quality: 91,
    gradient: ["#fde2ef", "#f5a3c7", "#ec4899"],
    stripe: "#e2177a",
    ink: "dark",
    tags: ["код", "tools", "vision"],
  },
  {
    id: "google/gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    vendor: "Google",
    tagline: "Огромный контекст, видео и документы целиком",
    tier: "Флагман",
    context: "1M",
    priceIn: 140,
    priceOut: 1120,
    typical: 0.7,
    speed: 96,
    ttft: 1.4,
    quality: 89,
    gradient: ["#e7e9ff", "#a5b0ff", "#6f7cf7"],
    stripe: "#ffffff",
    ink: "dark",
    tags: ["контекст", "vision", "pdf"],
  },
  {
    id: "deepseek/deepseek-v3.1",
    name: "DeepSeek V3.1",
    vendor: "DeepSeek",
    tagline: "Флагманское качество по цене экономичной модели",
    tier: "Универсальная",
    context: "128K",
    priceIn: 30,
    priceOut: 120,
    typical: 0.09,
    speed: 58,
    ttft: 1.6,
    quality: 84,
    gradient: ["#dff8ff", "#8fe3f4", "#3b9ef2"],
    stripe: "#3b82f6",
    ink: "dark",
    tags: ["reasoning", "код"],
  },
  {
    id: "qwen/qwen3-coder",
    name: "Qwen3 Coder",
    vendor: "Alibaba",
    tagline: "Открытая модель для агентов в IDE",
    tier: "Быстрая",
    context: "256K",
    priceIn: 25,
    priceOut: 110,
    typical: 0.08,
    speed: 140,
    ttft: 0.6,
    quality: 81,
    gradient: ["#f2f2f2", "#c9cbd0", "#8b8f98"],
    stripe: "#1f2023",
    ink: "dark",
    tags: ["код", "tools"],
  },
  {
    id: "openai/gpt-5-mini",
    name: "GPT-5 mini",
    vendor: "OpenAI",
    tagline: "Дёшево и быстро: чат-боты, классификация, RAG",
    tier: "Экономичная",
    context: "400K",
    priceIn: 28,
    priceOut: 224,
    typical: 0.14,
    speed: 160,
    ttft: 0.5,
    quality: 80,
    gradient: ["#fbffd9", "#eaff6b", "#d4e800"],
    stripe: "#f5ff00",
    ink: "dark",
    tags: ["быстро", "tools"],
  },
  {
    id: "anthropic/claude-haiku-4.5",
    name: "Claude Haiku 4.5",
    vendor: "Anthropic",
    tagline: "Быстрый Claude для потоковых задач",
    tier: "Быстрая",
    context: "200K",
    priceIn: 110,
    priceOut: 550,
    typical: 0.39,
    speed: 150,
    ttft: 0.5,
    quality: 82,
    gradient: ["#fff0e0", "#ffc48a", "#ff8a3d"],
    stripe: "#ff6a00",
    ink: "dark",
    tags: ["быстро", "код"],
  },
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    vendor: "Google",
    tagline: "Мультимодальная рабочая лошадка",
    tier: "Экономичная",
    context: "1M",
    priceIn: 34,
    priceOut: 280,
    typical: 0.17,
    speed: 190,
    ttft: 0.4,
    quality: 79,
    gradient: ["#ede6ff", "#c3a8ff", "#8b5cf6"],
    stripe: "#6d28d9",
    ink: "dark",
    tags: ["vision", "быстро"],
  },
];

export type Integration = { name: string; icon: string; gradient: { from: string; via: string; to: string } };

/** Для marquee «С кем мы работаем»: инструменты, с которыми ключ работает из коробки. */
export const INTEGRATIONS: Integration[] = [
  { name: "Cursor", icon: "cursor", gradient: { from: "#8AA7FF", via: "#5F86FF", to: "#3A5ACC" } },
  { name: "Cline", icon: "cline", gradient: { from: "#67F0D1", via: "#2AE5B9", to: "#1B8F72" } },
  { name: "LangChain", icon: "langchain", gradient: { from: "#C4C2FF", via: "#9896FF", to: "#5B4DCC" } },
  { name: "n8n", icon: "n8n", gradient: { from: "#FF66A1", via: "#FF007A", to: "#B3005A" } },
  { name: "Ollama", icon: "ollama", gradient: { from: "#D9FF5A", via: "#AFFF01", to: "#7A9900" } },
  { name: "JetBrains AI", icon: "jetbrains", gradient: { from: "#FFE766", via: "#FFCE00", to: "#B38F00" } },
  { name: "Zed", icon: "zedindustries", gradient: { from: "#668CFF", via: "#0049FF", to: "#003199" } },
  { name: "Obsidian", icon: "obsidian", gradient: { from: "#6690F0", via: "#255BE3", to: "#193B99" } },
];

export function rub(n: number) {
  return n.toLocaleString("ru-RU", { maximumFractionDigits: 2 }) + " ₽";
}
