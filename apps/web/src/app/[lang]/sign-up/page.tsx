import type { Metadata } from "next";
import { AuthPage, authProviders } from "@/components/site/auth-page";
import { loadLocale } from "@/i18n/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/sign-up">): Promise<Metadata> {
  const { dict } = await loadLocale(params);
  return { title: dict.auth.signUpMeta };
}

export default async function SignUpPage({ params, searchParams }: PageProps<"/[lang]/sign-up">) {
  await loadLocale(params);
  const { next } = await searchParams;
  return <AuthPage mode="sign-up" providers={authProviders()} next={typeof next === "string" ? next : undefined} />;
}
