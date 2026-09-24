import type { Metadata } from "next";
import { AuthPage, authProviders } from "@/components/site/auth-page";
import { loadLocale } from "@/i18n/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/sign-in">): Promise<Metadata> {
  const { dict } = await loadLocale(params);
  return { title: dict.auth.signInMeta, robots: { index: false } };
}

export default async function SignInPage({ params, searchParams }: PageProps<"/[lang]/sign-in">) {
  await loadLocale(params);
  const { next } = await searchParams;
  return <AuthPage mode="sign-in" providers={authProviders()} next={typeof next === "string" ? next : undefined} />;
}
