# Команды поддержки на сервере витрин. Запуск — задача support в CI с переменной SUPPORT_CMD, например:
#   glab ci run -b dev --variables-env SUPPORT_CMD:'account verify-email x@example.com'
# На сервере: ssh deploy "cd $DEPLOY_PATH && sh -s -- <команда> <аргументы>" < deploy/support.sh
script="$1"; shift
case "$script" in
  account|refund|contact|notice|evidence|db:backup) ;;
  *) echo "Разрешены: account refund contact notice evidence db:backup (получено: '$script')"; exit 1 ;;
esac
exec docker compose exec -T web npm run --silent "$script" -- "$@"
