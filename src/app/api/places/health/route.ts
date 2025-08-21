// src/app/api/places/health/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const base = process.env.NEST_API_URL;
  const res = await fetch(`${base}/places/health`, { cache: "no-store" });
  const text = await res.text().catch(() => "");
  try {
    const json = text ? JSON.parse(text) : {};
    return NextResponse.json(json, { status: res.status });
  } catch {
    // if Nest returned plain text
    return new NextResponse(text || "", {
      status: res.status,
      headers: { "content-type": "text/plain" },
    });
  }
}
