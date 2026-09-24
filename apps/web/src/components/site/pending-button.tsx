"use client";

import { Check, Loader2 } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { usePending } from "@/components/ui/pending";

/**
 * Паттерн из «кнопка сабмит.txt»: Button + usePending + Loader2.
 * Пока идёт запрос, кнопка блокирует клики и Enter, но остаётся в фокусе (aria-busy).
 * `action` — асинхронная операция; в макете по умолчанию имитация на 2 с.
 */
export function PendingButton({
  children,
  pendingLabel,
  doneLabel,
  action = () => new Promise((r) => setTimeout(r, 2000)),
  className,
  variant,
  type = "button",
  form,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  doneLabel?: string;
  action?: () => Promise<unknown>;
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  type?: "button" | "submit";
  form?: string;
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const { pendingProps, isPending } = usePending({ isPending: isSubmitting });

  const onClick = React.useCallback(
    async (e: React.MouseEvent) => {
      if (type === "submit") {
        const f = (e.currentTarget as HTMLButtonElement).form;
        if (f && !f.reportValidity()) return;
        e.preventDefault();
      }
      setIsSubmitting(true);
      await action();
      setIsSubmitting(false);
      if (doneLabel) {
        setDone(true);
        setTimeout(() => setDone(false), 2200);
      }
    },
    [action, doneLabel, type],
  );

  return (
    <Button type={type} form={form} variant={variant} onClick={onClick} className={className} {...pendingProps}>
      {isPending && <Loader2 className="size-4 animate-spin" />}
      {done && !isPending && <Check className="size-4" />}
      {isPending ? pendingLabel : done ? doneLabel : children}
    </Button>
  );
}
