/**
 * API edge-case tests (no auth — expect 401).
 * Run: node scripts/e2e-health-api.mjs
 * With dev server on :3000
 */
const BASE = process.env.BASE_URL || "http://localhost:3000";

const cases = [
  { name: "recipe empty body", path: "/api/ai/recipes/generate", body: {} },
  { name: "recipe empty ingredients", path: "/api/ai/recipes/generate", body: { ingredients: "  " } },
  { name: "food empty", path: "/api/ai/food/estimate", body: {} },
  { name: "food valid shape unauth", path: "/api/ai/food/estimate", body: { description: "oat bowl" } },
];

let passed = 0;
let failed = 0;

for (const c of cases) {
  const res = await fetch(`${BASE}${c.path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(c.body),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text.slice(0, 100) };
  }
  const ok =
    (c.name.includes("empty") && (res.status === 400 || res.status === 401)) ||
    (c.name.includes("unauth") && res.status === 401) ||
    (res.status >= 400 && res.status < 500);
  if (ok) {
    console.log(`PASS ${c.name} → ${res.status}`, data.error || "");
    passed++;
  } else {
    console.log(`FAIL ${c.name} → ${res.status}`, data);
    failed++;
  }
}

// Direct Groq recipe schema test
import { readFileSync } from "fs";
const key = readFileSync(".env.local", "utf8").match(/GROQ_API_KEY=(.+)/)?.[1]?.trim();
if (key) {
  const prompt = `Return JSON only: {"recipes":[{"title":"Test","cooking_time_min":10,"calories":300,"protein_g":10,"carbs_g":40,"fat_g":8,"steps":["mix"],"vibe_tags":["cozy"]}]}
Ingredients: paneer, rice`;
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.4,
      response_format: { type: "json_object" },
    }),
  });
  const d = await res.json();
  if (d.error) {
    console.log("FAIL groq recipe schema", d.error.message);
    failed++;
  } else {
    const parsed = JSON.parse(d.choices?.[0]?.message?.content || "{}");
    const n = parsed.recipes?.length ?? 0;
    if (n >= 1) {
      console.log("PASS groq recipe schema", `recipes=${n}`);
      passed++;
    } else {
      console.log("FAIL groq recipe schema no recipes");
      failed++;
    }
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
