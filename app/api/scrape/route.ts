import { NextResponse } from "next/server";
import { scrapeUrl } from "@/lib/scraper";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  if (!body.url || typeof body.url !== "string") {
    return NextResponse.json({ error: "url 필드가 필요합니다." }, { status: 400 });
  }

  try {
    const result = await scrapeUrl(body.url);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "스크래핑 실패";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
