# Почта с сервера витрин: mail.harvanera.com = внешний IP этого же сервера (NAT изнутри не пускает),
# поэтому EMAIL_HOST — внутренний адрес почтовика (mail-check нашёл 192.168.32.4, «220 mail.dev-store.info»).
# 1) тестовое письмо из контейнера на info@ через новый адрес; 2) только если ушло — .env (копия .env.bak-*) и перезапуск.
# Значения переменных в лог не выводятся, кроме EMAIL_HOST.
# Запуск — ручная задача mail-fix в CI: ssh deploy "cd $DEPLOY_PATH && sh -s -- <host>" < deploy/mail-fix.sh
NEW="${1:-192.168.32.4}"
echo "== тестовое письмо через $NEW"
docker compose exec -T -e TEST_HOST="$NEW" web node -e '
const nm = require("nodemailer"); const e = process.env;
nm.createTransport({ host: e.TEST_HOST, port: Number(e.EMAIL_PORT || 587), secure: false,
  auth: { user: e.EMAIL_USER, pass: e.EMAIL_PASS || "" }, tls: { rejectUnauthorized: false }, connectionTimeout: 8000 })
  .sendMail({ from: e.EMAIL_FROM || `Harvanera <${e.EMAIL_USER}>`, to: "info@harvanera.com",
    subject: "Harvanera: SMTP test from production", text: "Test message from the production server (mail-fix). " + new Date().toISOString() })
  .then((r) => { console.log("  sent:", r.response); process.exit(0); })
  .catch((err) => { console.log("  FAILED:", err.code || "", err.message); process.exit(1); });' || { echo "Письмо не ушло — .env не трогаю"; exit 1; }
echo "== EMAIL_HOST=$NEW в .env"
cp .env ".env.bak-$(date +%Y%m%d-%H%M%S)"
{ grep -v '^EMAIL_HOST=' .env; echo "EMAIL_HOST=$NEW"; } > .env.new && chmod 600 .env.new && mv .env.new .env
docker compose up -d
CID=$(docker compose ps -q web)
for i in $(seq 1 18); do st=$(docker inspect --format '{{.State.Health.Status}}' "$CID" 2>/dev/null); echo "health: $st"; [ "$st" = healthy ] && break; sleep 5; done
docker compose exec -T web printenv EMAIL_HOST
