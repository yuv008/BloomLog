import { readFileSync } from "fs";

const key = readFileSync(".env.local", "utf8")
  .match(/GROQ_API_KEY=(.+)/)?.[1]
  ?.trim();
if (!key) {
  console.error("NO_KEY");
  process.exit(1);
}

const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: 'Reply JSON only: {"ok":true}' }],
    max_tokens: 50,
    response_format: { type: "json_object" },
  }),
});
const data = await res.json();
if (data.error) {
  console.error("GROQ_ERR", data.error.message);
  process.exit(1);
}
console.log("GROQ_OK", data.choices?.[0]?.message?.content);
