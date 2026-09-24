import fs from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Nav } from "@/components/site/nav";
import { CtaFooter } from "@/components/site/sections";
import { localePath } from "@/i18n/config";
import { loadLocale } from "@/i18n/server";
import { BRAND, COMPANY, LEGAL_DOCS, LEGAL_EFFECTIVE_DATE, type LegalDoc } from "@/lib/site";

const isDoc = (v: string): v is LegalDoc => (LEGAL_DOCS as readonly string[]).includes(v);

export function generateStaticParams() {
  return LEGAL_DOCS.map((doc) => ({ doc }));
}

/** Текст документа с подставленными реквизитами ({{company.legalName}}, {{brand}}, {{date}}). */
async function readDoc(doc: LegalDoc) {
  const raw = await fs.readFile(path.join(process.cwd(), "src", "content", "legal", `${doc}.md`), "utf8");
  const vars: Record<string, string> = { brand: BRAND, date: LEGAL_EFFECTIVE_DATE };
  for (const [k, v] of Object.entries(COMPANY)) vars[`company.${k}`] = v;
  return raw.replace(/\{\{([\w.]+)\}\}/g, (m, k: string) => vars[k] ?? m);
}

export async function generateMetadata({ params }: PageProps<"/[lang]/legal/[doc]">): Promise<Metadata> {
  const { doc } = await params;
  const { dict } = await loadLocale(params);
  return isDoc(doc) ? { title: dict.legalNames[doc] } : {};
}

export default async function LegalPage({ params }: PageProps<"/[lang]/legal/[doc]">) {
  const { doc } = await params;
  const { lang, dict } = await loadLocale(params);
  if (!isDoc(doc)) notFound();
  const text = await readDoc(doc);
  const showNote = lang !== "en" && doc !== "consent-ru";

  // Внутренние ссылки документов (/legal/privacy) ведём на ту же языковую версию сайта.
  const components: Components = {
    a: ({ href = "", children }) =>
      href.startsWith("/") ? (
        <Link href={localePath(lang, href)} className="text-brand-strong underline underline-offset-2">
          {children}
        </Link>
      ) : (
        <a href={href} target="_blank" rel="noreferrer" className="text-brand-strong underline underline-offset-2">
          {children}
        </a>
      ),
    h1: ({ children }) => <h1 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">{children}</h1>,
    h2: ({ children }) => <h2 className="mt-10 scroll-mt-24 text-xl font-semibold tracking-tight">{children}</h2>,
    h3: ({ children }) => <h3 className="mt-6 font-semibold">{children}</h3>,
    p: ({ children }) => <p className="mt-3 leading-relaxed text-foreground/85">{children}</p>,
    ul: ({ children }) => <ul className="mt-3 list-disc space-y-1.5 pl-5 text-foreground/85 marker:text-muted-foreground">{children}</ul>,
    ol: ({ children }) => <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-foreground/85 marker:text-muted-foreground">{children}</ol>,
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="mt-4 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-1 text-sm text-amber-900 [&_p]:text-amber-900">
        {children}
      </blockquote>
    ),
    table: ({ children }) => (
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[520px] text-left text-sm">{children}</table>
      </div>
    ),
    th: ({ children }) => <th className="border-b border-border bg-muted/60 px-3 py-2 font-medium">{children}</th>,
    td: ({ children }) => <td className="border-b border-border px-3 py-2 align-top text-foreground/85">{children}</td>,
    code: ({ children }) => <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]">{children}</code>,
    hr: () => <hr className="my-8 border-border" />,
  };

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-3xl px-4 pt-16 pb-24">
        <nav aria-label={dict.legal.allDocs} className="mb-8 flex flex-wrap gap-1.5">
          {LEGAL_DOCS.filter((d) => d !== "consent-ru" || lang === "ru").map((d) => (
            <Link
              key={d}
              href={localePath(lang, `/legal/${d}`)}
              aria-current={d === doc ? "page" : undefined}
              className={
                d === doc
                  ? "rounded-full bg-foreground px-3 py-1 text-xs text-background"
                  : "rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
              }
            >
              {dict.legalNames[d]}
            </Link>
          ))}
        </nav>
        {showNote && <p className="mb-6 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">{dict.legal.englishNote}</p>}
        <article lang={doc === "consent-ru" ? "ru" : "en"}>
          <Markdown remarkPlugins={[remarkGfm]} components={components}>
            {text}
          </Markdown>
        </article>
      </main>
      <CtaFooter />
    </>
  );
}
