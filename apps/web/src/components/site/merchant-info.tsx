"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/provider";
import { COMPANY, SUPPORT_RESPONSE_DAYS } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Реквизиты продавца: название, номер, адрес, почта поддержки и ссылка на форму связи.
 * Правила карточных схем требуют показывать их на всех страницах на пути к оплате и на самой оплате.
 */
export function MerchantInfo({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { dict, href, t } = useI18n();
  const m = dict.merchant;
  const mail = (
    <a href={`mailto:${COMPANY.email}`} className="underline underline-offset-2 hover:text-foreground">
      {COMPANY.email}
    </a>
  );
  const contact = (
    <Link href={href("/contact")} className="underline underline-offset-2 hover:text-foreground">
      {m.contact}
    </Link>
  );

  if (compact) {
    return (
      <p className={cn("text-[11px] leading-relaxed text-muted-foreground", className)}>
        {m.title}: {COMPANY.legalName} ({t(m.regNo, { n: COMPANY.crNumber })}), {COMPANY.address}. {m.support}: {mail} · {contact}
      </p>
    );
  }

  return (
    <div className={cn("text-xs leading-relaxed text-muted-foreground", className)}>
      <p className="font-medium text-foreground">{m.title}</p>
      <p className="mt-1">
        {COMPANY.legalName} · {t(m.regNo, { n: COMPANY.crNumber })} · {COMPANY.jurisdiction}
      </p>
      <p>{COMPANY.address}</p>
      <p className="mt-1">
        {m.support}: {mail} · {contact}
      </p>
      <p>{t(m.response, { days: SUPPORT_RESPONSE_DAYS })}</p>
    </div>
  );
}
