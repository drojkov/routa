/** Ошибки в формате OpenAI (SPEC §7): { error: { message, type, code } }. */
export const ERRORS = {
  invalid_api_key: { status: 401, type: "authentication_error", message: "Invalid API key." },
  insufficient_balance: { status: 402, type: "billing_error", message: "Insufficient balance. Top up in the dashboard." },
  key_limit_exceeded: { status: 402, type: "billing_error", message: "This key has reached its monthly spend limit." },
  invalid_request: { status: 400, type: "invalid_request_error", message: "Invalid request body." },
  model_not_allowed: { status: 403, type: "permission_error", message: "This key is not allowed to use this model." },
  model_not_found: { status: 404, type: "invalid_request_error", message: "Model not found. See GET /v1/models." },
  rate_limited: { status: 429, type: "rate_limit_error", message: "Too many requests. Slow down and retry." },
  key_paused: { status: 429, type: "rate_limit_error", message: "Key paused after too many failed requests." },
  upstream_error: { status: 502, type: "api_error", message: "Upstream provider error. Please retry." },
  model_unavailable: { status: 503, type: "api_error", message: "Model is temporarily unavailable." },
} as const;

export type ErrorCode = keyof typeof ERRORS;

export function apiError(code: ErrorCode, requestId: string, opts: { message?: string; retryAfter?: number } = {}) {
  const e = ERRORS[code];
  const headers: Record<string, string> = { "x-request-id": requestId, "cache-control": "no-store" };
  if (opts.retryAfter) headers["retry-after"] = String(Math.ceil(opts.retryAfter));
  return Response.json({ error: { message: opts.message ?? e.message, type: e.type, code } }, { status: e.status, headers });
}
