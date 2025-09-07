import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { plan } = await req.json();
    if (!plan) return NextResponse.json({ error: "plan required" }, { status: 400 });

    // ensure session exists
    const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const cookieHeader = cookies().getAll().map((c) => `${c.name}=${c.value}`).join("; ");
    const sessRes = await fetch(`${base}/api/auth/session`, { headers: { cookie: cookieHeader }, cache: "no-store" });
    if (!sessRes.ok) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    const session = await sessRes.json();
    const email = session?.user?.email as string | undefined;
    if (!email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    const be = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const resp = await fetch(`${be}/api/subscriptions/start/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": process.env.BACKEND_API_KEY || "dev-frontend-sync",
      },
      body: JSON.stringify({ plan, email }),
      cache: "no-store",
    });
    if (!resp.ok) {
      return NextResponse.json({ error: await resp.text() }, { status: 400 });
    }
    const data = await resp.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

