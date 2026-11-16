-- NEW US DATABASE ONLY. Configurações da loja internacional editadas pelo painel (ex.: países e ritmos).
-- Aplicar uma vez no SQL Editor do Supabase dos EUA. Nunca aplicar no banco do Brasil.
begin;
create table if not exists public.us_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);
alter table public.us_settings enable row level security;
-- Sem políticas: só a service role (rotas do servidor) lê e grava.
revoke all on public.us_settings from anon, authenticated;
commit;
