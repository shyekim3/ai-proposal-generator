import type { Template } from "@/types";

export const TEMPLATES: Template[] = [
  {
    key: "business",
    label: "사업제안서",
    description: "사업 배경 · 목표 · 솔루션 · 기대효과 중심으로 구성된 제안서",
  },
  {
    key: "marketing",
    label: "마케팅제안서",
    description: "타깃 · 메시지 · 채널 · KPI 중심의 마케팅 캠페인 제안서",
  },
  {
    key: "bid",
    label: "입찰제안서",
    description: "수행 능력 · 과업 이해 · 일정 · 견적 중심의 입찰용 제안서",
  },
  {
    key: "general",
    label: "일반제안서",
    description: "범용 제안서 — 핵심 요약 · 본문 · 결론의 기본 구조",
  },
  {
    key: "custom",
    label: "커스텀",
    description: "원하는 양식을 직접 입력하여 그 구조대로 작성",
  },
];
