import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { TemplateKey } from "@/types";

export const DEFAULT_PROMPT_KEY = "default";

export const DEFAULT_SYSTEM_PROMPT = `당신은 한국어 비즈니스 제안서 작성 전문가입니다.
사용자가 제공한 참고 자료(웹 페이지 본문)와 선택한 양식에 맞춰 깔끔하고 설득력 있는 제안서를 작성합니다.

## 작성 원칙
- 출력은 반드시 한국어 마크다운 형식.
- 1단계 제목(#)은 사용하지 않고 2단계(##) 제목부터 시작.
- 추측하지 말고 참고 자료에 근거해 작성. 자료에 없는 수치는 만들지 않음.
- 모호한 표현 대신 구체적인 활동/지표/일정을 제안.
- 군더더기 없이 핵심을 먼저 전달.
- 마지막에 한 줄 짜리 핵심 요약(요약: …) 을 덧붙임.`;

/**
 * DB에 저장된 default 시스템 프롬프트가 있으면 그것을 사용, 없으면 코드 상수.
 * Supabase 미설정/조회 실패 시에도 graceful하게 코드 상수를 반환.
 */
export async function loadDefaultSystemPrompt(): Promise<string> {
  if (!isSupabaseConfigured()) return DEFAULT_SYSTEM_PROMPT;
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("system_prompts")
      .select("content")
      .eq("key", DEFAULT_PROMPT_KEY)
      .maybeSingle();
    if (data?.content?.trim()) return data.content;
  } catch {
    /* fall through to code default */
  }
  return DEFAULT_SYSTEM_PROMPT;
}

export const TEMPLATE_INSTRUCTIONS: Record<Exclude<TemplateKey, "custom">, string> = {
  business: `## 사용 양식: 사업제안서
다음 섹션 순서로 작성하세요.
- 사업 개요
- 시장 배경 및 문제 정의
- 제안 솔루션
- 추진 전략 및 단계별 계획
- 기대 효과
- 결론`,
  marketing: `## 사용 양식: 마케팅 제안서
다음 섹션 순서로 작성하세요.
- 캠페인 개요
- 타깃 분석
- 핵심 메시지
- 채널 및 콘텐츠 전략
- 일정과 예산 (참고 자료에 있는 수치만 사용)
- 성과 측정 지표(KPI)`,
  bid: `## 사용 양식: 입찰 제안서
다음 섹션 순서로 작성하세요.
- 과업 이해 및 핵심 요구사항
- 수행 조직 및 역량 요약
- 추진 방법론
- 일정 계획
- 산출물 정의
- 차별화 포인트`,
  general: `## 사용 양식: 일반 제안서
다음 섹션 순서로 작성하세요.
- 핵심 요약
- 배경
- 제안 내용
- 실행 방안
- 결론 및 다음 단계`,
};

export function buildUserMessage(args: {
  scrapedTitle: string;
  scrapedText: string;
  scrapedUrl: string;
  templateKey: TemplateKey;
  customForm?: string;
}): string {
  const { scrapedTitle, scrapedText, scrapedUrl, templateKey, customForm } = args;

  const formInstruction =
    templateKey === "custom"
      ? `## 사용 양식: 사용자 정의\n사용자가 직접 지정한 양식에 따라 작성하세요. 양식 지시문은 다음과 같습니다.\n\n${customForm?.trim() || "(양식 지시문이 비어 있습니다. 일반 제안서 구조로 작성하세요.)"}`
      : TEMPLATE_INSTRUCTIONS[templateKey];

  return `다음 참고 자료를 바탕으로 제안서를 작성해 주세요.

${formInstruction}

## 참고 자료
- URL: ${scrapedUrl}
- 제목: ${scrapedTitle}

### 본문
${scrapedText}`;
}
