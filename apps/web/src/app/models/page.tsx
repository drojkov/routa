import type { Metadata } from "next";
import { Catalog } from "@/components/site/catalog";
import { ModelFan } from "@/components/site/model-fan";
import { Nav } from "@/components/site/nav";
import { CtaFooter } from "@/components/site/sections";

export const metadata: Metadata = { title: "Модели и цены" };

export default function ModelsPage() {
  return (
    <>
      <Nav />
      <main className="-mt-16">
        <ModelFan title="Восемь моделей. Каждая — лучшая в своём." />
        <div className="mx-auto max-w-6xl px-4 pb-8">
          <h2 className="text-3xl font-semibold tracking-tight">Каталог</h2>
          <p className="mt-1 text-muted-foreground">Цены в рублях с НДС. ID копируется в один клик.</p>
        </div>
        <Catalog />
      </main>
      <CtaFooter />
    </>
  );
}
