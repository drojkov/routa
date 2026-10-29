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

Письма с сервера не уходят. `mail.harvanera.com` резолвится в `37.27.228.25` — это и внешний IP самого сервера
витрин (он за NAT, внутренний адрес `192.168.32.3`). Снаружи почтовый сервер отвечает на 587/465/25
(`220 mail.dev-store.info`), изнутри — timeout: NAT не пускает к собственному внешнему адресу.

**Нужно от девопса:** внутренний адрес почтового сервера и доступ к нему с сервера витрин по 587 —
тогда `EMAIL_HOST=<внутренний адрес>` в `.env` (проверка сертификата и так выключена,
`EMAIL_TLS_REJECT_UNAUTHORIZED=false`). Либо включить hairpin NAT на шлюзе `192.168.32.1`.
Проверка — ручная задача `mail-check` в пайплайне `dev`. Отдельно нужен SPF для harvanera.com:
TXT `v=spf1 a mx ~all` (DNS в Cloudflare).

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
