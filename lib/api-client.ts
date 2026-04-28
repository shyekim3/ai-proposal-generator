/**
 * 응답이 JSON이 아닐 때(HTML 에러 페이지 등)에도 절대 SyntaxError를 던지지 않고
 * { error } 객체를 반환합니다. 서버리스 함수 timeout / 5xx 등에 안전.
 */
export async function safeJson<T = unknown>(res: Response): Promise<T | { error: string }> {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      return (await res.json()) as T;
    } catch {
      return { error: `서버 응답을 해석하지 못했습니다 (HTTP ${res.status}).` };
    }
  }
  // JSON 이 아닌 응답 (HTML, plain text 등) — 함수 timeout 등으로 흔히 발생
  await res.text().catch(() => "");
  if (res.status === 504 || res.status === 408) {
    return {
      error: "서버 응답이 시간 초과되었습니다. 더 짧은 모델(예: google/gemini-2.5-flash)을 사용하거나 잠시 후 다시 시도해 주세요.",
    };
  }
  if (res.status >= 500) {
    return {
      error: `서버에서 일시적 오류가 발생했습니다 (HTTP ${res.status}). 잠시 후 다시 시도해 주세요.`,
    };
  }
  return { error: `예상치 못한 응답 형식입니다 (HTTP ${res.status}).` };
}
