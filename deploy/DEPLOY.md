# Harvanera: прод на сервере витрин

Прод — Docker-контейнер на общем сервере витрин компании (`37.27.228.25`), перед ним Traefik (TLS, Let's Encrypt),
перед сервером — Cloudflare. `harvanera.com` смотрит сюда. `www.harvanera.com` — прямо на IP сервера (без прокси
Cloudflare); в compose для него роутер Traefik с 301 на `SITE_HOST` (сертификат на www Traefik получает сам).

Старый прод на Railway остановлен 2026-10-29 (`railway down`); volume со старой базой сохранён.
Сервис Railway всё ещё подключён к `main` на GitHub — слияние в `main` его поднимет.

| Файл | Зачем |
|---|---|
| `apps/web/Dockerfile` | образ: `next start` на порту 3000, база в `/data`, healthcheck `/api/v1/models` |
| `deploy/docker-compose.yml` | сервис `web` в сети `traefik-net`, роутер на `SITE_HOST`, база в `./data` |
| `deploy/env.example` | список переменных для `.env` сервера |
| `deploy/setup.sh` | ручной первый запуск (создаёт `.env` и `data/`, поднимает контейнер) |
| `deploy/mail-check.sh` | диагностика SMTP с сервера (ручная задача `mail-check` в CI, только чтение) |
| `.gitlab-ci.yml` | деплой при пуше в `dev` |
| `apps/web/scripts/db-backup.mjs` | согласованная копия SQLite на ходу |

## Деплой

Пуш в `dev` (основная ветка GitLab `showcases/routa`):

1. `build` — образ `gitlab.q-tech.host:5050/showcases/routa:<короткий sha>` и `:latest`.
2. `deploy` — по SSH (`SSH_HOST`, `SSH_PORT`, `SSH_USER`, `SSH_PRIVATE_KEY`) в `DEPLOY_PATH`: кладёт `docker-compose.yml`,
   `.env` — из file-переменной `ENV_FILE`, если задана, иначе оставляет серверный. Дописывает в `.env`
   `HARVANERA_IMAGE` и `SITE_TAG`, делает `docker compose pull && up -d` и ждёт healthy (~90 с).

Значения `DEPLOY_PATH` и `.env` хранятся в CI/CD-переменных проекта, их ведёт девопс.

## Откат

- Перезапустить job **deploy** в пайплайне старого коммита.
- Вручную на сервере: `SITE_TAG=<короткий sha>` в `.env`, `docker compose up -d`.
- Миграции базы назад не откатываются. Если новая версия меняла схему — восстановить базу из бэкапа (ниже).
  Перед деплоем CI бэкап не делает.

## IP клиента

От него зависят геоблокировка (Terms §2), журнал входов, лимит регистраций и данные заказа для чарджбэков.
Настраивать ничего не нужно: Traefik кладёт в `X-Real-IP` адрес того, кто к нему подключился; если это
Cloudflare — сайт берёт `CF-Connecting-IP`, иначе ему не верит (`resolveClientIp` в `apps/web/src/lib/geo.ts`).
`CLIENT_IP_HEADERS` в `.env` можно не задавать.

## Почта

Письма уходят с 2026-10-29: приложение ходит к почтовику по внутреннему адресу `192.168.32.4`
(задан в `docker-compose.yml`, переопределить — `EMAIL_HOST_INTERNAL`). Снаружи `mail.harvanera.com`
= `37.27.228.25`, изнутри этот адрес недоступен (NAT без hairpin). Диагностика — ручные задачи `mail-check`, `mail-fix`.

### DNS для доставки (Cloudflare, зона harvanera.com) — сделать человеку с доступом к зоне

Без SPF и DMARC письма с info@harvanera.com (подтверждение email — без него нельзя пополнить баланс,
чеки, возвраты) Gmail и Outlook кладут в спам или отклоняют. Сейчас (проверено 2026-10-29) нет ни того, ни другого.
Записи — по образцу соседней витрины dev-store.info на том же почтовике (`v=spf1 a mx -all`, `p=quarantine`):

| Тип | Имя | Значение | Прокси |
|---|---|---|---|
| TXT | `harvanera.com` (@) | `v=spf1 mx ip4:37.27.228.25 ~all` | — |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:info@harvanera.com; adkim=r; aspf=r` | — |

- В SPF не `a`, а `mx` + IP: корень harvanera.com проксирует Cloudflare, `a` дал бы адреса Cloudflare.
- `mx` → `mail.harvanera.com` → `37.27.228.25` — запись `mail` должна оставаться **DNS only** (серое облако).
- DKIM (`mail._domainkey`) уже есть. Через 1–2 недели без жалоб в отчётах DMARC — ужесточить:
  SPF `-all`, DMARC `p=quarantine` (как у dev-store.info).
- Проверка после правки: `dig +short TXT harvanera.com`, `dig +short TXT _dmarc.harvanera.com`,
  и письмо на Gmail → «Показать оригинал»: SPF, DKIM и DMARC — PASS.

### Сертификат почтовика

По прошлой диагностике (`mail-check`) сертификат почтового сервера выписан на чужое имя и истёк в 2026-07, поэтому в приложении
проверка TLS выключена (`EMAIL_TLS_REJECT_UNAUTHORIZED=false`). Это сервер компании, не наш: попросить
девопса выпустить сертификат (Let's Encrypt) с именами `mail.dev-store.info` и `mail.harvanera.com`.
После этого убрать `EMAIL_TLS_REJECT_UNAUTHORIZED=false` из `.env` (CI-переменная `ENV_FILE`).

## Бэкапы

Ежедневно — cron на хосте:

```cron
30 3 * * * cd $DEPLOY_PATH && docker compose exec -T web node scripts/db-backup.mjs --keep 14 >> data/backups/cron.log 2>&1
```

Настроен ли он сейчас — не проверено.

Восстановление: `docker compose stop web`, скопировать нужный `data/backups/app-*.db` в `data/app.db`,
удалить `data/app.db-wal` и `data/app.db-shm`, `docker compose start web`.

## Поддержка

На сервере, в `DEPLOY_PATH` (`DATABASE_PATH` в контейнере уже задан):

```sh
docker compose exec web npm run account show <email>
docker compose exec web npm run refund list
docker compose exec web npm run evidence <payment-id>
```
