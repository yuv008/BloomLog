# Bloomlog

A soft daily companion for mood, water, mindful spending, food journaling, and tiny wins.

## Stack

- Next.js 16 (App Router)
- Tailwind CSS v4
- Framer Motion
- Supabase (optional — works offline with localStorage)
- PWA via `@ducanh2912/next-pwa`

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Cursor plugins (Supabase + Vercel)

MCP servers are configured in [`.cursor/mcp.json`](.cursor/mcp.json). After opening the project:

1. **Reload Cursor** → **Settings → Tools & MCP**
2. Enable **supabase** and **vercel** (OAuth in browser on first use)
3. Optional: install the **Supabase** marketplace plugin and VS Code extension when prompted

See [`.cursor/PLUGINS.md`](.cursor/PLUGINS.md) for project scoping and security notes.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. Link CLI: `npx supabase link --project-ref YOUR_REF`
3. Push schema: `npm run supabase:db:push` (or run `supabase/migrations/001_initial_schema.sql` in the SQL editor)
4. Enable **Anonymous sign-ins** in Authentication → Providers
5. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`
6. Local stack (optional): `npm run supabase:start`

## Deploy (Vercel)

```bash
npm run vercel:link   # first time
npm run vercel:deploy:prod
```

Set environment variables in the Vercel dashboard (or via Vercel MCP). PWA builds automatically in production.

## Alpha study

Invite 15 users for a 4-week diary. Track: *"how did opening Bloomlog make you feel today?"* (one word).

## License

Private — Bloomlog alpha.
