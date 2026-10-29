import { Notices } from "@/components/dashboard/notices";
import { CabinetShell } from "@/components/dashboard/shell";
import { loadLocale } from "@/i18n/server";
import { getBalanceMicros, requireUser } from "@/lib/account";
import { listActiveNotices } from "@/lib/notices";

/** Кабинет: вход обязателен; баланс и уведомления поддержки (Terms §17, §19) — на всех вкладках. */
export default async function DashboardLayout({ params, children }: LayoutProps<"/[lang]/dashboard">) {
  const { lang } = await loadLocale(params);
  const user = await requireUser(lang);
  const balance = await getBalanceMicros(user.id);
  const notices = listActiveNotices(user.id).map((n) => ({ id: n.id, title: n.title, body: n.body, createdAt: n.createdAt.getTime() }));
  return (
    <CabinetShell email={user.email} balanceUsd={balance / 1_000_000}>
      <Notices notices={notices} />
      {children}
    </CabinetShell>
  );
}
