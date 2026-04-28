import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase 환경변수가 설정되지 않았습니다. .env.local에 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 를 등록해 주세요.",
    );
  }

  cached = createClient(url as string, anonKey as string, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

const PLACEHOLDER_URL_PATTERNS = ["xxxx.supabase.co", "your-project", "<your"];
const PLACEHOLDER_ANON_KEYS = new Set(["eyJhbGc...", "sb_publishable_..."]);

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return false;
  if (!url.startsWith("https://")) return false;
  if (PLACEHOLDER_URL_PATTERNS.some((p) => url.toLowerCase().includes(p))) return false;
  if (PLACEHOLDER_ANON_KEYS.has(anonKey) || anonKey.length < 20) return false;
  return true;
}
