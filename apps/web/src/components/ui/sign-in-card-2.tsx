"use client";

/**
 * Реконструкция компонента 21st.dev «sign-in-card-2» (jatin-yadav05) по описанию:
 * тёмная карточка входа, по краям которой бегут лучи света; framer-motion + lucide + next.
 * Оригинал ставится только с API-ключом 21st.dev:
 *   npx shadcn@latest add "https://21st.dev/r/jatin-yadav05/sign-in-card-2?api_key=$API_KEY_21ST"
 * Экспорт `Component` совпадает с промптом sighnin.txt; логика формы вынесена в auth-card.tsx.
 */
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import * as React from "react";
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

/**
 * Оболочка карточки: наклон за курсором, бегущие лучи, свечение.
 * Содержимое (форма входа/регистрации) передаётся children — см. components/site/auth-card.tsx.
 */
export function Component({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-300, 300], [6, -6]), { stiffness: 120, damping: 18 });
  const rotateY = useSpring(useTransform(mx, [-300, 300], [-6, 6]), { stiffness: 120, damping: 18 });
  const reduce = useReducedMotion();

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - r.left - r.width / 2);
    my.set(e.clientY - r.top - r.height / 2);
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
        className={cn("relative w-full", wide ? "max-w-md" : "max-w-sm")}
      >
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl">
          <Beam side="top" delay={0} />
          <Beam side="right" delay={0.65} />
          <Beam side="bottom" delay={1.3} />
          <Beam side="left" delay={1.95} />
          <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-teal-400/20 blur-3xl" />
          <div className="relative">{children}</div>
        </div>
      </motion.div>
    </div>
  );
}

export function Field({
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
