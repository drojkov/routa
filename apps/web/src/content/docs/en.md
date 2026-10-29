# Documentation

{{brand}} gives you one API key and one balance for every model in the catalog. The API is OpenAI-compatible: any SDK or tool that works with OpenAI works with {{brand}} — change the base URL and the key.

## Quick start

1. [Create an API key](/dashboard/keys?create=1) in your dashboard. New accounts get a welcome credit to try things out.
2. Pick a model in the [catalog](/models) and copy its ID, for example `deepseek/deepseek-v3.1`.
3. Send a request:

```bash
curl {{baseUrl}}/chat/completions \
  -H "Authorization: Bearer sk-harvanera-YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek/deepseek-v3.1",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

The same with the official OpenAI SDK:

```python
from openai import OpenAI

client = OpenAI(base_url="{{baseUrl}}", api_key="sk-harvanera-YOUR_KEY")
response = client.chat.completions.create(
    model="deepseek/deepseek-v3.1",
    messages=[{"role": "user", "content": "Hello!"}],
)
print(response.choices[0].message.content)
```

```js
import OpenAI from "openai";

const client = new OpenAI({ baseURL: "{{baseUrl}}", apiKey: "sk-harvanera-YOUR_KEY" });
const response = await client.chat.completions.create({
  model: "deepseek/deepseek-v3.1",
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(response.choices[0].message.content);
```

Prefer to try first? Use the [chat in your dashboard](/dashboard/chat) — it runs on the same balance and shows the cost of every reply.

## Models and keys

You don't buy models separately. One key works with every available model: the model is chosen **per request** with the `model` field, and you pay only for the tokens of the model you called.

- The list of models with prices: `GET {{baseUrl}}/models` (no key needed) or the [catalog](/models).
- Models marked *temporarily unavailable* return `503 model_unavailable`. Their IDs are reserved, so your code will start working without changes once they are connected.
- A key can be restricted to specific models, capped with a monthly spend limit, or paused — see [API keys](/dashboard/keys).

## Streaming

Set `"stream": true` to receive the reply as Server-Sent Events, exactly as with OpenAI. To get token usage in the last chunk, add `"stream_options": {"include_usage": true}`.

```python
stream = client.chat.completions.create(
    model="qwen/qwen3-coder",
    messages=[{"role": "user", "content": "Write a haiku about APIs"}],
    stream=True,
)
for chunk in stream:
    if chunk.choices and chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
```

If you stop reading a stream midway, you are charged only for the tokens generated before the disconnect.

## Pricing and balance

- Prices are per 1M input and output tokens and are listed on each model's page. Your balance is kept in USD and shown in the currency you choose.
- Every response has an `x-request-id` header; non-streaming responses also have `x-cost-usd` with the exact charge.
- Check the balance from code: `GET {{baseUrl}}/balance` with your key.
- Before each request we check that the balance covers the worst case (the prompt plus `max_tokens` of output). If it doesn't, the API returns `402 insufficient_balance`. Setting `max_tokens` lowers that estimate.
- Every request, with its model, tokens and cost, is listed on the [Activity](/dashboard/activity) page and can be exported to CSV.

## Errors

Errors use the OpenAI format: `{"error": {"message": "...", "type": "...", "code": "..."}}`.

| Status | Code | What to do |
|---|---|---|
| 400 | `invalid_request` | Fix the request body: it must be JSON with a non-empty `messages` array. |
| 401 | `invalid_api_key` | The key is wrong, revoked or paused. |
| 402 | `insufficient_balance` | Top up the balance or lower `max_tokens`. |
| 402 | `key_limit_exceeded` | The key reached its monthly limit — raise it on the API keys page. |
| 403 | `model_not_allowed` | The key is restricted to other models. |
| 403 | `key_blocked` | The key was blocked by Harvanera. Contact info@harvanera.com. |
| 403 | `account_suspended` | The account is suspended or closed. Contact info@harvanera.com. |
| 404 | `model_not_found` | Check the model ID against `GET /v1/models`. |
| 429 | `rate_limited` | Too many requests — retry after the `Retry-After` header. |
| 429 | `key_paused` | The key is paused after many failed requests in a row; wait and fix the requests. |
| 502 | `upstream_error` | The model provider failed. Retry — we already tried the backup providers. |
| 503 | `model_unavailable` | The model is temporarily unavailable. |

## Limits

- 60 requests per minute per key by default.
- After 20 failed requests (4xx) within a minute the key is paused: for 1 minute, then 10 minutes, 1 hour and 12 hours if it keeps happening. This protects your balance from runaway scripts.

## Integrations

Anything that supports an *OpenAI-compatible* provider works. You always need three things: the base URL `{{baseUrl}}`, your key and the model ID.

- **Cursor** — Settings → Models: enter the key in *OpenAI API Key*, enable *Override OpenAI Base URL* and set it to the base URL, then add the model ID.
- **Cline / Roo Code** — API Provider: *OpenAI Compatible*; Base URL, API Key and Model ID as above.
- **n8n** — create *OpenAI* credentials and set *Base URL* to the base URL; pick the model ID in the node.
- **LangChain** — `ChatOpenAI(base_url="{{baseUrl}}", api_key="sk-harvanera-…", model="deepseek/deepseek-v3.1")`.

Menu names in third-party tools change between versions; if something doesn't match, look for "OpenAI-compatible" or "custom base URL" in the tool's settings.
