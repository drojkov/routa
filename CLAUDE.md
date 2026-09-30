# ai-gateway-plan (бренд: Harvanera)

Сайт-витрина AI-моделей (аналог OpenRouter). **С 2026-09-24 — международный продукт**, юрлицо в Гонконге (решение владельца; `docs/02-SPEC.md` ещё описывает РФ-версию и требует пересмотра).
Требования — `docs/02-SPEC.md`, конкуренты — `docs/01-RESEARCH.md`, план по этапам — `docs/03-PROMPTS.md`.
Расходится код со SPEC — остановиться и спросить, не угадывать.

## Структура

- `apps/web` — Next.js 16 (App Router, TS) + Tailwind 4 + shadcn (стиль base-nova, base-ui). Своя инструкция: `apps/web/AGENTS.md` — API Next 16 отличаются от привычных, сверяться с `apps/web/node_modules/next/dist/docs/`.
- `docs/` — SPEC, исследование, промпты этапов.
- `referenses/1–5.jpg` — визуальные референсы. `buttons/*.txt` — промпты компонентов 21st.dev.

## Команды (в `apps/web`)

`npm run dev` · `npm run test:gateway` (мок-тест шлюза; dev запущен с `DEEPINFRA_API_KEYS= TOGETHER_API_KEYS=`) · `npm run test:gateway:live` (живые запросы к хостеру, тратит доли цента) · `npx tsc --noEmit` · `npx eslint src` · `npm run build` · `npx drizzle-kit generate` (после правки схемы; **dev-сервер перезапустить** — соединение с БД и схема кэшируются в `globalThis`) · `npx next typegen` (если tsc не видит `PageProps`)

Первый запуск: `cp .env.example .env.local`, задать `BETTER_AUTH_SECRET`. База `data/app.db` создаётся и мигрирует сама.

## Что сделано

Все страницы под `src/app/[lang]/`: `/` лендинг, `/models`, `/compare`, `/sign-in`, `/sign-up`, `/dashboard` (+ `/dashboard/checkout/[id]`), `/legal/[doc]`. `src/proxy.ts` — редирект на язык (cookie → Accept-Language) и охрана кабинета.

