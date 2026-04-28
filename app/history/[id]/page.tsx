import Link from "next/link";
import { notFound } from "next/navigation";
import { GlassCard } from "@/components/GlassCard";
import { MarkdownView } from "@/components/MarkdownView";
import { TEMPLATES } from "@/lib/templates";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { ProposalRecord } from "@/types";
import { CopyButton } from "@/components/CopyButton";

export const dynamic = "force-dynamic";

async function loadProposal(id: string): Promise<ProposalRecord | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabase();
  const { data, error } = await supabase.from("proposals").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return data as ProposalRecord;
}

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const proposal = await loadProposal(id);
  if (!proposal) notFound();

  const tpl = TEMPLATES.find((t) => t.key === proposal.template_key);

  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-20 pt-8 sm:px-10">
        <div className="pt-8">
          <Link href="/history" className="text-xs text-ink-500 hover:text-ink-900">
            ← 히스토리로
          </Link>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-coral-100 px-2.5 py-1 text-xs font-medium text-coral-700">
              {tpl?.label ?? proposal.template_key}
            </span>
            <span className="text-xs text-ink-500">{formatDate(proposal.created_at)}</span>
            {proposal.model && (
              <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs text-ink-500 ring-1 ring-white/80 font-mono">
                {proposal.model}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {proposal.source_title}
          </h1>
          <a
            href={proposal.source_url}
            target="_blank"
            className="truncate text-sm text-coral-600 underline"
          >
            {proposal.source_url}
          </a>
        </div>

        <div className="mt-8">
          <GlassCard variant="strong" className="p-7 sm:p-9">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">제안서 본문</h2>
              <CopyButton text={proposal.result_md} />
            </div>
            <MarkdownView content={proposal.result_md} />
          </GlassCard>
        </div>
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="mx-auto mt-6 flex w-full max-w-5xl items-center justify-between px-6 sm:px-10">
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
        <Link href="/" className="rounded-full px-4 py-2 text-sm text-ink-500 hover:bg-white/40">
          홈
        </Link>
        <Link
          href="/history"
          className="rounded-full bg-white/70 px-4 py-2 text-sm text-ink-900 shadow-sm"
        >
          히스토리
        </Link>
        <Link
          href="/settings"
          className="rounded-full px-4 py-2 text-sm text-ink-500 hover:bg-white/40"
        >
          프롬프트 설정
        </Link>
      </nav>
    </header>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
