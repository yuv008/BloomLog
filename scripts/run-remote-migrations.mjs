/**
 * Applies SQL migrations via Supabase Management API (for CI / no linked CLI).
 *
 * Preferred for local dev after `npx supabase login`:
 *   npm run supabase:migrate:remote
 *   (runs `supabase db push` — uses CLI session, not this script)
 *
 * This script requires SUPABASE_ACCESS_TOKEN from:
 * https://supabase.com/dashboard/account/tokens
 *
 * Usage: SUPABASE_ACCESS_TOKEN=sbp_... npm run supabase:migrate:remote:api
 */
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "curzpvrglfdlujvffvex";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN?.trim();

if (!TOKEN) {
  console.error("SUPABASE_ACCESS_TOKEN is not set.");
  console.error("");
  console.error("For local development, use the CLI instead (after `npx supabase login`):");
  console.error("  npm run supabase:migrate:remote");
  console.error("");
  console.error("For CI or API-only runs, create a Personal Access Token at:");
  console.error("  https://supabase.com/dashboard/account/tokens");
  console.error("Then in PowerShell:");
  console.error('  $env:SUPABASE_ACCESS_TOKEN = "sbp_your_token"');
  console.error("  npm run supabase:migrate:remote:api");
  process.exit(1);
}

const migrationsDir = join(__dirname, "..", "supabase", "migrations");
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

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
  const sql = readFileSync(join(migrationsDir, file), "utf8");
  console.log(`Applying ${file}...`);
  await runQuery(sql);
  console.log(`OK: ${file}`);
}

console.log("All migrations applied.");
