import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ModelDetail } from "@/components/site/model-detail";
import { Nav } from "@/components/site/nav";
import { CtaFooter } from "@/components/site/sections";
import { loadLocale } from "@/i18n/server";
import { apiBase } from "@/lib/api-base";
import { BRAND, MODELS } from "@/lib/site";

const find = async (params: PageProps<"/[lang]/models/[vendor]/[slug]">["params"]) => {
  const { vendor, slug } = await params;
  return MODELS.find((m) => m.id === `${vendor}/${slug}`);
};

export async function generateMetadata({ params }: PageProps<"/[lang]/models/[vendor]/[slug]">): Promise<Metadata> {
  const { dict } = await loadLocale(params);
  const m = await find(params);
  if (!m) return {};
  return { title: `${m.name} — ${BRAND}`, description: `${m.id}: ${dict.taglines[m.id] ?? ""}` };
}

export default async function ModelPage({ params }: PageProps<"/[lang]/models/[vendor]/[slug]">) {
  await loadLocale(params);
  const m = await find(params);
  if (!m) notFound();
  return (
    <>
      <Nav />
      <main className="-mt-16">
        <ModelDetail model={m} baseUrl={await apiBase()} />
      </main>
      <CtaFooter />
    </>
  );
}
