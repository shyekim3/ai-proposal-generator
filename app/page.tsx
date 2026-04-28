import { ProposalComposer } from "@/components/ProposalComposer";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-20 pt-8 sm:px-10">
        <Hero />
        <div className="mt-10">
          <ProposalComposer />
        </div>
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="mx-auto mt-6 flex w-full max-w-6xl items-center justify-between px-6 sm:px-10">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-ink-900 font-mono text-lg font-semibold text-coral-300">
          ¶
        </div>
        <div className="leading-tight">
          <div className="text-sm font-medium text-ink-500">AI Proposal</div>
          <div className="text-base font-semibold tracking-tight">Generator</div>
        </div>
      </div>
      <nav className="hidden items-center gap-1 sm:flex">
        <NavLink href="/" active>
          홈
        </NavLink>
        <NavLink href="/history">히스토리</NavLink>
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
    <a
      href={href}
      className={`rounded-full px-4 py-2 text-sm transition-colors ${
        active
          ? "bg-white/70 text-ink-900 shadow-sm"
          : "text-ink-500 hover:bg-white/40 hover:text-ink-900"
      }`}
    >
      {children}
    </a>
  );
}

function Hero() {
  return (
    <div className="flex flex-col gap-3 pt-10 sm:pt-16">
      <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/60 px-3 py-1 text-xs font-medium text-coral-700 ring-1 ring-coral-200">
        <span className="size-1.5 rounded-full bg-coral-500" />
        URL 한 줄로 시작하세요
      </div>
      <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
        제안서, <span className="text-coral-600">한 번에</span>
        <br />
        깔끔하게 정리해 드립니다.
      </h1>
      <p className="max-w-xl text-base text-ink-500">
        URL을 붙여 넣고 원하는 양식을 고르면, AI가 핵심을 추려 제안서로 정리합니다.
      </p>
    </div>
  );
}
