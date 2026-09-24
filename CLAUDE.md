# ai-gateway-plan

Сайт-витрина AI-моделей с оплатой в рублях (аналог OpenRouter для РФ).
Требования — `docs/02-SPEC.md`, конкуренты — `docs/01-RESEARCH.md`, план по этапам — `docs/03-PROMPTS.md`.
Расходится код со SPEC — остановиться и спросить, не угадывать.

## Структура

- `apps/web` — Next.js 16 (App Router, TS) + Tailwind 4 + shadcn (стиль base-nova, base-ui). Своя инструкция: `apps/web/AGENTS.md` — API Next 16 отличаются от привычных, сверяться с `apps/web/node_modules/next/dist/docs/`.
- `docs/` — SPEC, исследование, промпты этапов.
- `referenses/1–5.jpg` — визуальные референсы. `buttons/*.txt` — промпты компонентов 21st.dev.

## Команды (в `apps/web`)

`npm run dev` · `npx tsc --noEmit` · `npx eslint src` · `npm run build`

## Что сделано (дизайн-макет, этапы 6–7 частично)

Страницы: `/` лендинг, `/models` каталог, `/compare` сравнение и аналитика, `/sign-in` вход.

- `src/lib/site.ts` — бренд (`BRAND = "Routa"`, рабочее имя), `MODELS` (8 моделей, **цены и метрики условные**), `INTEGRATIONS`.
- `src/components/site/` — секции: `hero` (реф. 1+3), `model-fan` + `model-card` (реф. 4: карты-модели, веер по скроллу, framer-motion), `sections` (лента моделей, 3 шага, отзывы, бенто, пополнение, FAQ, футер), `catalog`, `compare` (реф. 5: графики на SVG), `pending-button`, `nav`, `reveal`.
- Тема: `src/app/globals.css` — светлая база `#f4f4f2`, акцент бирюза `--brand #14b8a6`, свечения violet/amber. Шрифты Onest + JetBrains Mono (кириллица).

Компоненты из `buttons/` (лежат в `src/components/ui/`):

| Промпт | Файл | Происхождение | Где используется |
|---|---|---|---|
| borderbeam | `border-beam.tsx` | обёртка над npm `border-beam` + добавлен проп `beamWidth` | карточка «Для вайб-кодинга», форма пополнения |
| кнопки | `shiny-button.tsx` | Magic UI | «Получить ключ» в навигации |
| кнопка сабмит | `pending.tsx` | Dice UI (base-вариант) | `PendingButton`: оплата, подписка, вход |
| с кем мы работаем | `marquee-logo-scroller.tsx` | **реконструкция** по API промпта | блок интеграций |
| sighnin | `sign-in-card-2.tsx` | **реконструкция** | `/sign-in` |

Реконструкции заменяются оригиналами с API-ключом 21st.dev — команда в шапке каждого файла.

## Принятые решения

- Логотипы OpenAI/Anthropic в блоке «С кем мы работаем» не ставим: читается как партнёрство. Там интеграции (Cursor, Cline, n8n…), модели — отдельной лентой.
- Приёмы OpenRouter-стиля допустимы, копия один в один — нет (SPEC §9).
- Графики: категориальная палитра из dataviz-гайда (`#2a78d6 #eb6834 #1baf7a`), одна ось, подсказки по наведению.

## Не сделано / следующее

- Тёмная тема (токены только светлые).
- Отзывы с фото (pravatar) выдуманы — заменить на реальные или убрать до запуска.
- Нет карточки модели `/models/[vendor]/[slug]`, страниц `/pricing`, `/docs`, кабинета — см. SPEC §8.
- Репозиторий на GitHub не подключён.
