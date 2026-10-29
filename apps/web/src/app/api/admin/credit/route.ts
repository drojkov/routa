import { timingSafeEqual } from "node:crypto";
import { creditPayment } from "@/lib/payments";

/**
 * Служебное зачисление заказа (счёт для компании оплачен — Terms §5.2). Вызывает `npm run account invoice-paid <id>`
 * изнутри сервера. Без ADMIN_TOKEN адреса нет (404). Тот же creditPayment, что у вебхука: проводка + письмо клиенту.
 */
export async function POST(request: Request) {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return new Response("Not found", { status: 404 });
  const given = Buffer.from((request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, ""));
  const want = Buffer.from(token);
  if (given.length !== want.length || !timingSafeEqual(given, want)) return new Response("Forbidden", { status: 403 });
  const { paymentId, provider } = (await request.json().catch(() => ({}))) as { paymentId?: string; provider?: string };
  if (!paymentId) return Response.json({ ok: false, error: "paymentId" }, { status: 400 });
  return Response.json(creditPayment(paymentId, provider ?? "invoice"));
}
