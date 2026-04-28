import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import * as cheerio from "cheerio";
import type { ScrapeResult } from "@/types";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const MAX_TEXT_LENGTH = 20_000;
const FETCH_TIMEOUT_MS = 15_000;

export async function scrapeUrl(rawUrl: string): Promise<ScrapeResult> {
  const url = normalizeUrl(rawUrl);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let html: string;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    if (!res.ok) {
      throw new Error(`해당 URL에서 HTTP ${res.status} 응답을 받았습니다.`);
    }
    html = await res.text();
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        throw new Error("요청이 시간 초과되었습니다. URL을 다시 확인해 주세요.");
      }
      if (err.message === "fetch failed") {
        throw new Error("해당 URL에 접근할 수 없습니다. 도메인을 확인해 주세요.");
      }
      throw err;
    }
    throw new Error("URL 요청 중 알 수 없는 오류가 발생했습니다.");
  } finally {
    clearTimeout(timer);
  }

  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (article && article.textContent && article.textContent.trim().length > 200) {
    return {
      url,
      title: (article.title || dom.window.document.title || url).trim(),
      byline: article.byline?.trim() || null,
      excerpt: article.excerpt?.trim() || null,
      text: truncate(article.textContent.trim()),
      length: article.length ?? article.textContent.length,
    };
  }

  const $ = cheerio.load(html);
  $("script, style, noscript, header, footer, nav, aside, form, iframe").remove();
  const fallbackText = $("body").text().replace(/\s+/g, " ").trim();
  const fallbackTitle = $("title").first().text().trim() || dom.window.document.title || url;

  if (fallbackText.length < 80) {
    throw new Error(
      "이 페이지에서 본문을 충분히 추출하지 못했습니다. 정적 HTML로 본문이 노출되는 다른 URL을 사용해 주세요. (JavaScript로 렌더링되는 SPA·로그인 벽이 있는 페이지는 지원되지 않습니다.)",
    );
  }

  return {
    url,
    title: fallbackTitle || url,
    byline: null,
    excerpt: null,
    text: truncate(fallbackText),
    length: fallbackText.length,
  };
}

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("URL이 비어 있습니다.");
  }
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withProtocol);
    if (!/^https?:$/.test(u.protocol)) {
      throw new Error("http/https URL만 허용됩니다.");
    }
    return u.toString();
  } catch {
    throw new Error("유효하지 않은 URL 형식입니다.");
  }
}

function truncate(text: string): string {
  if (text.length <= MAX_TEXT_LENGTH) return text;
  return text.slice(0, MAX_TEXT_LENGTH) + "\n\n…[본문이 길어 일부만 사용합니다]";
}
