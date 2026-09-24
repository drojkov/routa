"use client";

import Link from "next/link";
import { Nav } from "@/components/site/nav";
import { useI18n } from "@/i18n/provider";

export default function NotFound() {
  const { dict, href } = useI18n();
  return (
    <>
      <Nav />
      <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-4 py-32 text-center">
        <p className="font-mono text-sm text-muted-foreground">404</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">{dict.notFound.title}</h1>
        <p className="mt-3 text-muted-foreground">{dict.notFound.text}</p>
        <Link href={href("/")} className="mt-8 inline-flex h-11 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background">
          {dict.notFound.home}
        </Link>
      </main>
    </>
  );
}
