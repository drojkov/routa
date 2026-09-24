import type { Metadata } from "next";
import { JetBrains_Mono, Onest } from "next/font/google";
import { BRAND } from "@/lib/site";
import "./globals.css";

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "cyrillic"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: `${BRAND} — один API-ключ ко всем AI-моделям`,
  description:
    "GPT, Claude, Gemini, DeepSeek и Qwen через один OpenAI-совместимый ключ. Оплата в рублях, без VPN.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${onest.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
