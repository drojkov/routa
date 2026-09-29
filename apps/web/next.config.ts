import type { NextConfig } from "next";

// Туннели, чтобы показать dev-сервер по ссылке: serveo (`ssh -R 80:127.0.0.1:3000 serveo.net`),
// localhost.run (теряет туннель) и быстрый туннель Cloudflare (из текущей сети не подключается).
const DEV_TUNNELS =
  process.env.NODE_ENV === "production" ? [] : ["*.serveousercontent.com", "*.free.pinggy.net", "*.run.pinggy-free.link", "*.lhr.life", "*.trycloudflare.com"];

const nextConfig: NextConfig = {
  allowedDevOrigins: DEV_TUNNELS,
  experimental: { serverActions: { allowedOrigins: DEV_TUNNELS } },
  // Публичный адрес шлюза — /v1/* (как у OpenAI), код живёт в app/api/v1.
  // beforeFiles — чтобы /v1/models не перехватил маршрут /[lang]/models.
  async rewrites() {
    return { beforeFiles: [{ source: "/v1/:path*", destination: "/api/v1/:path*" }], afterFiles: [], fallback: [] };
  },
};

export default nextConfig;
