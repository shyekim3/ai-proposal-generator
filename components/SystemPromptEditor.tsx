"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { safeJson } from "@/lib/api-client";

type Status = "loading" | "ready" | "saving" | "saved" | "error";

interface PromptResponse {
  key: string;
  content: string;
  isCustom: boolean;
  updated_at?: string;
  configured: boolean;
  defaultContent: string;
}

export function SystemPromptEditor() {
  const [content, setContent] = useState("");
  const [defaultContent, setDefaultContent] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | undefined>();
  const [configured, setConfigured] = useState(true);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/prompts?key=default");
      const data = await safeJson<PromptResponse>(res);
      if (!res.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "조회 실패");
      }
      setContent(data.content);
      setDefaultContent(data.defaultContent);
      setIsCustom(data.isCustom);
      setUpdatedAt(data.updated_at);
      setConfigured(data.configured);
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "조회 실패");
      setStatus("error");
    }
  }

  async function handleSave() {
    if (!content.trim()) {
      setErrorMsg("내용이 비어 있습니다.");
      setStatus("error");
      return;
    }
    setStatus("saving");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/prompts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "default", content }),
      });
      const data = await safeJson<{ ok?: boolean; error?: string }>(res);
      if (!res.ok || "error" in data) {
        throw new Error("error" in data && data.error ? data.error : "저장 실패");
      }
      setStatus("saved");
      setIsCustom(true);
      setUpdatedAt(new Date().toISOString());
      setTimeout(() => setStatus("ready"), 1500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "저장 실패");
      setStatus("error");
    }
  }

  async function handleResetToDefault() {
    if (!confirm("저장된 커스텀 프롬프트를 삭제하고 기본값으로 되돌릴까요?")) return;
    setStatus("saving");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/prompts?key=default", { method: "DELETE" });
      const data = await safeJson<{ ok?: boolean; error?: string }>(res);
      if (!res.ok || "error" in data) {
        throw new Error("error" in data && data.error ? data.error : "리셋 실패");
      }
      setContent(defaultContent);
      setIsCustom(false);
      setUpdatedAt(undefined);
      setStatus("saved");
      setTimeout(() => setStatus("ready"), 1500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "리셋 실패");
      setStatus("error");
    }
  }

  function handleRevertEdits() {
    setContent(defaultContent);
  }

  const isSaving = status === "saving";
  const isLoading = status === "loading";
  const hasUnsavedChanges = !isLoading && content !== (isCustom ? content : defaultContent);

  return (
    <GlassCard variant="strong" className="p-7 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">기본 시스템 프롬프트</h2>
          <p className="mt-0.5 text-xs text-ink-500">
            모든 제안서 생성에 적용되는 시스템 프롬프트입니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!configured && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
              Supabase 미설정 — 코드 기본값만 표시
            </span>
          )}
          {configured && isCustom && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
              커스텀
            </span>
          )}
          {configured && !isCustom && (
            <span className="rounded-full bg-coral-100 px-2.5 py-1 text-xs font-medium text-coral-700">
              기본값
            </span>
          )}
        </div>
      </div>

      {updatedAt && (
        <p className="mt-2 text-xs text-ink-500">
          마지막 수정: {new Intl.DateTimeFormat("ko-KR", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(updatedAt))}
        </p>
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isSaving || isLoading || !configured}
        placeholder="시스템 프롬프트를 입력하세요…"
        spellCheck={false}
        className="mt-5 h-96 w-full resize-y rounded-2xl bg-white/70 p-4 font-mono text-sm leading-relaxed ring-1 ring-white/80 placeholder:text-ink-300 focus:outline-none focus:ring-coral-300 disabled:opacity-60"
      />

      {errorMsg && (
        <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
          {errorMsg}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-ink-500">
          {hasUnsavedChanges && configured && (
            <span className="rounded-full bg-coral-100 px-2 py-0.5 text-coral-700">
              저장되지 않은 변경 사항
            </span>
          )}
          {status === "saved" && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
              저장됨 ✓
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRevertEdits}
            disabled={isSaving || isLoading || content === defaultContent}
            className="rounded-full bg-white/70 px-3 py-2 text-xs font-medium text-ink-700 ring-1 ring-white/80 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            기본값으로 채우기
          </button>
          {isCustom && configured && (
            <button
              type="button"
              onClick={handleResetToDefault}
              disabled={isSaving || isLoading}
              className="rounded-full bg-white/70 px-3 py-2 text-xs font-medium text-ink-700 ring-1 ring-white/80 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              기본값으로 되돌리기
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoading || !configured}
            className="inline-flex items-center gap-2 rounded-full bg-coral-500 px-5 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(255,107,71,0.35)] transition-all hover:bg-coral-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
