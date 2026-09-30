"use client";

import Link from "next/link";
import { Nav } from "@/components/site/nav";
import { fmtNodes } from "@/i18n/fmt";
import { useI18n } from "@/i18n/provider";

/** Сюда proxy ведёт посетителей из закрытых стран (Terms §2, `lib/geo.ts`) со страниц сервиса. */
export default function Unavailable() {
  const { dict, href } = useI18n();
  const u = dict.unavailable;
  return (
    <>
      <Nav />
      <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-4 py-32 text-center">
        <title>{u.title}</title>
        <meta name="robots" content="noindex" />
        <h1 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">{u.title}</h1>
        <p className="mt-4 text-muted-foreground">{u.text}</p>
        <p className="mt-3 text-sm text-muted-foreground">
          {fmtNodes(u.terms, {
            terms: (
              <Link key="t" href={href("/legal/terms")} className="text-foreground underline underline-offset-2">
                {dict.legalNames.terms}
              </Link>
            ),
          })}
        </p>
        <Link href={href("/models")} className="mt-8 inline-flex h-11 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background">
          {u.models}
        </Link>
      </main>
    </>
  );
}
