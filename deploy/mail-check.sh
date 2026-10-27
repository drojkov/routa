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
echo "== кто слушает почтовые порты на этом хосте:"
(ss -ltnp 2>/dev/null || netstat -ltnp 2>/dev/null) | grep -E ':(25|465|587|2525)\b' || echo "  никто"
echo "== почтовые контейнеры:"
docker ps --format '{{.Names}}  {{.Image}}  {{.Ports}}' | grep -iE 'mail|postfix|smtp|exim|dovecot' || echo "  нет"
echo "== маршрут по умолчанию:"; ip route 2>/dev/null | grep default
echo "== /etc/hosts:"; grep -iE 'mail|dev-store|harvanera' /etc/hosts || echo "  ничего"
echo "== порт 587 по внутренним адресам (с хоста):"
GW=$(ip route 2>/dev/null | awk '/default/{print $3; exit}')
for h in 127.0.0.1 192.168.32.3 172.17.0.1 $GW; do
  nc -z -w 3 $h 587 2>/dev/null && echo "  $h:587 open" || echo "  $h:587 closed"
done
echo "== SMTP-приветствие по внутренним адресам:"
for h in 127.0.0.1 $GW; do printf "  $h: "; (sleep 2; printf 'QUIT\r\n') | nc -w 4 $h 587 2>/dev/null | head -1 || echo; done
