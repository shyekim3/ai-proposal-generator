const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CallOpenRouterArgs {
  messages: OpenRouterMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

const DEFAULT_MAX_TOKENS = 4096;

export function getOpenRouterConfig() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-opus-4";
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY가 설정되지 않았습니다. .env.local에 키를 등록해 주세요.",
    );
  }
  return { apiKey, model };
}

export async function streamOpenRouter({
  messages,
  model,
  temperature = 0.4,
  maxTokens = DEFAULT_MAX_TOKENS,
  signal,
}: CallOpenRouterArgs): Promise<ReadableStream<string>> {
  const { apiKey, model: defaultModel } = getOpenRouterConfig();

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_REFERER || "http://localhost:3000",
      "X-Title": "AI Proposal Generator",
    },
    body: JSON.stringify({
      model: model || defaultModel,
      messages,
      stream: true,
      temperature,
      max_tokens: maxTokens,
    }),
    signal,
  });

  if (!res.ok || !res.body) {
    const errBody = await res.text().catch(() => "");
    throw new Error(formatOpenRouterError(res.status, errBody));
  }

  return parseSseTextStream(res.body);
}

function formatOpenRouterError(status: number, body: string): string {
  let message = body.slice(0, 400);
  try {
    const parsed = JSON.parse(body);
    if (parsed?.error?.message) message = parsed.error.message;
  } catch {
    /* keep raw */
  }

  if (status === 401) {
    return `OpenRouter 인증 실패 (401). API 키가 잘못되었거나 만료되었습니다. .env.local의 OPENROUTER_API_KEY를 확인해 주세요.`;
  }
  if (status === 402) {
    return `OpenRouter 크레딧이 부족합니다 (402). https://openrouter.ai/settings/credits 에서 크레딧을 충전한 뒤 다시 시도해 주세요.\n원본 메시지: ${message}`;
  }
  if (status === 404) {
    return `OpenRouter 모델을 찾을 수 없습니다 (404). .env.local의 OPENROUTER_MODEL 값(현재 모델 ID)이 올바른지 https://openrouter.ai/models 에서 확인해 주세요.`;
  }
  if (status === 429) {
    return `OpenRouter 요청 한도(rate limit)에 도달했습니다 (429). 잠시 후 다시 시도해 주세요.`;
  }
  return `OpenRouter HTTP ${status}: ${message}`;
}

function parseSseTextStream(body: ReadableStream<Uint8Array>): ReadableStream<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  return new ReadableStream<string>({
    async pull(controller) {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        buffer += decoder.decode(value, { stream: true });

        let nlIndex: number;
        while ((nlIndex = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, nlIndex).trim();
          buffer = buffer.slice(nlIndex + 1);
          if (!line || !line.startsWith("data:")) continue;

          const data = line.slice(5).trim();
          if (data === "[DONE]") {
            controller.close();
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta.length > 0) {
              controller.enqueue(delta);
              return;
            }
          } catch {
            // OpenRouter occasionally emits comment lines (": OPENROUTER PROCESSING") — skip
          }
        }
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });
}
