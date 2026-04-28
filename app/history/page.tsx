import Link from "next/link";
import { GlassCard } from "@/components/GlassCard";
import { TEMPLATES } from "@/lib/templates";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { TemplateKey } from "@/types";

export const dynamic = "force-dynamic";

interface ListItem {
  id: string;
  created_at: string;
  source_url: string;
  source_title: string;
  template_key: TemplateKey;
  model: string | null;
}

async function loadList(): Promise<{ configured: boolean; items: ListItem[]; error?: string }> {
  if (!isSupabaseConfigured()) return { configured: false, items: [] };
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("proposals")
      .select("id, created_at, source_url, source_title, template_key, model")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return { configured: true, items: (data ?? []) as ListItem[] };
  } catch (err) {
    const e = err as { code?: string; message?: string };
    let message = e?.message ?? "조회 실패";
    const tableMissing =
      e?.code === "42P01" ||
      /relation .* does not exist/i.test(message) ||
      /could not find the table/i.test(message) ||
      /schema cache/i.test(message);
    if (tableMissing) {
      message =
        "Supabase에 'proposals' 테이블이 없습니다. `npx supabase db push` 로 마이그레이션을 적용하거나, 대시보드 SQL Editor에 supabase/migrations 의 SQL을 실행해 주세요.";
    } else if (e?.code === "42501" || /permission denied/i.test(message)) {
      message = "anon role 권한이 없습니다. 마이그레이션의 GRANT 구문이 제대로 적용됐는지 확인해 주세요.";
    }
    return { configured: true, items: [], error: message };
  }
}

export default async function HistoryPage() {
  const { configured, items, error } = await loadList();

  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-20 pt-8 sm:px-10">
        <div className="flex flex-col gap-2 pt-10">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/60 px-3 py-1 text-xs font-medium text-coral-700 ring-1 ring-coral-200">
            <span className="size-1.5 rounded-full bg-coral-500" />
            히스토리
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">최근 만든 제안서</h1>
          <p className="text-sm text-ink-500">
            생성된 제안서는 자동으로 저장되며, 최신순으로 최대 50개까지 보여집니다.
          </p>
        </div>

        <div className="mt-8">
          {!configured && <NotConfigured />}
          {configured && error && (
            <GlassCard className="p-6">
              <p className="text-sm text-red-700">{error}</p>
            </GlassCard>
          )}
          {configured && !error && items.length === 0 && <Empty />}
          {configured && !error && items.length > 0 && <List items={items} />}
        </div>
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="mx-auto mt-6 flex w-full max-w-6xl items-center justify-between px-6 sm:px-10">
      <Link href="/" className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-ink-900 font-mono text-lg font-semibold text-coral-300">
          ¶
        </div>
        <div className="leading-tight">
          <div className="text-sm font-medium text-ink-500">AI Proposal</div>
          <div className="text-base font-semibold tracking-tight">Generator</div>
        </div>
      </Link>
      <nav className="hidden items-center gap-1 sm:flex">
        <NavLink href="/">홈</NavLink>
        <NavLink href="/history" active>
          히스토리
        </NavLink>
        <NavLink href="/settings">프롬프트 설정</NavLink>
      </nav>
    </header>
  );
}

function NavLink({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-2 text-sm transition-colors ${
        active
          ? "bg-white/70 text-ink-900 shadow-sm"
          : "text-ink-500 hover:bg-white/40 hover:text-ink-900"
      }`}
    >
      {children}
    </Link>
  );
}

function List({ items }: { items: ListItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const tpl = TEMPLATES.find((t) => t.key === item.template_key);
        return (
          <Link key={item.id} href={`/history/${item.id}`} className="group">
            <GlassCard className="flex h-full flex-col gap-3 p-6 transition-transform group-hover:-translate-y-0.5 group-hover:shadow-glass-lg">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-coral-100 px-2.5 py-1 text-xs font-medium text-coral-700">
                  {tpl?.label ?? item.template_key}
                </span>
                <span className="text-xs text-ink-500">{formatDate(item.created_at)}</span>
              </div>
              <h3 className="line-clamp-2 text-base font-semibold leading-snug text-ink-900">
                {item.source_title}
              </h3>
              <div className="mt-auto truncate text-xs text-ink-500">{item.source_url}</div>
            </GlassCard>
          </Link>
        );
      })}
    </div>
  );
}

function Empty() {
  return (
    <GlassCard className="flex flex-col items-center gap-3 p-12 text-center">
      <div className="text-base font-semibold">아직 저장된 제안서가 없습니다.</div>
      <p className="text-sm text-ink-500">
        홈에서 URL과 양식을 선택해 첫 번째 제안서를 만들어 보세요.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex items-center gap-2 rounded-full bg-coral-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(255,107,71,0.35)] transition-all hover:bg-coral-600"
      >
        제안서 만들러 가기
      </Link>
    </GlassCard>
  );
}

function NotConfigured() {
  return (
    <GlassCard className="flex flex-col gap-3 p-8">
      <div className="text-base font-semibold">Supabase가 아직 연결되지 않았습니다.</div>
      <p className="text-sm text-ink-700">히스토리를 사용하려면 다음 단계가 필요합니다.</p>
      <ol className="ml-4 list-decimal text-sm text-ink-700">
        <li>
          <a href="https://supabase.com" target="_blank" className="text-coral-600 underline">
            Supabase
          </a>
          에서 새 프로젝트 생성
        </li>
        <li>
          Project Settings &gt; API 에서 <code className="rounded bg-coral-50 px-1.5 py-0.5 text-coral-700">Project URL</code> 과{" "}
          <code className="rounded bg-coral-50 px-1.5 py-0.5 text-coral-700">anon public key</code> 복사
        </li>
        <li>
          프로젝트 루트의 <code className="rounded bg-coral-50 px-1.5 py-0.5 text-coral-700">.env.local</code> 에 두 값 등록
        </li>
        <li>
          Supabase 대시보드 &gt; SQL Editor 에서{" "}
          <code className="rounded bg-coral-50 px-1.5 py-0.5 text-coral-700">supabase/schema.sql</code>{" "}
          내용을 실행하여 테이블 생성
        </li>
      </ol>
      <p className="text-xs text-ink-500">
        설정 전에도 제안서 생성은 정상 동작합니다 — 저장만 안 될 뿐입니다.
      </p>
    </GlassCard>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
