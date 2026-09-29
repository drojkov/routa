import { MODELS } from "@/lib/site";

/**
 * GET /v1/models — формат OpenAI плюс цены (SPEC §7). Публичный, без ключа.
 * Модели «скоро» (GPT, Claude…) тоже в списке, с available: false — клиент видит, что они появятся.
 */
export function GET() {
  const data = MODELS.map((m) => ({
    id: m.id,
    object: "model",
    created: 0,
    owned_by: m.vendor.toLowerCase(),
    name: m.name,
    available: m.available,
    context_length: m.context,
    pricing: { currency: "USD", unit: "1M tokens", input: m.priceIn, output: m.priceOut },
  }));
  return Response.json({ object: "list", data }, { headers: { "cache-control": "public, max-age=300" } });
}
