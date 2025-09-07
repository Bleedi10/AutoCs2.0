import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const cookieHeader = cookies().getAll().map((c) => `${c.name}=${c.value}`).join("; ");
    const sessRes = await fetch(`${base}/api/auth/session`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    if (!sessRes.ok) return NextResponse.json({ authenticated: false });
    const session = await sessRes.json();
    const email = session?.user?.email as string | undefined;
    if (!email) return NextResponse.json({ authenticated: false });

    const be = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const url = new URL("/api/user/status/", be);
    url.searchParams.set("email", email);
    const statusRes = await fetch(url.toString(), {
      headers: { "X-Api-Key": process.env.BACKEND_API_KEY || "dev-frontend-sync" },
      cache: "no-store",
    });
    if (!statusRes.ok) return NextResponse.json({ authenticated: true, email });
    const data = await statusRes.json();
    return NextResponse.json({
      authenticated: true,
      email,
      plan_name: data?.plan?.name || "",
      has_active_plan: Boolean(data?.plan),
    });
  } catch (e) {
    return NextResponse.json({ authenticated: false });
  }
}

