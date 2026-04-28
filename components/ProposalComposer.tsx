"use client";

import { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { MarkdownView } from "@/components/MarkdownView";
import { TEMPLATES } from "@/lib/templates";
import type { ScrapeResult, TemplateKey } from "@/types";

type Status = "idle" | "scraping" | "scraped" | "generating" | "done" | "error";

export function ProposalComposer() {
  const [url, setUrl] = useState("");
  const [template, setTemplate] = useState<TemplateKey>("business");
  const [customForm, setCustomForm] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scraped, setScraped] = useState<ScrapeResult | null>(null);
  const [proposal, setProposal] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function handleScrape() {
    if (!url.trim()) return;
    setStatus("scraping");
    setErrorMsg(null);
    setScraped(null);
    setProposal("");

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "스크래핑에 실패했습니다.");
      setScraped(data as ScrapeResult);
      setStatus("scraped");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "알 수 없는 오류");
      setStatus("error");
    }
  }

  async function handleGenerate() {
    if (!scraped) return;
    if (!scraped.text?.trim() || !scraped.title?.trim()) {
      setErrorMsg(
        "추출된 본문이 비어 있어 제안서를 만들 수 없습니다. 다른 URL로 다시 본문을 추출해 주세요.",
      );
      setStatus("error");
      return;
    }
    if (template === "custom" && !customForm.trim()) {
      setErrorMsg("커스텀 양식을 사용하려면 양식 지시문을 입력해 주세요.");
      setStatus("error");
      return;
    }

    setStatus("generating");
    setErrorMsg(null);
    setProposal("");
    setSavedId(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scrapedTitle: scraped.title,
          scrapedText: scraped.text,
          scrapedUrl: scraped.url,
          templateKey: template,
          customForm: template === "custom" ? customForm : undefined,
        }),
      });

      if (!res.ok) {
        let msg = "제안서 생성에 실패했습니다.";
        try {
          const err = await res.json();
          if (err?.error) msg = err.error;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }
      if (!res.body) throw new Error("응답 본문을 읽을 수 없습니다.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setProposal(acc);
      }
      setStatus("done");

      void persistProposal({
        source_url: scraped.url,
        source_title: scraped.title,
        template_key: template,
        custom_form: template === "custom" ? customForm : null,
        result_md: acc,
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "알 수 없는 오류");
      setStatus("error");
    }
  }

  async function persistProposal(payload: {
    source_url: string;
    source_title: string;
    template_key: TemplateKey;
    custom_form: string | null;
    result_md: string;
  }) {
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedId(data.id ?? null);
      } else if (res.status !== 503) {
        // 503 = Supabase 미설정 — 무시. 그 외만 가볍게 콘솔에 표시.
        const data = await res.json().catch(() => ({}));
        console.warn("제안서 저장 실패:", data?.error ?? res.statusText);
      }
    } catch (err) {
      console.warn("제안서 저장 네트워크 오류:", err);
    }
  }

  async function handleCopy() {
    if (!proposal) return;
    try {
      await navigator.clipboard.writeText(proposal);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  function handleReset() {
    setUrl("");
    setScraped(null);
    setProposal("");
    setErrorMsg(null);
    setCustomForm("");
    setSavedId(null);
    setStatus("idle");
  }

  const isScraping = status === "scraping";
  const isGenerating = status === "generating";
  const canScrape = url.trim().length > 0 && !isScraping && !isGenerating;
  const canGenerate =
    !!scraped &&
    !!scraped.text?.trim() &&
    !!scraped.title?.trim() &&
    !isScraping &&
    !isGenerating;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
      <GlassCard variant="strong" className="p-7 sm:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">새 제안서</h2>
          <span className="rounded-full bg-coral-100 px-2.5 py-1 text-xs font-medium text-coral-700">
            {status === "done" ? "Ready" : "Draft"}
          </span>
        </div>

        <label className="mt-6 block text-sm font-medium text-ink-700">참고 URL</label>
        <div className="mt-2 flex items-center gap-2 rounded-2xl bg-white/70 p-2 ring-1 ring-white/80 focus-within:ring-coral-300">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-coral-50 text-coral-600">
            <LinkIcon />
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canScrape) {
                e.preventDefault();
                handleScrape();
              }
            }}
            placeholder="https://example.com/article"
            className="w-full bg-transparent text-sm placeholder:text-ink-300 focus:outline-none"
            disabled={isScraping || isGenerating}
          />
          <button
            type="button"
            onClick={handleScrape}
            disabled={!canScrape}
            className="rounded-xl bg-ink-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isScraping ? "추출 중…" : scraped ? "다시" : "본문 추출"}
          </button>
        </div>
        {scraped && (
          <p className="mt-2 truncate text-xs text-ink-500">
            <span className="font-medium text-emerald-600">✓</span>{" "}
            <span className="text-ink-700">{scraped.title}</span> ·{" "}
            {scraped.length.toLocaleString()}자
          </p>
        )}

        <div className="mt-6">
          <div className="mb-2 text-sm font-medium text-ink-700">양식</div>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTemplate(t.key)}
                disabled={isGenerating}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  t.key === template
                    ? "bg-ink-900 text-white"
                    : "bg-white/60 text-ink-700 ring-1 ring-white/80 hover:bg-white"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-500">
            {TEMPLATES.find((t) => t.key === template)?.description}
          </p>
        </div>

        {template === "custom" && (
          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-ink-700">
              커스텀 양식 지시문
            </label>
            <textarea
              value={customForm}
              onChange={(e) => setCustomForm(e.target.value)}
              disabled={isGenerating}
              placeholder={"예) 1. 핵심 요약\n2. 도입 배경\n3. 솔루션 (3가지)\n4. 기대 효과 (정량/정성)\n5. 결론"}
              className="h-32 w-full resize-none rounded-2xl bg-white/70 p-3 text-sm leading-relaxed ring-1 ring-white/80 placeholder:text-ink-300 focus:outline-none focus:ring-coral-300 disabled:opacity-60"
            />
          </div>
        )}

        <div className="mt-7 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={isScraping || isGenerating}
            className="rounded-full px-3 py-2 text-xs text-ink-500 hover:text-ink-900 disabled:opacity-40"
          >
            처음으로
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="inline-flex items-center gap-2 rounded-full bg-coral-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(255,107,71,0.35)] transition-all hover:bg-coral-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating ? (
              <>
                <Spinner />
                작성 중…
              </>
            ) : (
              <>
                제안서 생성
                <ArrowIcon />
              </>
            )}
          </button>
        </div>

        {!scraped && status !== "scraping" && (
          <p className="mt-3 text-right text-xs text-ink-500">
            먼저 URL을 입력하고 본문을 추출해 주세요.
          </p>
        )}
      </GlassCard>

      <GlassCard className="relative flex min-h-[480px] flex-col overflow-hidden p-7 sm:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`size-2 rounded-full ${
                status === "error"
                  ? "bg-red-500"
                  : status === "done"
                    ? "bg-emerald-500"
                    : status === "generating"
                      ? "bg-coral-500 animate-pulse"
                      : "bg-coral-500"
              }`}
            />
            <h2 className="text-lg font-semibold">
              {status === "scraped" || status === "idle" || status === "scraping"
                ? "스크래핑 결과"
                : "제안서"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {status === "done" && savedId && (
              <a
                href="/history"
                className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200 transition-colors hover:bg-emerald-100"
              >
                저장됨 ✓
              </a>
            )}
            {(status === "done" || (status === "generating" && proposal)) && (
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-medium text-ink-700 ring-1 ring-white/80 transition-colors hover:bg-white"
              >
                {copied ? "복사됨 ✓" : "복사"}
              </button>
            )}
          </div>
        </div>

        {status === "idle" && (
          <Empty text="URL을 입력하고 '본문 추출'을 누르면 본문이 여기에 표시됩니다." />
        )}
        {status === "scraping" && <Empty text="페이지에서 본문을 추출하고 있습니다…" />}
        {status === "error" && (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
            {errorMsg}
          </div>
        )}

        {status === "scraped" && scraped && <ScrapePreview scraped={scraped} />}

        {(status === "generating" || status === "done") && (
          <div className="mt-6 flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-auto rounded-2xl bg-white/70 p-5 ring-1 ring-white/80">
              {proposal ? (
                <MarkdownView content={proposal} />
              ) : (
                <p className="text-sm text-ink-500">모델이 첫 토큰을 작성 중입니다…</p>
              )}
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-coral-300/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-12 size-40 rounded-full bg-coral-200/50 blur-3xl" />
      </GlassCard>
    </div>
  );
}

function ScrapePreview({ scraped }: { scraped: ScrapeResult }) {
  return (
    <div className="mt-6 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-ink-500">제목</div>
        <div className="mt-0.5 truncate text-sm font-semibold text-ink-900">{scraped.title}</div>
      </div>
      {scraped.byline && (
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-ink-500">작성자</div>
          <div className="mt-0.5 truncate text-sm text-ink-700">{scraped.byline}</div>
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="text-xs font-medium uppercase tracking-wide text-ink-500">
          본문 ({scraped.length.toLocaleString()}자)
        </div>
        <pre className="mt-1 flex-1 overflow-auto whitespace-pre-wrap rounded-2xl bg-white/60 p-4 font-sans text-xs leading-relaxed text-ink-700 ring-1 ring-white/80">
          {scraped.text}
        </pre>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="mt-6 flex flex-1 flex-col items-center justify-center text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-coral-50 text-coral-500">
        <SparkleIcon />
      </div>
      <p className="mt-4 max-w-xs text-sm text-ink-500">{text}</p>
    </div>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <path strokeLinecap="round" d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4 animate-spin"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
    >
      <path strokeLinecap="round" d="M12 3a9 9 0 0 1 9 9" />
    </svg>
  );
}
