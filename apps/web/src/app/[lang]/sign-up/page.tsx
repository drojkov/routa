import type { Metadata } from "next";
import { AuthPage } from "@/components/site/auth-page";
import { loadLocale } from "@/i18n/server";
import { redirectIfSignedIn } from "@/lib/account";

export async function generateMetadata({ params }: PageProps<"/[lang]/sign-up">): Promise<Metadata> {
  const { dict } = await loadLocale(params);
  return { title: dict.auth.signUpMeta };
}

export default async function SignUpPage({ params, searchParams }: PageProps<"/[lang]/sign-up">) {
  const { lang } = await loadLocale(params);
  const { next } = await searchParams;
  await redirectIfSignedIn(lang, typeof next === "string" ? next : undefined);
  return <AuthPage mode="sign-up" next={typeof next === "string" ? next : undefined} />;
}
