"use client";

import { useI18n } from "@/i18n/provider";
import type { Model } from "@/lib/site";
import { cn } from "@/lib/utils";

const VENDOR_ICON: Record<string, string | null> = {
  DeepSeek: "deepseek",
  Alibaba: "qwen",
  "Moonshot AI": "moonshot",
  Meta: "meta",
  "Mistral AI": "mistral",
};

/** Карточка модели в стиле «платёжной карты» (реф. 4). */
export function ModelCard({ model, className }: { model: Model; className?: string }) {
  const { dict, money } = useI18n();
  const [a, b, c] = model.gradient;
  const icon = VENDOR_ICON[model.vendor];
  const darkStripe = ["#1f2023", "#6d28d9", "#e2177a", "#3b82f6", "#35c23f", "#ff6a00"].includes(model.stripe);
  return (
    <article
      className={cn(
        "relative flex h-[340px] w-[230px] flex-col overflow-hidden rounded-[22px] border border-white/70 text-left select-none",
        className,
      )}
      style={{
        background: `radial-gradient(120% 80% at 20% 0%, ${a} 0%, transparent 60%), linear-gradient(160deg, ${a} 0%, ${b} 45%, ${c} 100%)`,
        boxShadow: `0 30px 60px -20px ${c}99, 0 2px 0 rgb(255 255 255 / .7) inset`,
      }}
    >
      {/* стеклянный блик */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgb(255_255_255/.55)_0%,transparent_35%,transparent_65%,rgb(255_255_255/.25)_100%)]" />

      <header className="relative flex items-start justify-between p-5">
        <div className="flex items-center gap-1.5">
          {icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/logos/${icon}.svg`} alt="" className="size-4 brightness-0" />
          ) : (
            <span className="grid size-4 place-items-center rounded-full bg-black text-[8px] font-bold text-white">AI</span>
          )}
          <span className="text-[13px] font-bold tracking-tight text-black/80 italic">{model.vendor}</span>
        </div>
        {/* «чип» */}
        <div className="grid h-6 w-8 grid-cols-3 gap-px overflow-hidden rounded-[5px] border border-black/20 bg-gradient-to-br from-white/80 to-black/10 p-[3px]">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="rounded-[1px] bg-black/15" />
          ))}
        </div>
      </header>

      {!model.available && (
        <p className="relative mx-5 w-fit rounded-full bg-black/75 px-2.5 py-1 text-[10px] font-medium text-white">{dict.card.soon}</p>
      )}

      <div className="relative mt-auto px-5 pb-4">
        <p className="text-[10px] font-medium tracking-wide text-black/50 uppercase">{dict.card.modelId}</p>
        <p className="font-mono text-[13px] leading-snug font-medium break-all text-black/85">{model.id}</p>
        <p className="mt-3 text-[22px] leading-none font-semibold tracking-tight text-black">{model.name}</p>
      </div>

      <footer
        className={cn(
          "relative grid grid-cols-2 gap-2 px-5 py-3.5",
          darkStripe ? "text-white" : "text-black",
        )}
        style={{ background: model.stripe }}
      >
        <div>
          <p className="text-[9px] tracking-wide uppercase opacity-70">{dict.card.in1m}</p>
          <p className="text-sm font-semibold">{money(model.priceIn)}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] tracking-wide uppercase opacity-70">{dict.card.context}</p>
          <p className="text-sm font-semibold">{model.context}</p>
        </div>
      </footer>
    </article>
  );
}
