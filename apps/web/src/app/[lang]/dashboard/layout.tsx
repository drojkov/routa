import { CabinetShell } from "@/components/dashboard/shell";
import { loadLocale } from "@/i18n/server";
import { getBalanceMicros, requireUser } from "@/lib/account";

/** Кабинет: вход обязателен; баланс — в шапке на всех вкладках. */
export default async function DashboardLayout({ params, children }: LayoutProps<"/[lang]/dashboard">) {
  const { lang } = await loadLocale(params);
  const user = await requireUser(lang);
  const balance = await getBalanceMicros(user.id);
  return (
    <CabinetShell email={user.email} balanceUsd={balance / 1_000_000}>
      {children}
    </CabinetShell>
  );
}
