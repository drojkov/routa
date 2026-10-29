import { getBalanceMicros } from "@/lib/account";
import { apiError } from "@/lib/gateway/errors";
import { authenticate } from "@/lib/gateway/meter";

/** GET /v1/balance — баланс аккаунта, которому принадлежит ключ, в USD. */
export async function GET(request: Request) {
  const requestId = `req_${crypto.randomUUID().replaceAll("-", "")}`;
  const key = await authenticate(request);
  if (!key) return apiError("invalid_api_key", requestId);
  if (key === "suspended") return apiError("account_suspended", requestId);
  const micros = await getBalanceMicros(key.userId);
  return Response.json(
    { balance: micros / 1_000_000, currency: "USD" },
    { headers: { "x-request-id": requestId, "cache-control": "no-store" } },
  );
}
