"use client";

import { useState } from "react";

export function CopyButton({ text, label = "복사" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-medium text-ink-700 ring-1 ring-white/80 transition-colors hover:bg-white"
    >
      {copied ? "복사됨 ✓" : label}
    </button>
  );
}
