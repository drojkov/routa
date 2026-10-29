"use client";

import { useI18n } from "@/i18n/provider";
import { TOPUP_PRESETS_USD } from "@/lib/billing";
import { cn } from "@/lib/utils";

/** Поле суммы пополнения в USD (любая сумма до цента) + быстрые кнопки. Значение — строка, проверка — parseTopUpUsd. */
export function TopUpAmount({
  value,
  onChange,
  label,
  presetsLabel,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  presetsLabel?: string;
  invalid?: boolean;
}) {
  const { money, currency } = useI18n();
  const usd = Number(value.replace(",", "."));
  return (
    <div>
      <label className="block">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span
          className={cn(
            "mt-1 flex items-baseline gap-1 rounded-xl border px-3 py-1.5 transition focus-within:border-foreground",
            invalid ? "border-red-400" : "border-border",
          )}
        >
          <span className="text-2xl font-semibold text-muted-foreground">$</span>
          <input
            inputMode="decimal"
            autoComplete="off"
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ""))}
            aria-invalid={invalid || undefined}
            className="w-full min-w-0 bg-transparent text-4xl font-semibold tracking-tight tabular-nums outline-none"
          />
        </span>
      </label>
      {currency !== "USD" && Number.isFinite(usd) && usd > 0 && <p className="mt-1 text-xs text-muted-foreground">≈ {money(usd)}</p>}
      <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label={presetsLabel}>
        {TOPUP_PRESETS_USD.map((v) => (
          <button
            type="button"
            key={v}
            onClick={() => onChange(String(v))}
            aria-pressed={usd === v}
            className={cn(
              "rounded-xl border py-2 text-sm font-medium transition",
              usd === v ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/30",
            )}
          >
            ${v}
          </button>
        ))}
      </div>
    </div>
  );
}
