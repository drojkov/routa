# Harvanera: переезд с Railway на сервер витрин

Сейчас прод на Railway (https://harvanera.com → Railway). Цель — Docker-контейнер на общем сервере витрин,
как у qtech-world: образ из реестра GitLab, `docker compose`, прокси с TLS перед контейнером.

Что в репозитории:

| Файл | Зачем |
|---|---|
| `apps/web/Dockerfile` | образ: `next start` на порту 3000, база в томе `/data`, healthcheck `/api/v1/models` |
| `deploy/docker-compose.yml` | контейнер `web` на `127.0.0.1:3070`, база в `./data` |
| `deploy/env.example` | список переменных для `.env` |
| `deploy/setup.sh` | первый запуск на сервере |
| `.gitlab-ci.yml` | при пуше в `dev` (основная ветка): `build` → образ `gitlab.q-tech.host:5050/showcases/routa/harvanera`, `deploy` — compose на сервер, `REGISTRY_IMAGE`/`IMAGE_TAG` в `.env`, `pull && up -d` |
| `apps/web/scripts/db-backup.mjs` | согласованная копия SQLite на ходу (перенос и бэкапы) |

## Что нужно от девопса

1. **Сервер и папка**: `/home/routa`, пользователь с правом `docker` и SSH-ключ для деплоя из CI.
2. **CI/CD-переменные** в проекте `showcases/routa` — как на остальных витринах: `SSH_HOST`, `SSH_PORT`, `SSH_USER`,
   `SSH_PRIVATE_KEY`, `DEPLOY_PATH` (папка на сервере, по умолчанию `/home/routa`). Уже заведены.
3. **Раннер с Docker** (`docker:dind`, privileged) для проекта и включённый Container Registry. Если проще —
   перенести проект в группу `showcases`, там это уже есть.
4. **Прокси** `harvanera.com` и `www.harvanera.com` → `127.0.0.1:3070` с TLS. Передавать `Host`, `X-Forwarded-Proto`,
   `X-Forwarded-For`, `X-Real-IP`. Таймаут ответа не меньше 300 с и без буферизации — шлюз `/v1` отдаёт стримы (SSE).
   Тело запроса до 10 МБ.
5. **DNS** (Cloudflare): `harvanera.com` и `www` → IP сервера, прокси Cloudflare можно оставить.
   Заодно SPF: TXT `v=spf1 a mx ~all` (сейчас SPF нет, письма попадают в спам).
6. **Исходящий SMTP** с сервера на `mail.harvanera.com:587` — на Railway он заблокирован, ради этого в том числе и переезд.
7. **Бэкапы**: cron на хосте, раз в сутки (см. ниже), и по возможности копия `data/backups/` за пределы сервера.

Пример для nginx:

```nginx
location / {
    proxy_pass http://127.0.0.1:3070;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_buffering off;
    proxy_read_timeout 300s;
    client_max_body_size 10m;
}
```

Caddy: `harvanera.com, www.harvanera.com { reverse_proxy 127.0.0.1:3070 { flush_interval -1 } }`.

**IP клиента.** От него зависят геоблокировка (Terms §2), журнал входов и данные заказа для чарджбэков.
За Cloudflare настоящий IP приходит в `CF-Connecting-IP` — так и стоит в `env.example`
(`CLIENT_IP_HEADERS=cf-connecting-ip,x-real-ip,x-forwarded-for`). Если сайт открыт и напрямую по IP сервера,
заголовок можно подделать — лучше пускать на 80/443 только адреса Cloudflare. Без Cloudflare —
`CLIENT_IP_HEADERS=x-real-ip,x-forwarded-for` и `proxy_set_header X-Real-IP $remote_addr` в прокси.

## Первый запуск

1. Пуш в `dev` — job `build` соберёт образ, `deploy` положит `docker-compose.yml` в `$DEPLOY_PATH`.
   Пока на сервере нет `.env` (и не задана file-переменная `ENV_FILE`), `deploy` останавливается.
2. На сервер в `/home/routa` дополнительно: `deploy/setup.sh`, `deploy/env.example`.
3. CI сам логинит сервер в реестр; для ручных `pull` — `docker login gitlab.q-tech.host:5050`.
4. `sudo sh setup.sh` — создаст `.env` и остановится. Заполнить `.env` значениями из
   Railway → harvanera → web → Variables (`BETTER_AUTH_SECRET` — **тот же**, иначе слетят сессии; ключи DeepInfra, пароль почты).
5. Перенести базу (ниже), потом снова `sudo sh setup.sh` — поднимет контейнер и дождётся healthcheck.
6. Проверить через прокси до переключения DNS:
   `curl -H 'Host: harvanera.com' http://127.0.0.1:3070/v1/models`, вход, кабинет, письмо подтверждения.
7. Переключить DNS. Railway не выключать ещё сутки-двое (кэш DNS), потом удалить job `deploy-railway`.

## Перенос базы с Railway

Перед переносом остановить запись: на Railway выключить сервис или сделать перенос в тихое время,
сразу после — переключить DNS. Всё, что запишется на Railway после копии, потеряется.

```sh
# на своей машине, в apps/web, Railway CLI привязан к проекту harvanera
railway ssh -- node -e "require('better-sqlite3')('/data/app.db',{readonly:true}).backup('/data/export.db').then(()=>console.log('ok'))"
railway ssh -- sha256sum /data/export.db
railway ssh -- base64 -w0 /data/export.db > export.b64
base64 -d -i export.b64 -o app.db && shasum -a 256 app.db   # сумма должна совпасть
scp app.db <user>@<сервер>:/home/routa/data/app.db
ssh <user>@<сервер> 'sudo chown 1000:1000 /home/routa/data/app.db'
railway ssh -- rm /data/export.db
```

Если `railway ssh -- <команда>` в вашей версии CLI не работает — зайти `railway ssh` и выполнить те же команды внутри,
файл забрать через `base64` и копирование из терминала (база маленькая, сотни КБ).

## Обновление и откат

- Из GitLab: деплой идёт сам при пуше в `dev`; тянет образ этого коммита (`IMAGE_TAG`), ждёт healthy.
- Откат: перезапустить job **deploy** в пайплайне старого коммита. Миграции базы назад не откатываются — если новая
  версия меняла схему, восстановить базу из `data/backups/`. Бэкап перед деплоем CI сейчас не делает — только cron (ниже).
- Вручную: `IMAGE_TAG=<короткий sha>` в `.env`, `docker compose up -d`.

## Бэкапы

Перед каждым деплоем из CI — автоматически (последние 30). Ежедневно — cron на хосте:

```cron
30 3 * * * cd /home/routa && docker compose exec -T web node scripts/db-backup.mjs --keep 14 >> data/backups/cron.log 2>&1
```

Восстановление: `docker compose stop web`, скопировать нужный `data/backups/app-*.db` в `data/app.db`,
удалить `data/app.db-wal` и `data/app.db-shm`, `docker compose start web`.

## Поддержка (возвраты, доказательства по заказу)

```sh
docker compose exec web npm run refund list
docker compose exec web npm run evidence <payment-id>
```
