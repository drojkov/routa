# Диагностика почты на сервере витрин — только чтение. Запускается ручной задачей mail-check в CI:
#   ssh deploy "cd $DEPLOY_PATH && sh -s" < deploy/mail-check.sh
HOST=mail.harvanera.com
echo "== сервер: $(hostname), IP: $(hostname -I 2>/dev/null)"
echo "== внешний IP: $(wget -qO- -T 5 https://api.ipify.org 2>/dev/null || curl -s -m 5 https://api.ipify.org)"
echo "== $HOST резолвится в: $(getent hosts $HOST)"
echo "== порты с хоста:"
for p in 587 465 2525 25; do
  if command -v nc >/dev/null; then nc -z -w 5 $HOST $p && echo "  $p open" || echo "  $p closed"
  else timeout 5 sh -c "cat < /dev/null > /dev/tcp/$HOST/$p" 2>/dev/null && echo "  $p open" || echo "  $p closed/unknown"; fi
done
echo "== порты из контейнера web:"
docker compose exec -T web node -e '
const net = require("net"); const host = "mail.harvanera.com";
(async () => { for (const p of [587, 465, 2525, 25]) await new Promise((r) => {
  const s = net.connect(p, host); s.setTimeout(5000);
  s.on("connect", () => { console.log("  " + p + " open"); s.destroy(); r(); });
  s.on("timeout", () => { console.log("  " + p + " timeout"); s.destroy(); r(); });
  s.on("error", (e) => { console.log("  " + p + " " + e.code); r(); });
}); })();'
echo "== EMAIL_* в .env (без значений):"
grep -oE '^EMAIL_[A-Z_]+=' .env | tr '\n' ' '; echo
grep -E '^EMAIL_(HOST|PORT)=' .env
echo "== строки [email] из логов за 2 часа:"
docker compose logs --since 2h web 2>&1 | grep '\[email\]' | tail -20
