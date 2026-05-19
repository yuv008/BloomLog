import { NextResponse } from "next/server";

/**
 * One-time setup: enables anonymous auth on the Bloomlog Supabase project.
 * Requires SUPABASE_ACCESS_TOKEN in Vercel env (Personal Access Token).
 */
export async function POST(request: Request) {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const projectRef =
    process.env.SUPABASE_PROJECT_REF ?? "curzpvrglfdlujvffvex";

  if (!token) {
    return NextResponse.json(
      {
        error:
          "SUPABASE_ACCESS_TOKEN not set. Enable manually in Supabase dashboard → Authentication → Providers → Anonymous.",
      },
      { status: 501 }
    );
  }

  const secret = request.headers.get("x-setup-secret");
  if (secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ external_anonymous_users_enabled: true }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: text }, { status: res.status });
  }

  return NextResponse.json({ ok: true, projectRef });
}
