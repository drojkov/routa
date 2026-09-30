import type { Metadata } from "next";
import { Settings } from "@/components/dashboard/settings";
import { loadLocale } from "@/i18n/server";
import { requireUser } from "@/lib/account";
import { CONTENT_RETENTION_DAYS, logContentEnabled } from "@/lib/request-content";

export async function generateMetadata({ params }: PageProps<"/[lang]/dashboard/settings">): Promise<Metadata> {
  const { dict } = await loadLocale(params);
  return { title: dict.cab.settings.title, robots: { index: false } };
}

export default async function SettingsPage({ params }: PageProps<"/[lang]/dashboard/settings">) {
  const { lang } = await loadLocale(params);
  const user = await requireUser(lang);
  const logContent = await logContentEnabled(user.id);
  return <Settings user={{ name: user.name, email: user.email }} logging={{ enabled: logContent, retentionDays: CONTENT_RETENTION_DAYS }} />;
}
