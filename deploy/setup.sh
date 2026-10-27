#!/bin/sh
# Первый запуск Harvanera на сервере: sudo sh setup.sh
# 1-й раз создаёт .env из env.example и останавливается — заполнить и запустить снова.
# Дальше: data/ для базы (владелец uid 1000 — пользователь node в образе), pull, up, проверка здоровья.
set -eu
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  cp env.example .env && chmod 600 .env
  echo "Создан .env — заполните BETTER_AUTH_SECRET, DEEPINFRA_API_KEYS, EMAIL_PASS и запустите снова."
  exit 0
fi
grep -q '^BETTER_AUTH_SECRET=..*' .env || { echo "В .env пустой BETTER_AUTH_SECRET"; exit 1; }

mkdir -p data/backups
chown -R 1000:1000 data

docker compose pull
docker compose up -d

printf 'Жду, пока контейнер станет healthy'
for i in $(seq 1 30); do
  s=$(docker inspect -f '{{.State.Health.Status}}' "$(docker compose ps -q web)" 2>/dev/null || echo starting)
  if [ "$s" = healthy ]; then echo " — ok"; docker compose ps; exit 0; fi
  printf '.'; sleep 3
done
echo " — не дождался. Логи: docker compose logs --tail 50 web"
exit 1
