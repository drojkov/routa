import "server-only";
import type Database from "better-sqlite3";
import { sendEmail } from "@/lib/email";
import { COMPANY } from "@/lib/site";

/**
 * AUP §4: «unusual patterns in request metadata (request volume, error rates or spending)».
 * Раз в час смотрим журнал запросов за последний час и пишем в поддержку (info@) об аккаунтах,
 * у которых необычный расход или много отказов. Ничего не блокируем — решает поддержка
 * (`npm run account suspend|block-key …`).
 */
const SPEND_ALERT_USD = Number(process.env.SPEND_ALERT_USD ?? 20);
const ERROR_ALERT_MIN_REQUESTS = 50;
const ERROR_ALERT_SHARE = 0.5;

/** Одно письмо на аккаунт и правило в сутки (в памяти процесса — после перезапуска может повториться). */
const g = globalThis as unknown as { __usageAlertsSent?: Set<string> };
const sent = (g.__usageAlertsSent ??= new Set<string>());

type Row = { user_id: string; email: string; requests: number; errors: number; cost: number };

export async function checkUsageAnomalies(sqlite: Database.Database) {
  const since = Date.now() - 3_600_000;
  const rows = sqlite
    .prepare(
      `select r.user_id, u.email, count(*) as requests,
              sum(case when r.status >= 400 and r.status < 500 then 1 else 0 end) as errors,
              sum(r.cost_micros) as cost
         from request_log r join user u on u.id = r.user_id
        where r.created_at >= ?
        group by r.user_id`,
    )
    .all(since) as Row[];

  const day = new Date().toISOString().slice(0, 10);
  const alerts: string[] = [];
  for (const r of rows) {
    const usd = r.cost / 1_000_000;
    const reasons: string[] = [];
    if (usd >= SPEND_ALERT_USD) reasons.push(`spend USD ${usd.toFixed(2)} in the last hour (threshold ${SPEND_ALERT_USD})`);
    if (r.requests >= ERROR_ALERT_MIN_REQUESTS && r.errors / r.requests >= ERROR_ALERT_SHARE)
      reasons.push(`${r.errors} of ${r.requests} requests rejected with 4xx`);
    for (const reason of reasons) {
      const key = `${r.user_id}:${reason.split(" ")[0]}:${day}`;
      if (sent.has(key)) continue;
      sent.add(key);
      alerts.push(`${r.email} (${r.user_id}): ${reason}`);
    }
  }
  if (sent.size > 10_000) sent.clear();
  if (!alerts.length) return;

  console.warn(`[monitoring] ${alerts.length} usage alert(s)`);
  const text = [
    "Unusual usage in the last hour (AUP §4). Review and act if needed:",
    "",
    ...alerts.map((a) => `- ${a}`),
    "",
    "Details: npm run account show <email>. Restrict: account suspend | block-key | block-model.",
  ].join("\n");
  await sendEmail({
    to: COMPANY.email,
    subject: `[monitoring] ${alerts.length} usage alert(s)`,
    text,
    html: `<pre style="font-family:ui-monospace,monospace;font-size:13px">${text.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>`,
  });
}
