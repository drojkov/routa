import type { Metadata } from "next";
import { Compare } from "@/components/site/compare";
import { Nav } from "@/components/site/nav";
import { Eyebrow } from "@/components/site/reveal";
import { CtaFooter } from "@/components/site/sections";

export const metadata: Metadata = { title: "Сравнение моделей" };

export default function ComparePage() {
  return (
    <>
      <Nav />
      <main className="relative -mt-16 overflow-hidden pt-32">
        <div className="bg-dots mask-radial absolute inset-x-0 top-0 -z-10 h-[520px] opacity-60" />
        <div className="absolute top-10 left-1/2 -z-10 size-[460px] -translate-x-1/2 rounded-full bg-[var(--glow-violet)] opacity-25 blur-[120px]" />
        <div className="mx-auto max-w-3xl px-4 pb-12 text-center">
          <Eyebrow>Аналитика</Eyebrow>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-balance md:text-6xl">Какая модель лучше для вашей задачи</h1>
          <p className="mt-4 text-muted-foreground">
            Цена, скорость и качество на реальном трафике за 14 дней. Обновляется каждый час.
          </p>
        </div>
        <Compare />
      </main>
      <CtaFooter />
    </>
  );
}
