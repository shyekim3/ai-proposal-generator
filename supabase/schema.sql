-- AI 제안서 생성기 — Supabase 스키마
-- 실행 위치: Supabase 대시보드 > SQL Editor > New query 에 붙여넣고 Run.

create extension if not exists "pgcrypto";

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source_url text not null,
  source_title text not null,
  template_key text not null,
  custom_form text,
  result_md text not null,
  model text
);

create index if not exists proposals_created_at_idx
  on public.proposals (created_at desc);

create table if not exists public.system_prompts (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  content text not null,
  updated_at timestamptz not null default now()
);

-- RLS는 사용하지 않음 (회원가입 없는 단일 사용자 앱).
-- 기본적으로 RLS 없이도 anon key로 INSERT/SELECT 가능하도록 권한을 명시.
alter table public.proposals disable row level security;
alter table public.system_prompts disable row level security;

grant select, insert, update, delete on public.proposals to anon;
grant select, insert, update, delete on public.system_prompts to anon;
