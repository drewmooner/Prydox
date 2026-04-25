import { NextResponse } from "next/server";

/**
 * Development-only: prints client-side tx errors to the Next.js terminal.
 * Not available in production.
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  try {
    const body = await req.json();
    console.log("[browser → server]", JSON.stringify(body, null, 2));
  } catch {
    console.log("[browser → server] (invalid JSON body)");
  }
  return NextResponse.json({ ok: true });
}
