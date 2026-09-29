/**
 * Готовые примеры запроса к шлюзу — для кабинета, страницы модели и документации.
 * Один генератор, чтобы примеры везде были одинаковыми и рабочими.
 */
export const SNIPPET_LANGS = ["curl", "python", "js"] as const;
export type SnippetLang = (typeof SNIPPET_LANGS)[number];

export const SNIPPET_LABELS: Record<SnippetLang, string> = { curl: "cURL", python: "Python", js: "JavaScript" };

export function snippet(lang: SnippetLang, o: { baseUrl: string; apiKey: string; model: string; stream?: boolean }) {
  const prompt = "Hello! What can you do?";
  switch (lang) {
    case "curl":
      return `curl ${o.baseUrl}/chat/completions \\
  -H "Authorization: Bearer ${o.apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${o.model}",${o.stream ? '\n    "stream": true,' : ""}
    "messages": [{"role": "user", "content": "${prompt}"}]
  }'`;
    case "python":
      return `# pip install openai
from openai import OpenAI

client = OpenAI(
    base_url="${o.baseUrl}",
    api_key="${o.apiKey}",
)

response = client.chat.completions.create(
    model="${o.model}",
    messages=[{"role": "user", "content": "${prompt}"}],
)
print(response.choices[0].message.content)`;
    case "js":
      return `// npm install openai
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "${o.baseUrl}",
  apiKey: "${o.apiKey}",
});

const response = await client.chat.completions.create({
  model: "${o.model}",
  messages: [{ role: "user", content: "${prompt}" }],
});
console.log(response.choices[0].message.content);`;
  }
}

/** Заглушка ключа в примерах, пока пользователь не подставил свой. */
export const KEY_PLACEHOLDER = "sk-harvanera-YOUR_KEY";
