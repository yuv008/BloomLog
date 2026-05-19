# Bloomlog — Cursor plugins

## MCP servers (project)

Configured in [`.cursor/mcp.json`](./mcp.json):

| Server | URL | Purpose |
|--------|-----|---------|
| **Supabase** | `https://mcp.supabase.com/mcp` | SQL, migrations, Edge Functions, types |
| **Vercel** | `https://mcp.vercel.com` | Deployments, env vars, project settings |

### Enable

1. Restart Cursor (or **Developer: Reload Window**).
2. Open **Settings → Cursor Settings → Tools & MCP**.
3. Confirm **supabase** and **vercel** show as connected (green).
4. First use: complete OAuth in the browser when prompted.

### Optional: scope Supabase to this project

After creating a Supabase project, add your project ref to the URL in `mcp.json`:

```json
"supabase": {
  "url": "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF&read_only=false"
}
```

Use `read_only=true` when pointing at production-like data.

## Marketplace plugins (install in Cursor UI)

From **Cursor → Marketplace**, also install:

- **Supabase** — MCP + Postgres/agent skills ([supabase-community/cursor-plugin](https://github.com/supabase-community/cursor-plugin))
- **Vercel** — deploy, env, and platform skills

## VS Code extensions (recommended)

See [`.vscode/extensions.json`](../.vscode/extensions.json). Cursor will prompt to install **Supabase** and **Vercel** extensions when you open the workspace.
