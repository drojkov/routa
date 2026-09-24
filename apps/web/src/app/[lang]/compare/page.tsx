import type { Metadata } from "next";
import { Compare } from "@/components/site/compare";
import { Nav } from "@/components/site/nav";
import { Eyebrow } from "@/components/site/reveal";
import { CtaFooter } from "@/components/site/sections";
import { loadLocale } from "@/i18n/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/compare">): Promise<Metadata> {
  const { dict } = await loadLocale(params);
  return { title: dict.compare.metaTitle };
}

export default async function ComparePage({ params }: PageProps<"/[lang]/compare">) {
  const { dict } = await loadLocale(params);
  const t = dict.compare;
  return (
    <>
      <Nav />
      <main className="relative -mt-16 overflow-hidden pt-32">
        <div className="bg-dots mask-radial absolute inset-x-0 top-0 -z-10 h-[520px] opacity-60" />
        <div className="absolute top-10 left-1/2 -z-10 size-[460px] -translate-x-1/2 rounded-full bg-[var(--glow-violet)] opacity-25 blur-[120px]" />
        <div className="mx-auto max-w-3xl px-4 pb-12 text-center">
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-balance md:text-6xl">{t.title}</h1>
          <p className="mt-4 text-muted-foreground">{t.sub}</p>
        </div>
        <Compare />
      </main>
      <CtaFooter />
    </>
  );
}
