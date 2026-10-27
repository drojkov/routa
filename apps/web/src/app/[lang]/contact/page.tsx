import type { Metadata } from "next";
import { ContactForm } from "@/components/site/contact-form";
import { Nav } from "@/components/site/nav";
import { CtaFooter } from "@/components/site/sections";
import { fmt } from "@/i18n/fmt";
import { loadLocale } from "@/i18n/server";
import { COMPANY, SUPPORT_RESPONSE_DAYS } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[lang]/contact">): Promise<Metadata> {
  const { dict } = await loadLocale(params);
  return { title: dict.contact.metaTitle, description: dict.contact.sub };
}

/** Контакты и реквизиты продавца + форма обратной связи (требование эквайера: Contact Us). */
export default async function ContactPage({ params }: PageProps<"/[lang]/contact">) {
  const { dict } = await loadLocale(params);
  const c = dict.contact;
  const rows: [string, React.ReactNode][] = [
    [c.legalName, COMPANY.legalName],
    [c.regNo, COMPANY.crNumber],
    [c.jurisdiction, COMPANY.jurisdiction],
    [c.address, COMPANY.address],
    [
      c.emailUs,
      <a key="e" href={`mailto:${COMPANY.email}`} className="underline underline-offset-2">
        {COMPANY.email}
      </a>,
    ],
  ];
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-5xl px-4 pt-28 pb-20">
        <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">{c.title}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{c.sub}</p>
        <div className="mt-10 grid gap-6 md:grid-cols-5">
          <div className="shadow-soft rounded-3xl border border-border bg-card p-6 md:col-span-3 md:p-8">
            <ContactForm />
          </div>
          <aside className="space-y-4 md:col-span-2">
            <div className="rounded-3xl border border-border bg-card p-6">
              <h2 className="font-semibold">{c.companyTitle}</h2>
              <dl className="mt-4 space-y-3 text-sm">
                {rows.map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="mt-0.5">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-xs text-muted-foreground">{fmt(dict.merchant.response, { days: SUPPORT_RESPONSE_DAYS })}</p>
            </div>
            <p className="rounded-2xl bg-muted px-4 py-3 text-xs text-muted-foreground">{c.refundsHint}</p>
          </aside>
        </div>
      </main>
      <CtaFooter />
    </>
  );
}
