# AI 제안서 생성기

URL 한 줄로 원하는 양식의 제안서를 생성하고 히스토리로 관리하는 단일 사용자 웹 앱입니다.

- 디자인: Glassmorphism + Monochrome (코랄/오렌지)
- AI: OpenRouter (모델 자유 선택)
- DB: Supabase (회원가입 없음, anon key)
- 프레임워크: Next.js 16 App Router + Tailwind v4

## 로컬 실행

```bash
npm install
cp .env.local.example .env.local
# .env.local 의 OpenRouter / Supabase 값을 채운 뒤
npm run dev
```

## 환경변수

| 키 | 설명 |
|---|---|
| `OPENROUTER_API_KEY` | https://openrouter.ai/keys 에서 발급 |
| `OPENROUTER_MODEL` | 예: `anthropic/claude-opus-4`, `google/gemini-2.5-flash` (https://openrouter.ai/models) |
| `OPENROUTER_REFERER` | (선택) 사용 도메인. 트래픽 식별용 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key (`eyJhbGc...` 또는 `sb_publishable_...` 둘 다 지원) |

## Supabase 설정

CLI 사용 (권장):

```bash
npx supabase login
npx supabase link --project-ref <프로젝트-REF>
npx supabase db push
```

대시보드 직접 사용:

Supabase 대시보드 → SQL Editor → [supabase/migrations/20260428132951_init.sql](supabase/migrations/20260428132951_init.sql) 내용 복사·실행.

## Vercel 배포

1. 프로젝트를 GitHub repo로 push
2. https://vercel.com/new 에서 import
3. **Environment Variables** 섹션에 위 5개 변수 등록 (Production / Preview / Development 모두 체크)
4. Deploy

### 함수 실행 시간 주의

`/api/generate` 의 `maxDuration = 120` 으로 설정되어 있습니다. Vercel **Hobby (무료) 플랜은 서버리스 함수 최대 10초 제한**이 있어 긴 응답에서 잘릴 수 있습니다. 더 긴 응답이 필요하면 Pro 플랜으로 업그레이드하거나, 더 짧은 모델(예: `google/gemini-2.5-flash`)을 사용하세요.

## 폴더 구조

```
app/
  page.tsx                         # 메인 (URL → 양식 → 생성)
  history/page.tsx                 # 히스토리 목록
  history/[id]/page.tsx            # 히스토리 상세
  settings/page.tsx                # 시스템 프롬프트 편집
  api/scrape/route.ts              # POST 본문 추출
  api/generate/route.ts            # POST 제안서 스트림
  api/proposals/route.ts           # GET 목록 / POST 저장
  api/proposals/[id]/route.ts      # GET 상세 / DELETE
  api/prompts/route.ts             # GET / PUT / DELETE 시스템 프롬프트
components/                        # GlassCard, ProposalComposer, MarkdownView, …
lib/
  scraper.ts                       # Readability + cheerio
  openrouter.ts                    # SSE streaming wrapper
  prompts.ts                       # 기본 시스템 프롬프트 + 템플릿 지시문
  supabase.ts                      # Supabase 클라이언트
  templates.ts                     # 양식 메타
supabase/
  config.toml                      # CLI 설정
  migrations/*.sql                 # DB 스키마 (Single Source of Truth)
```
