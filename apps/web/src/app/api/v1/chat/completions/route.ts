import { newRequestId, runChat } from "@/lib/gateway/chat";
import { apiError } from "@/lib/gateway/errors";
import { authenticate } from "@/lib/gateway/meter";

/** POST /v1/chat/completions — OpenAI-совместимый, со стримом. Платит владелец ключа. */
export async function POST(request: Request) {
  const requestId = newRequestId();
  const actor = await authenticate(request);
  if (!actor) return apiError("invalid_api_key", requestId);
  if (actor === "suspended") return apiError("account_suspended", requestId);
  return runChat(request, actor, requestId);
}
