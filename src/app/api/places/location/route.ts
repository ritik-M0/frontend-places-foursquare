// src/app/api/places/location/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const base = process.env.NEST_API_URL || "http://localhost:3000";
  const res = await fetch(`${base}/places/location`, { cache: "no-store" });
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
