/**
 * Applies pending SQL migrations via Supabase Management API.
 * Requires: SUPABASE_ACCESS_TOKEN (Personal Access Token from supabase.com/dashboard/account/tokens)
 * Usage: node scripts/run-remote-migrations.mjs
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "curzpvrglfdlujvffvex";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!TOKEN) {
  console.error("SUPABASE_ACCESS_TOKEN is required. Run: npx supabase login");
  console.error("Or set token from https://supabase.com/dashboard/account/tokens");
  process.exit(1);
}

const files = ["002_journal_letters.sql", "003_profile_locale.sql"];

async function runQuery(query) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${res.status}: ${text}`);
  }
  return text;
}

for (const file of files) {
  const sql = readFileSync(join(__dirname, "..", "supabase", "migrations", file), "utf8");
  console.log(`Applying ${file}...`);
  await runQuery(sql);
  console.log(`OK: ${file}`);
}

console.log("All migrations applied.");
