import type { Metadata } from "next";
import { Chat } from "@/components/dashboard/chat";
import { loadLocale } from "@/i18n/server";
import { apiBase } from "@/lib/api-base";

export async function generateMetadata({ params }: PageProps<"/[lang]/dashboard/chat">): Promise<Metadata> {
  const { dict } = await loadLocale(params);
  return { title: dict.cab.chat.title, robots: { index: false } };
}

export default async function ChatPage({ searchParams }: PageProps<"/[lang]/dashboard/chat">) {
  const { model } = await searchParams;
  return <Chat initialModel={typeof model === "string" ? model : undefined} baseUrl={await apiBase()} />;
}