- **i18n** — `src/i18n/`: 7 языков (en es pt de fr zh ja; **русского нет** — решение 2026-09-29, `/ru/*` → 308 на `/en/*`). По умолчанию всегда английский (Accept-Language не учитывается), выбор — cookie, словари в `dictionaries/*.ts`; `en.ts` эталон, тип `Dictionary` заставляет остальные повторять форму. Клиент: `useI18n()` → `dict`, `money(usd)`, `href(path)`, `t()`. Новый текст — ключ во все 7 словарей.
- **Валюты** — 8 (USD EUR GBP CNY JPY INR BRL HKD), **рубля нет**; по умолчанию всегда USD. Цены и баланс в USD, показ — пересчёт по `USD_RATES` в `i18n/config.ts` (**курсы условные**). Выбор в cookie `currency`.
- **Авторизация** — Better Auth (`src/lib/auth.ts`) + Drizzle + SQLite (`src/db/`). Email/пароль и Google (**Яндекс убран**). Без OAuth-ключей кнопки работают в **демо-режиме** (`lib/actions/auth.ts`: вход в общий `demo-google@example.com`), в production — только с `AUTH_DEMO_OAUTH=true`.
- **Кабинет** (`/dashboard/*`, общий `layout.tsx` с балансом в шапке, компоненты в `components/dashboard/`): Обзор (3 шага «как это работает» + код) · **Чат** (playground через `/api/playground/chat` — тот же шлюз, платит сессия, `apiKeyId = null`) · **Ключи** (лимит, пауза `disabledAt`, белый список моделей `allowedModels`, расход за месяц, после создания — готовый код с ключом) · **Активность** (график расхода по дням/моделям, лента запросов, CSV `/api/account/usage.csv`) · **Баланс** (пополнение, заказы, история) · **Настройки** (выгрузка данных, удаление аккаунта, логирование текстов запросов: флаг `user.log_content`, по умолчанию выкл., тексты в `request_content`, хранятся 30 дней — `lib/request-content.ts`; просмотр — в ленте Активности). Баланс = SUM(ledger) в микро-USD, бонус $1 при регистрации, ключ хранится sha256. Выборки — `lib/usage.ts`.
- **Страница модели** `/models/[vendor]/[slug]`, **документация** `/docs` (markdown `src/content/docs/{en,ru}.md`, остальные языки — английский). Примеры кода — один генератор `lib/snippets.ts`; адрес API в примерах — `lib/api-base.ts` (`API_BASE_URL` или текущий хост + `/v1`).
- **Словарь кабинета** — отдельно, `i18n/dictionaries/cab/*.ts` (эталон `cab/en.ts`), подключён как `dict.cab`.
- **Шлюз `/v1`** — `src/lib/gateway/` + `app/api/v1/*` (rewrite `/v1/*` → `/api/v1/*` в `next.config.ts`). OpenAI-совместимые `POST /v1/chat/completions` (стрим тоже), `GET /v1/models`, `GET /v1/balance`. Решение 2026-09-28: свой шлюз в Next.js **вместо LiteLLM из SPEC** — апстримы только OpenAI-совместимые, баланс не надо зеркалить. Цепочка: ключ → RPM и пауза после 4xx (`limits.ts`) → модель (`routes.ts`) → предпроверка баланса и лимита ключа → хостер с запасными (`forward.ts`) → списание по `usage`: `request_log` + `ledger.debit` одной транзакцией, ref = `x-request-id`.
- **Апстримы** — хостеры открытых моделей, ключи в `.env.local` через запятую. Сейчас подключён DeepInfra (имена и закупка сверены с его каталогом 2026-09-29, `routes.ts`); ключ Together не прошёл авторизацию. **Цена продажи = закупка × 1.05, округлено вверх**; хостер с закупкой выше нашей цены в ротацию не попадает. На 402/404 от хостера — алерт в лог, клиенту 502 без текста хостера. GPT/Claude/Gemini — `available: false` в `MODELS`: плашка «временно недоступна», шлюз отвечает 503. Без ключей хостеров — **мок-апстрим** (вне production по умолчанию, `GATEWAY_MOCK`). Состояние пула и лимиты — в памяти процесса (один инстанс).
- **Юридическое** — `src/content/legal/*.md`: 5 документов EN (terms, privacy, cookies, refunds, acceptable-use), источник — присланные файлы в `Politics/` (2026-09-30; ссылки `/en/legal/x` переделаны в `/legal/x`). Subprocessors, Accessibility, Legal Notice убраны по решению руководителя (по закону не нужны, только по запросу эквайера). Реквизиты в документах — текстом; `COMPANY` в `lib/site.ts` — для футера и `{{company.*}}`. Баннер cookie `components/site/cookie-banner.tsx` (GDPR/CNIL, GPC). Согласия при регистрации, отказ от права отзыва при пополнении.
- `src/lib/site.ts` — бренд (`BRAND = "Harvanera"`, ключи `sk-harvanera-…`, домен `harvanera.com` — **рабочий** (2026-09-30: указывает на Railway; у домена нет MX — почта на @harvanera.com не принимается; поддомена `api.` нет — `API_BASE` = `https://harvanera.com/v1`)), `COMPANY`, `MODELS` (цены USD по прайсам вендоров, скорость/качество **условные**), `INTEGRATIONS`.
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

