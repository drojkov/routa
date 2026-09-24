"use client";

import {
  motion,
  type MotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { ModelCard } from "@/components/site/model-card";
import { MODELS, type Model } from "@/lib/site";

const SPACING = 190;
const FAN_END = 0.3;
const PAN_START = 0.42;

/**
 * Реф. 4: колода карт-моделей. Скролл раскрывает её веером,
 * затем лента проезжает, а активная карта в центре приподнимается.
 */
export function ModelFan({
  models = MODELS,
  title = "Модели, которые мы держим в форме",
}: {
  models?: Model[];
  title?: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 22, mass: 0.4 });
  const n = models.length;
  const mid = (n - 1) / 2;

  // Фаза 2: лента едет от первой карты к последней
  const pan = useTransform(p, [FAN_END, PAN_START, 1], [0, mid * SPACING, -mid * SPACING]);
  const [active, setActive] = React.useState(0);
  useMotionValueEvent(p, "change", (v) => {
    const t = Math.min(1, Math.max(0, (v - PAN_START) / (1 - PAN_START)));
    setActive(Math.round(t * (n - 1)));
  });

  const headingOpacity = useTransform(p, [0, 0.15, 0.9, 1], [1, 0.14, 0.14, 0.5]);
  const headingScale = useTransform(p, [0, 0.3], [1, 0.92]);
  const m = models[active];

  return (
    <section ref={ref} className="relative" style={{ height: reduce ? "auto" : `${160 + n * 38}vh` }}>
      <div className={reduce ? "py-20" : "sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden"}>
        <motion.h2
          style={{ opacity: headingOpacity, scale: headingScale }}
          className="pointer-events-none absolute top-[14vh] w-full px-4 text-center text-5xl font-semibold tracking-[-0.045em] text-balance sm:text-7xl md:text-[6.5rem] md:leading-[0.95]"
        >
          {title}
        </motion.h2>

        {/* подсветка под картами */}
        <div
          className="absolute top-1/2 left-1/2 h-40 w-[70vw] -translate-x-1/2 rounded-full opacity-50 blur-[90px] transition-colors duration-700"
          style={{ background: `linear-gradient(90deg, ${m.gradient[1]}, ${m.gradient[2]})` }}
        />

        <div className="relative mt-16 h-[380px] w-full origin-center scale-[0.72] sm:scale-90 md:scale-100">
          <motion.div style={{ x: reduce ? 0 : pan }} className="absolute top-0 left-1/2">
            {models.map((model, i) => (
              <FanCard key={model.id} model={model} i={i} mid={mid} p={p} active={i === active} reduce={!!reduce} />
            ))}
          </motion.div>
        </div>

        {/* подпись активной модели */}
        <div className="relative z-10 mt-2 flex min-h-28 flex-col items-center px-4 text-center">
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.45 }}
          >
            <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              {m.tier} · {m.vendor}
            </p>
            <p className="mt-1 text-lg font-medium text-balance">{m.tagline}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              ≈ {m.typical.toLocaleString("ru-RU")} ₽ за ответ · {m.speed} ток/с · контекст {m.context}
            </p>
          </motion.div>
          <Link
            href="/models"
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background shadow-float transition hover:scale-[1.03] active:scale-95"
          >
            Все модели и цены <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="absolute bottom-6 flex gap-1.5">
          {models.map((x, i) => (
            <span
              key={x.id}
              className="h-1 rounded-full bg-foreground transition-all duration-300"
              style={{ width: i === active ? 20 : 6, opacity: i === active ? 0.9 : 0.2 }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FanCard({
  model,
  i,
  mid,
  p,
  active,
  reduce,
}: {
  model: Model;
  i: number;
  mid: number;
  p: MotionValue<number>;
  active: boolean;
  reduce: boolean;
}) {
  const off = i - mid;
  // колода: карты лежат стопкой с лёгким разбросом
  const deckRot = ((i * 37) % 11) - 5;
  const x = useTransform(p, [0, FAN_END], [off * 6, off * SPACING]);
  const y = useTransform(p, [0, FAN_END], [i * -3, Math.abs(off) * 14 + (i % 2 ? 18 : -10)]);
  const rotate = useTransform(p, [0, FAN_END], [deckRot, off * 5 + (i % 2 ? 4 : -3)]);
  const rotateY = useTransform(p, [0, FAN_END], [0, off * -6]);

  return (
    <motion.div
      className="absolute top-0 -ml-[115px] [perspective:1200px]"
      style={
        reduce
          ? { x: off * SPACING, rotate: off * 4, zIndex: 20 - Math.abs(Math.round(off)) }
          : { x, y, rotate, rotateY, zIndex: active ? 50 : 20 - Math.abs(Math.round(off)) }
      }
    >
      <motion.div
        animate={{ y: active ? -26 : 0, scale: active ? 1.08 : 1 }}
        whileHover={{ y: -34, scale: 1.1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      >
        <ModelCard model={model} />
      </motion.div>
    </motion.div>
  );
}
