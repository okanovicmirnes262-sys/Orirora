-- ORDIORA — admin panel + error reporting
--
-- Adds the tables behind /admin and the in-app bug reporter. kv_store is not
-- touched. Everything here except two narrow anon grants (insert into
-- error_logs, read restaurant_status) is reachable ONLY through the `admin`
-- Edge Function, which uses the service_role key server-side after checking
-- the admin password.

-- ------------------------------------------------------------------
-- error_logs — written by the app (anon, insert-only), read by admin
-- ------------------------------------------------------------------
create table if not exists public.error_logs (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  kind        text not null check (kind in ('js_error','promise','crash','save_failed','load_failed','user_report')),
  message     text not null check (char_length(message) <= 2000),
  slug        text check (char_length(slug) <= 100),
  user_email  text check (char_length(user_email) <= 200),
  user_role   text check (char_length(user_role) <= 40),
  view        text check (char_length(view) <= 60),
  action      text check (char_length(action) <= 300),
  user_note   text check (char_length(user_note) <= 4000),
  status      text not null default 'new' check (status in ('new','seen','resolved'))
);
create index if not exists error_logs_created_at_idx on public.error_logs (created_at desc);
create index if not exists error_logs_slug_idx on public.error_logs (slug, created_at desc);

alter table public.error_logs enable row level security;
revoke all on public.error_logs from anon, authenticated;
grant insert on public.error_logs to anon;
drop policy if exists "anon can report errors" on public.error_logs;
create policy "anon can report errors"
  on public.error_logs for insert to anon
  with check (status = 'new');

-- ------------------------------------------------------------------
-- restaurant_status — suspension flag; the app reads it, admin writes it
-- ------------------------------------------------------------------
create table if not exists public.restaurant_status (
  slug        text primary key,
  suspended   boolean not null default false,
  message     text,
  updated_at  timestamptz not null default now()
);
alter table public.restaurant_status enable row level security;
revoke all on public.restaurant_status from anon, authenticated;
grant select on public.restaurant_status to anon;
drop policy if exists "anon can read restaurant status" on public.restaurant_status;
create policy "anon can read restaurant status"
  on public.restaurant_status for select to anon
  using (true);

-- ------------------------------------------------------------------
-- Admin-only tables (no anon/authenticated access at all)
-- ------------------------------------------------------------------
create table if not exists public.admin_history (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  slug        text,
  key         text,           -- kv_store key; null for non-data actions (impersonate, status…)
  action      text not null,  -- set_key | restore | delete_restaurant | reset_password | impersonate | suspend | unsuspend
  old_value   jsonb,          -- null = key did not exist
  new_value   jsonb,          -- null = key deleted
  note        text
);
create index if not exists admin_history_slug_idx on public.admin_history (slug, created_at desc);
create index if not exists admin_history_created_at_idx on public.admin_history (created_at desc);

create table if not exists public.admin_notes (
  slug        text primary key,
  notes       text not null default '',
  updated_at  timestamptz not null default now()
);

create table if not exists public.admin_login_attempts (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  ip          text not null,
  success     boolean not null
);
create index if not exists admin_login_attempts_ip_idx on public.admin_login_attempts (ip, created_at desc);

-- One-time tokens for "sign in as owner" (valid 2 minutes, single use).
create table if not exists public.admin_impersonations (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null,
  slug         text not null,
  email        text not null,
  redeemed_at  timestamptz
);

alter table public.admin_history        enable row level security;
alter table public.admin_notes          enable row level security;
alter table public.admin_login_attempts enable row level security;
alter table public.admin_impersonations enable row level security;
revoke all on public.admin_history, public.admin_notes, public.admin_login_attempts, public.admin_impersonations
  from anon, authenticated;

-- ------------------------------------------------------------------
-- Per-restaurant summary for the admin list, computed in the database so the
-- Edge Function doesn't download every reservation blob.
-- ------------------------------------------------------------------
create or replace function public.admin_restaurant_summary()
returns table (
  slug               text,
  last_update        timestamptz,
  restaurant_name    text,
  owner_name         text,
  owner_email        text,
  staff_count        int,
  reservation_count  int,
  table_count        int
)
language sql stable
set search_path = public
as $$
  with k as (
    select split_part(key, ':', 2) as slug,
           split_part(key, ':', 3) as part,
           value, updated_at
    from public.kv_store
    where key like 'restaurantos:%:%'
  ),
  owners as (
    select k.slug, a->>'name' as owner_name, a->>'email' as owner_email
    from k, lateral jsonb_array_elements(case when jsonb_typeof(k.value) = 'array' then k.value else '[]'::jsonb end) a
    where k.part = 'accounts' and a->>'role' = 'owner'
  )
  select k.slug,
         max(k.updated_at),
         max(case when k.part = 'restaurant' then k.value->>'name' end),
         max(o.owner_name),
         max(o.owner_email),
         coalesce(max(case when k.part = 'accounts'     and jsonb_typeof(k.value) = 'array' then jsonb_array_length(k.value) end), 0)::int,
         coalesce(max(case when k.part = 'reservations' and jsonb_typeof(k.value) = 'array' then jsonb_array_length(k.value) end), 0)::int,
         coalesce(max(case when k.part = 'tables'       and jsonb_typeof(k.value) = 'array' then jsonb_array_length(k.value) end), 0)::int
  from k
  left join owners o on o.slug = k.slug
  group by k.slug;
$$;
revoke execute on function public.admin_restaurant_summary() from public, anon, authenticated;