- **Геоблокировка** — `lib/geo.ts` + `proxy.ts`: страны из Terms §2 (список кодов в `BLOCKED_COUNTRIES`, менять вместе с Terms). Закрыты вход/регистрация/кабинет (→ `/[lang]/unavailable`) и API `/v1`, `/api/auth|playground|account` (451); витрина и `/v1/models` открыты. IP — `X-Real-IP` (Railway), страна — DB-IP Lite `geo/dbip-country-lite.mmdb.gz` (обновлять раз в месяц `npm run geo:update`; атрибуция DB-IP в футере обязательна). Обход для команды: `?geo_bypass=<GEO_BYPASS_TOKEN>`. Выключить: `GEO_BLOCK=off`. Регионы Украины по IP не отличить.
- **Почта** — `lib/email.ts` (Resend по HTTP; без `RESEND_API_KEY` — в лог). После зачисления `creditPayment()` шлёт подтверждение с информацией о праве отзыва (EN).
- **Поставщики в юр. текстах** (2026-09-30): Terms §1 и Privacy §5 называют DeepInfra; OpenAI/Anthropic/Google — только когда подключим (по памяти они не обслуживают Гонконг/Китай — проверить при регистрации).

## Принятые решения

- Международный сайт: без русского языка, рубля, СБП и Яндекса. Язык и валюта переключаются, по умолчанию EN/USD.
- Логотипы OpenAI/Anthropic в блоке «С кем мы работаем» не ставим: читается как партнёрство. Там интеграции (Cursor, Cline, n8n…), модели — отдельной лентой.
- Приёмы OpenRouter-стиля допустимы, копия один в один — нет (SPEC §9).
- Графики: категориальная палитра из dataviz-гайда (`#2a78d6 #eb6834 #1baf7a`), одна ось, подсказки по наведению.
- Юридические документы и документация `/docs` — только на английском.

## Не сделано / следующее

- **Чекаут**: подключить провайдера оплаты — вебхук с проверкой подписи вызывает `creditPayment()` из `lib/payments.ts` (уже идемпотентна). Пока — демо-кнопка на странице заказа (`PAYMENTS_DEMO`). Кнопка отзыва (ЕС, ст. 11a CRD).
- **Шлюз**: пополнить баланс DeepInfra (сейчас 0 — хостер отвечает 402) и прогнать `test:gateway:live`; рабочий ключ Together + сверка его каталога; второй хостер для запасного маршрута; `/v1/embeddings`; алерт в Telegram при отключении ключа; страница расхода в кабинете по `request_log`.
- Почта: задать `RESEND_API_KEY` и подтвердить домен в Resend; MX для приёма на info@harvanera.com. Подтверждение email и сброс пароля (сейчас выключены) — через тот же `lib/email.ts`.
- Реальные OAuth-ключи Google + `BETTER_AUTH_URL` (см. `.env.example`).
- Юр. документы — черновики с `[TO CONFIRM]`, нужны реквизиты и проверка юристом. Сверка SPEC с международной моделью.
- Отзывы выдуманы — заменить реальными или убрать до запуска. Рассылка в футере — заглушка.
- Тёмная тема. `/pricing`. Тексты лендинга ещё обещают GPT/Claude/Gemini — переписать под открытые модели.
- Postgres вместо SQLite в проде. Репозиторий — `github.com/drojkov/routa`.
- **Прод на Railway** (с 2026-09-29): https://web-production-06476.up.railway.app — проект `harvanera`, сервис `web`, корень `/apps/web`, volume `/data` (`DATABASE_PATH=/data/app.db`), healthcheck `/api/v1/models`. Демо-вход включён (`AUTH_DEMO_OAUTH=true`), демо-оплата **выключена** (иначе любой накрутит баланс и потратит DeepInfra). **Пуш в `main` = деплой** — поэтому работа идёт в ветке `dev` (с 2026-09-30), в `main` сливается только по команде владельца (триггер Railway на `drojkov/routa`). Во время `next build` база в памяти (`db/index.ts`, `NEXT_PHASE`).
- Показ dev-сервера по ссылке — SSH-туннели (serveo, pinggy; Cloudflare из сети владельца не подключается), домены разрешены в `DEV_TUNNELS` (`next.config.ts`) и `trustedOrigins` (`lib/auth.ts`). Бесплатные туннели нестабильны.
