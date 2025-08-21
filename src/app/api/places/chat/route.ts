// src/app/api/places/chat/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const base = process.env.NEST_API_URL || "http://localhost:3000";
  // expect client to send JSON { message: string, sessionId?: string }
  const payload = await req.json().catch(() => null);

  // forward to Nest as JSON
  const res = await fetch(`${base}/places/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text().catch(() => "");
  try {
    const json = text ? JSON.parse(text) : {};
    return NextResponse.json(json, { status: res.status });
  } catch {
    return new NextResponse(text || "", {
      status: res.status,
      headers: { "content-type": "text/plain" },
    });
  }
}
