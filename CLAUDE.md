# ai-gateway-plan

Сайт-витрина AI-моделей (аналог OpenRouter). **С 2026-09-24 — международный продукт**, юрлицо в Гонконге (решение владельца; `docs/02-SPEC.md` ещё описывает РФ-версию и требует пересмотра).
Требования — `docs/02-SPEC.md`, конкуренты — `docs/01-RESEARCH.md`, план по этапам — `docs/03-PROMPTS.md`.
Расходится код со SPEC — остановиться и спросить, не угадывать.

## Структура

- `apps/web` — Next.js 16 (App Router, TS) + Tailwind 4 + shadcn (стиль base-nova, base-ui). Своя инструкция: `apps/web/AGENTS.md` — API Next 16 отличаются от привычных, сверяться с `apps/web/node_modules/next/dist/docs/`.
- `docs/` — SPEC, исследование, промпты этапов.
- `referenses/1–5.jpg` — визуальные референсы. `buttons/*.txt` — промпты компонентов 21st.dev.

## Команды (в `apps/web`)

`npm run dev` · `npx tsc --noEmit` · `npx eslint src` · `npm run build` · `npx drizzle-kit generate` (после правки схемы) · `npx next typegen` (если tsc не видит `PageProps`)

Первый запуск: `cp .env.example .env.local`, задать `BETTER_AUTH_SECRET`. База `data/app.db` создаётся и мигрирует сама.

## Что сделано

Все страницы под `src/app/[lang]/`: `/` лендинг, `/models`, `/compare`, `/sign-in`, `/sign-up`, `/dashboard` (+ `/dashboard/checkout/[id]`), `/legal/[doc]`. `src/proxy.ts` — редирект на язык (cookie → Accept-Language) и охрана кабинета.

- **i18n** — `src/i18n/`: 8 языков (en ru es pt de fr zh ja), словари в `dictionaries/*.ts`; `en.ts` эталон, тип `Dictionary` заставляет остальные повторять форму. Клиент: `useI18n()` → `dict`, `money(usd)`, `href(path)`, `t()`. Новый текст — ключ во все 8 словарей.
- **Валюты** — 8 (USD EUR GBP RUB CNY JPY INR BRL). Цены и баланс в USD, показ — пересчёт по `USD_RATES` в `i18n/config.ts` (**курсы условные**). Выбор в cookie `currency`.
- **Авторизация** — Better Auth (`src/lib/auth.ts`) + Drizzle + SQLite (`src/db/`). Email/пароль, Google, Яндекс ID (genericOAuth). Без OAuth-ключей кнопки работают в **демо-режиме** (`lib/actions/auth.ts`: вход в `demo-<provider>@example.com`), в production — только с `AUTH_DEMO_OAUTH=true`.
- **Кабинет** — баланс = SUM(ledger) в микро-USD, бонус $1 при регистрации, API-ключи (хранится sha256), пополнение создаёт `payment` в статусе pending → страница заказа. Выгрузка данных `/api/account/export`, удаление аккаунта.
- **Юридическое** — `src/content/legal/*.md` (8 документов EN + согласие 152-ФЗ RU), реквизиты подставляются из `COMPANY` в `lib/site.ts` (сейчас плейсхолдеры `[...]`). Баннер cookie `components/site/cookie-banner.tsx` (GDPR/CNIL, GPC). Согласия при регистрации, отказ от права отзыва при пополнении.
- `src/lib/site.ts` — бренд (`BRAND = "Routa"`), `COMPANY`, `MODELS` (цены USD по прайсам вендоров, скорость/качество **условные**), `INTEGRATIONS`.
- Логотипы — локально в `public/logos/*.svg` (CDN simpleicons у владельца не открывается — внешние картинки не использовать).
- Тема: `src/app/globals.css` — светлая база `#f4f4f2`, акцент бирюза `--brand #14b8a6`. Шрифты Onest + JetBrains Mono.

Компоненты из `buttons/` (лежат в `src/components/ui/`):

| Промпт | Файл | Происхождение | Где используется |
|---|---|---|---|
| borderbeam | `border-beam.tsx` | обёртка над npm `border-beam` + добавлен проп `beamWidth` | карточка «Для вайб-кодинга», форма пополнения |
| кнопки | `shiny-button.tsx` | Magic UI | «Получить ключ» в навигации |
| кнопка сабмит | `pending.tsx` | Dice UI (base-вариант) | `PendingButton`: подписка |
| с кем мы работаем | `marquee-logo-scroller.tsx` | **реконструкция** по API промпта | блок интеграций |
| sighnin | `sign-in-card-2.tsx` | **реконструкция**, только оболочка (лучи, наклон); форма — `site/auth-card.tsx` | `/sign-in`, `/sign-up` |

Реконструкции заменяются оригиналами с API-ключом 21st.dev — команда в шапке каждого файла.

## Принятые решения

- Международный сайт: без акцента на РФ, язык и валюта переключаются. СБП показывается только при валюте RUB.
- Логотипы OpenAI/Anthropic в блоке «С кем мы работаем» не ставим: читается как партнёрство. Там интеграции (Cursor, Cline, n8n…), модели — отдельной лентой.
- Приёмы OpenRouter-стиля допустимы, копия один в один — нет (SPEC §9).
- Графики: категориальная палитра из dataviz-гайда (`#2a78d6 #eb6834 #1baf7a`), одна ось, подсказки по наведению.
- Юридические документы — на английском (он главный), перевод не делаем; согласие 152-ФЗ — на русском.

## Не сделано / следующее

- **Чекаут**: подключить провайдера оплаты (вебхук → `payment.paid` + проводка `topup`), письмо-подтверждение, кнопка отзыва (ЕС, ст. 11a CRD).
- Почтовый провайдер: подтверждение email, сброс пароля (сейчас выключены).
- Реальные OAuth-ключи Google/Яндекс + `BETTER_AUTH_URL` (см. `.env.example`).
- Юр. документы — черновики с `[TO CONFIRM]`, нужны реквизиты и проверка юристом. Сверка SPEC с международной моделью.
- Отзывы выдуманы — заменить реальными или убрать до запуска. Рассылка в футере — заглушка.
- Тёмная тема. Карточка модели `/models/[vendor]/[slug]`, `/pricing`, `/docs`.
- Postgres вместо SQLite в проде. Репозиторий на GitHub не подключён.
