import { NextResponse } from "next/server";
import { streamOpenRouter } from "@/lib/openrouter";
import { buildUserMessage, loadDefaultSystemPrompt } from "@/lib/prompts";
import type { TemplateKey } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface GenerateRequest {
  scrapedTitle?: string;
  scrapedText?: string;
  scrapedUrl?: string;
  templateKey?: TemplateKey;
  customForm?: string;
  systemPromptOverride?: string;
}

export async function POST(request: Request) {
  let body: GenerateRequest;
  try {
    body = (await request.json()) as GenerateRequest;
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  const { scrapedTitle, scrapedText, scrapedUrl, templateKey, customForm, systemPromptOverride } =
    body;

  const missing: string[] = [];
  if (!scrapedTitle?.trim()) missing.push("scrapedTitle");
  if (!scrapedText?.trim()) missing.push("scrapedText");
  if (!scrapedUrl?.trim()) missing.push("scrapedUrl");
  if (!templateKey) missing.push("templateKey");
  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: `다음 필드가 비어 있습니다: ${missing.join(", ")}. 본문을 다시 추출하거나 다른 URL을 시도해 주세요.`,
      },
      { status: 400 },
    );
  }

  const userMessage = buildUserMessage({
    scrapedTitle: scrapedTitle as string,
    scrapedText: scrapedText as string,
    scrapedUrl: scrapedUrl as string,
    templateKey: templateKey as TemplateKey,
    customForm,
  });

  const systemPrompt = systemPromptOverride?.trim() || (await loadDefaultSystemPrompt());

  try {
    const tokenStream = await streamOpenRouter({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      maxTokens: 2048,
    });

    const encoder = new TextEncoder();
    const reader = tokenStream.getReader();
    const responseStream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        const { value, done } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        controller.enqueue(encoder.encode(value));
      },
      cancel() {
        reader.cancel().catch(() => {});
      },
    });

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "제안서 생성에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
