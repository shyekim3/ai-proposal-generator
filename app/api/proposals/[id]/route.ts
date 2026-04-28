import { NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase가 설정되지 않았습니다." }, { status: 503 });
  }
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "제안서를 찾을 수 없습니다." }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "제안서 조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase가 설정되지 않았습니다." }, { status: 503 });
  }
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from("proposals").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "제안서 삭제 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
