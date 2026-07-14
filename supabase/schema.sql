-- ORDIORA — Supabase schema
-- Run this once in your Supabase project's SQL editor
-- (Dashboard → SQL Editor → New query → paste → Run).
--
-- The app persists all shared data as JSON documents in a single key/value
-- table. Keys look like:
--   restaurantos:registry
--   restaurantos:<slug>:restaurant
--   restaurantos:<slug>:accounts
--   restaurantos:<slug>:reservations
--   ... etc.

create table if not exists public.kv_store (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

-- Keep updated_at fresh on every write.
create or replace function public.kv_store_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists kv_store_set_updated_at on public.kv_store;
create trigger kv_store_set_updated_at
  before update on public.kv_store
  for each row execute function public.kv_store_touch_updated_at();

-- Row Level Security.
alter table public.kv_store enable row level security;

-- IMPORTANT SECURITY NOTE
-- The app manages its own accounts (it does NOT use Supabase Auth), so requests
-- come in as the anonymous role using the public anon key. The policy below
-- therefore grants the anon role full read/write access to kv_store.
--
-- Consequence: anyone who has your project URL + anon key can read and write
-- this data. That is acceptable for a demo / internal tool, but for a public
-- production deployment you should move authentication to Supabase Auth and
-- tighten these policies. See the README "Security" section.

drop policy if exists "anon full access to kv_store" on public.kv_store;
create policy "anon full access to kv_store"
  on public.kv_store
  for all
  to anon
  using (true)
  with check (true);
