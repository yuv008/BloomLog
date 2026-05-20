/**
 * Writes .env.local with Supabase keys from CLI + generated encryption key.
 * Google OAuth values stay as REPLACE_ME until you run setup-google-env.ps1
 */
import { execSync } from "child_process";
import { randomBytes } from "crypto";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const projectRef = "curzpvrglfdlujvffvex";

const raw = execSync(
  `npx supabase projects api-keys --project-ref ${projectRef} -o json`,
  { encoding: "utf8", cwd: root }
);
const keys = JSON.parse(raw);
const anon = keys.find((k) => k.name === "anon")?.api_key;
const serviceRole = keys.find((k) => k.name === "service_role")?.api_key;
if (!anon || !serviceRole) {
  console.error("Run: npx supabase login");
  process.exit(1);
}

const encKey = randomBytes(32).toString("hex");
const content = `# Auto-generated — add Google OAuth from Cloud Console
NEXT_PUBLIC_SUPABASE_URL=https://${projectRef}.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anon}
SUPABASE_PROJECT_REF=${projectRef}
NEXT_PUBLIC_APP_URL=http://localhost:3000

SUPABASE_SERVICE_ROLE_KEY=${serviceRole}
GOOGLE_TOKEN_ENCRYPTION_KEY=${encKey}
GOOGLE_OAUTH_CLIENT_ID=REPLACE_ME.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=REPLACE_ME
`;

writeFileSync(join(root, ".env.local"), content, "utf8");
console.log("Wrote .env.local (Supabase keys + encryption key).");
console.log("Edit GOOGLE_OAUTH_* then run: npm run setup:supabase-google -- -ClientId ... -ClientSecret ...");
