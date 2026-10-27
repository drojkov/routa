import type { Metadata } from "next";
import { AuthPage } from "@/components/site/auth-page";
import { loadLocale } from "@/i18n/server";
import { redirectIfSignedIn } from "@/lib/account";

export async function generateMetadata({ params }: PageProps<"/[lang]/sign-in">): Promise<Metadata> {
  const { dict } = await loadLocale(params);
  return { title: dict.auth.signInMeta, robots: { index: false } };
}

export default async function SignInPage({ params, searchParams }: PageProps<"/[lang]/sign-in">) {
  const { lang } = await loadLocale(params);
  const { next } = await searchParams;
  await redirectIfSignedIn(lang, typeof next === "string" ? next : undefined);
  return <AuthPage mode="sign-in" next={typeof next === "string" ? next : undefined} />;
}
