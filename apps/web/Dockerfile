# Harvanera: образ для сервера витрин (docker compose, см. deploy/DEPLOY.md в корне репозитория).
# Сборка: docker build -t harvanera apps/web
# Внутри — `next start` на порту 3000, база SQLite в томе /data (DATABASE_PATH=/data/app.db).

FROM node:22-bookworm-slim AS deps
WORKDIR /app
# better-sqlite3 — нативный модуль; если готовой сборки под платформу нет, компилируется
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 DATABASE_PATH=/data/app.db
COPY --from=build /app/package.json /app/next.config.ts ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
# читаются с диска во время работы: миграции, база стран, markdown документации и юр. текстов, скрипты поддержки
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/geo ./geo
COPY --from=build /app/src/content ./src/content
COPY --from=build /app/scripts ./scripts
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 3000
# коммит сборки — виден в `docker inspect`
ARG CI_COMMIT_SHA=dev
LABEL org.opencontainers.image.revision=$CI_COMMIT_SHA
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/v1/models').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
CMD ["node_modules/.bin/next", "start"]
