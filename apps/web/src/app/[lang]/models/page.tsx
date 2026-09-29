import type { Metadata } from "next";
import { Catalog, CatalogHeading } from "@/components/site/catalog";
import { ModelFan } from "@/components/site/model-fan";
import { Nav } from "@/components/site/nav";
import { CtaFooter } from "@/components/site/sections";
import { loadLocale } from "@/i18n/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/models">): Promise<Metadata> {
  const { dict } = await loadLocale(params);
  return { title: dict.modelsPage.metaTitle };
}

export default async function ModelsPage({ params }: PageProps<"/[lang]/models">) {
  const { dict } = await loadLocale(params);
  return (
    <>
      <Nav />
      <main className="-mt-16">
        <ModelFan title={dict.modelsPage.fanTitle} allHref="#catalog" />
        <CatalogHeading />
        <Catalog />
      </main>
      <CtaFooter />
    </>
  );
}
