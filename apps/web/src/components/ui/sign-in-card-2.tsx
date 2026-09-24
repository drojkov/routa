"use client";

/**
 * Реконструкция компонента 21st.dev «sign-in-card-2» (jatin-yadav05) по описанию:
 * тёмная карточка входа, по краям которой бегут лучи света; framer-motion + lucide + next.
 * Оригинал ставится только с API-ключом 21st.dev:
 *   npx shadcn@latest add "https://21st.dev/r/jatin-yadav05/sign-in-card-2?api_key=$API_KEY_21ST"
 * Экспорт `Component` совпадает с промптом sighnin.txt.
 */
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { usePending } from "@/components/ui/pending";
import { BRAND } from "@/lib/site";
import { cn } from "@/lib/utils";

function Beam({ side, delay }: { side: "top" | "right" | "bottom" | "left"; delay: number }) {
  const horizontal = side === "top" || side === "bottom";
  const pos = {
    top: "top-0 left-0 h-px w-1/2",
    bottom: "bottom-0 right-0 h-px w-1/2",
    left: "left-0 bottom-0 w-px h-1/2",
    right: "right-0 top-0 w-px h-1/2",
  }[side];
  const grad = {
    top: "bg-gradient-to-r",
    bottom: "bg-gradient-to-l",
    left: "bg-gradient-to-t",
    right: "bg-gradient-to-b",
  }[side];
  const travel = {
    top: { x: ["-100%", "200%"] },
    bottom: { x: ["100%", "-200%"] },
    left: { y: ["100%", "-200%"] },
    right: { y: ["-100%", "200%"] },
  }[side];
  return (
    <motion.span
      aria-hidden
      className={cn("pointer-events-none absolute", pos, grad, "from-transparent via-teal-300 to-transparent")}
      style={{ filter: "drop-shadow(0 0 6px rgb(94 234 212 / .9))" }}
      initial={{ opacity: 0 }}
      animate={{ ...travel, opacity: [0, 1, 1, 0] }}
      transition={{ duration: 2.6, delay, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }}
      data-horizontal={horizontal}
    />
  );
}

export function Component() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [focused, setFocused] = React.useState<string | null>(null);
  const { pendingProps, isPending } = usePending({ isPending: submitting });

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-300, 300], [8, -8]), { stiffness: 120, damping: 18 });
  const rotateY = useSpring(useTransform(mx, [-300, 300], [-8, 8]), { stiffness: 120, damping: 18 });

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - r.left - r.width / 2);
    my.set(e.clientY - r.top - r.height / 2);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => setSubmitting(false), 2000);
  }

  return (
    <div className="relative flex w-full items-center justify-center px-4" style={{ perspective: 1400 }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{ rotateX, rotateY }}
        onMouseMove={onMove}
        onMouseLeave={() => {
          mx.set(0);
          my.set(0);
        }}
        className="relative w-full max-w-sm"
      >
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl">
          <Beam side="top" delay={0} />
          <Beam side="right" delay={0.65} />
          <Beam side="bottom" delay={1.3} />
          <Beam side="left" delay={1.95} />
          <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-teal-400/20 blur-3xl" />

          <div className="relative mb-7 text-center">
            <div className="mx-auto mb-4 grid size-11 place-items-center rounded-2xl border border-white/15 bg-white/10 text-lg font-semibold text-white">
              {BRAND[0]}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">С возвращением</h1>
            <p className="mt-1 text-sm text-white/55">Войдите, чтобы управлять ключами и балансом</p>
          </div>

          <form onSubmit={onSubmit} className="relative space-y-3">
            <Field icon={Mail} focused={focused === "email"}>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="Email"
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                className="h-11 w-full bg-transparent pr-3 pl-10 text-sm text-white outline-none placeholder:text-white/35"
              />
            </Field>
            <Field icon={Lock} focused={focused === "password"}>
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="Пароль"
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
                className="h-11 w-full bg-transparent pr-10 pl-10 text-sm text-white outline-none placeholder:text-white/35"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-white/40 transition hover:text-white"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </Field>

            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="flex cursor-pointer items-center gap-2 text-white/55">
                <input type="checkbox" className="size-3.5 accent-teal-400" /> Запомнить меня
              </label>
              <Link href="#" className="text-white/55 transition hover:text-white">
                Забыли пароль?
              </Link>
            </div>

            <button
              type="submit"
              {...pendingProps}
              className="group relative mt-2 flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-white text-sm font-medium text-black transition hover:scale-[1.01] active:scale-[0.98] data-pending:opacity-80"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Входим…
                </>
              ) : (
                <>
                  Войти <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            <div className="flex items-center gap-3 py-2 text-[11px] tracking-wider text-white/35 uppercase">
              <span className="h-px flex-1 bg-white/10" /> или <span className="h-px flex-1 bg-white/10" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="h-10 rounded-xl border border-white/10 bg-white/5 text-sm text-white/80 transition hover:bg-white/10"
              >
                Яндекс ID
              </button>
              <button
                type="button"
                className="h-10 rounded-xl border border-white/10 bg-white/5 text-sm text-white/80 transition hover:bg-white/10"
              >
                Telegram
              </button>
            </div>
            <p className="pt-3 text-center text-xs text-white/50">
              Нет аккаунта?{" "}
              <Link href="#" className="text-teal-300 hover:underline">
                Зарегистрироваться
              </Link>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function Field({
  icon: Icon,
  focused,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  focused: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative rounded-xl border bg-white/[0.03] transition-colors",
        focused ? "border-teal-300/60 bg-white/[0.06]" : "border-white/10",
      )}
    >
      <Icon
        className={cn(
          "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 transition-colors",
          focused ? "text-teal-300" : "text-white/40",
        )}
      />
      {children}
    </div>
  );
}

export default Component;
