import fs from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Nav } from "@/components/site/nav";
import { CtaFooter } from "@/components/site/sections";
import { localePath } from "@/i18n/config";
import { loadLocale } from "@/i18n/server";
import { apiBase } from "@/lib/api-base";
import { BRAND } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[lang]/docs">): Promise<Metadata> {
  const { dict } = await loadLocale(params);
  return { title: `${dict.cab.docs.title} — ${BRAND}` };
}

/** Документация: markdown из src/content/docs/en.md (на всех языках — английская версия). */
async function readDocs(baseUrl: string) {
  const file = "en";
  const raw = await fs.readFile(path.join(process.cwd(), "src", "content", "docs", `${file}.md`), "utf8");
  return { file, text: raw.replaceAll("{{brand}}", BRAND).replaceAll("{{baseUrl}}", baseUrl) };
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");

const textOf = (children: React.ReactNode): string =>
  typeof children === "string" ? children : Array.isArray(children) ? children.map(textOf).join("") : "";

export default async function DocsPage({ params }: PageProps<"/[lang]/docs">) {
  const { lang, dict } = await loadLocale(params);
  const { file, text } = await readDocs(await apiBase());
  const toc = [...text.matchAll(/^## (.+)$/gm)].map((m) => m[1]);

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
    h1: ({ children }) => <h1 className="text-4xl font-semibold tracking-tight">{children}</h1>,
    h2: ({ children }) => (
      <h2 id={slug(textOf(children))} className="mt-12 scroll-mt-24 text-2xl font-semibold tracking-tight">
        {children}
      </h2>
    ),
    h3: ({ children }) => <h3 className="mt-6 font-semibold">{children}</h3>,
    p: ({ children }) => <p className="mt-3 leading-relaxed text-foreground/85">{children}</p>,
    ul: ({ children }) => <ul className="mt-3 list-disc space-y-1.5 pl-5 text-foreground/85 marker:text-muted-foreground">{children}</ul>,
    ol: ({ children }) => <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-foreground/85 marker:text-muted-foreground">{children}</ol>,
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    pre: ({ children }) => (
      <pre className="mt-4 overflow-x-auto rounded-2xl bg-[#111] p-4 font-mono text-[12.5px] leading-relaxed text-white/90">{children}</pre>
    ),
    code: ({ className, children }) =>
      className ? <code className={className}>{children}</code> : <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.88em]">{children}</code>,
    table: ({ children }) => (
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full border-collapse text-left text-sm">{children}</table>
      </div>
    ),
    th: ({ children }) => <th className="border-b border-border bg-muted/60 px-3 py-2 font-medium">{children}</th>,
    td: ({ children }) => <td className="border-b border-border px-3 py-2 align-top text-foreground/85">{children}</td>,
  };

  return (
    <>
      <Nav />
      <main className="mx-auto grid w-full max-w-6xl gap-10 px-4 pt-16 pb-24 lg:grid-cols-[200px_1fr]">
        <aside className="hidden lg:block">
          <nav className="sticky top-28 text-sm">
            <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">{dict.cab.docs.onThisPage}</p>
            <ul className="space-y-1.5">
              {toc.map((h) => (
                <li key={h}>
                  <a href={`#${slug(h)}`} className="text-muted-foreground hover:text-foreground">
                    {h}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <article lang={file} className="max-w-3xl">
          {lang !== file && <p className="mb-6 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">{dict.cab.docs.englishNote}</p>}
          <Markdown remarkPlugins={[remarkGfm]} components={components}>
            {text}
          </Markdown>
        </article>
      </main>
      <CtaFooter />
    </>
  );
}
