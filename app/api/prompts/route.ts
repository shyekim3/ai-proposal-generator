import { NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_PROMPT_KEY } from "@/lib/prompts";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key") || DEFAULT_PROMPT_KEY;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      key,
      content: key === DEFAULT_PROMPT_KEY ? DEFAULT_SYSTEM_PROMPT : "",
      isCustom: false,
      configured: false,
      defaultContent: DEFAULT_SYSTEM_PROMPT,
    });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("system_prompts")
      .select("content, updated_at")
      .eq("key", key)
      .maybeSingle();
    if (error) throw error;

    if (data?.content) {
      return NextResponse.json({
        key,
        content: data.content,
        isCustom: true,
        updated_at: data.updated_at,
        configured: true,
        defaultContent: DEFAULT_SYSTEM_PROMPT,
      });
    }
    return NextResponse.json({
      key,
      content: key === DEFAULT_PROMPT_KEY ? DEFAULT_SYSTEM_PROMPT : "",
      isCustom: false,
      configured: true,
      defaultContent: DEFAULT_SYSTEM_PROMPT,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "프롬프트 조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase가 설정되지 않아 프롬프트를 저장할 수 없습니다." },
      { status: 503 },
    );
  }

  let body: { key?: string; content?: string };
  try {
    body = (await request.json()) as { key?: string; content?: string };
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  const key = body.key?.trim() || DEFAULT_PROMPT_KEY;
  const content = body.content?.trim();
  if (!content) {
    return NextResponse.json({ error: "content 가 비어 있습니다." }, { status: 400 });
  }

  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("system_prompts")
      .upsert(
        { key, content, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      );
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "프롬프트 저장 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase가 설정되지 않았습니다." },
      { status: 503 },
    );
  }
  const url = new URL(request.url);
  const key = url.searchParams.get("key") || DEFAULT_PROMPT_KEY;
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from("system_prompts").delete().eq("key", key);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "프롬프트 삭제 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
