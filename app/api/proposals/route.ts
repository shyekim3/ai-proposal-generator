import { NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { TemplateKey } from "@/types";

export const runtime = "nodejs";

interface CreateBody {
  source_url?: string;
  source_title?: string;
  template_key?: TemplateKey;
  custom_form?: string | null;
  result_md?: string;
  model?: string | null;
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ items: [], configured: false });
  }
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("proposals")
      .select("id, created_at, source_url, source_title, template_key, model")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return NextResponse.json({ items: data ?? [], configured: true });
  } catch (err) {
    const message = formatSupabaseError(err, "히스토리 조회");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function formatSupabaseError(err: unknown, action: string): string {
  if (err && typeof err === "object" && "message" in err) {
    const e = err as { message?: string; code?: string; hint?: string };
    const msg = e.message ?? "";
    const tableMissing =
      e.code === "42P01" ||
      /relation .* does not exist/i.test(msg) ||
      /could not find the table/i.test(msg) ||
      /schema cache/i.test(msg);
    if (tableMissing) {
      return `${action} 실패: Supabase에 'proposals' 테이블이 없습니다. \`npx supabase db push\` 로 마이그레이션을 적용하거나, 대시보드 > SQL Editor 에서 supabase/migrations 의 SQL을 실행해 주세요.`;
    }
    if (e.code === "42501" || /permission denied/i.test(msg)) {
      return `${action} 실패: anon role 권한이 없습니다. 마이그레이션의 GRANT 구문이 제대로 적용됐는지 확인해 주세요.`;
    }
    return `${action} 실패: ${msg || "알 수 없는 오류"}`;
  }
  return `${action} 실패`;
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase 환경변수가 설정되지 않았습니다." },
      { status: 503 },
    );
  }

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  const required: (keyof CreateBody)[] = ["source_url", "source_title", "template_key", "result_md"];
  const missing = required.filter((k) => !body[k] || (typeof body[k] === "string" && !(body[k] as string).trim()));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `다음 필드가 필요합니다: ${missing.join(", ")}` },
      { status: 400 },
    );
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("proposals")
      .insert({
        source_url: body.source_url,
        source_title: body.source_title,
        template_key: body.template_key,
        custom_form: body.custom_form ?? null,
        result_md: body.result_md,
        model: body.model ?? null,
      })
      .select("id, created_at")
      .single();
    if (error) throw error;
    return NextResponse.json({ id: data.id, created_at: data.created_at });
  } catch (err) {
    const message = formatSupabaseError(err, "제안서 저장");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
