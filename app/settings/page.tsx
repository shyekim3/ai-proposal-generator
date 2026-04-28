import Link from "next/link";
import { SystemPromptEditor } from "@/components/SystemPromptEditor";

export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 pb-20 pt-8 sm:px-10">
        <div className="flex flex-col gap-2 pt-10">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/60 px-3 py-1 text-xs font-medium text-coral-700 ring-1 ring-coral-200">
            <span className="size-1.5 rounded-full bg-coral-500" />
            프롬프트 설정
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">AI 프롬프트 편집</h1>
          <p className="text-sm text-ink-500">
            제안서의 톤, 구조, 작성 원칙을 좌우하는 시스템 프롬프트를 직접 수정할 수 있습니다.
          </p>
        </div>

        <div className="mt-8">
          <SystemPromptEditor />
        </div>
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="mx-auto mt-6 flex w-full max-w-4xl items-center justify-between px-6 sm:px-10">
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
        <Link href="/" className="rounded-full px-4 py-2 text-sm text-ink-500 hover:bg-white/40 hover:text-ink-900">
          홈
        </Link>
        <Link href="/history" className="rounded-full px-4 py-2 text-sm text-ink-500 hover:bg-white/40 hover:text-ink-900">
          히스토리
        </Link>
        <Link href="/settings" className="rounded-full bg-white/70 px-4 py-2 text-sm text-ink-900 shadow-sm">
          프롬프트 설정
        </Link>
      </nav>
    </header>
  );
}
