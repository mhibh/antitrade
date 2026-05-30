create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  modal_awal bigint not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint settings_user_id_key unique (user_id)
);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tanggal date not null,
  saldo_awal bigint not null,
  pnl bigint not null,
  type text not null default 'trade' check (type in ('trade', 'withdrawal')),
  catatan text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.trades
  add column if not exists type text not null default 'trade' check (type in ('trade', 'withdrawal'));

alter table public.settings enable row level security;
alter table public.trades enable row level security;

drop policy if exists "settings_select_own" on public.settings;
drop policy if exists "settings_insert_own" on public.settings;
drop policy if exists "settings_update_own" on public.settings;
drop policy if exists "settings_delete_own" on public.settings;

create policy "settings_select_own"
  on public.settings for select
  using (user_id = auth.uid());

create policy "settings_insert_own"
  on public.settings for insert
  with check (user_id = auth.uid());

create policy "settings_update_own"
  on public.settings for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "settings_delete_own"
  on public.settings for delete
  using (user_id = auth.uid());

drop policy if exists "trades_select_own" on public.trades;
drop policy if exists "trades_insert_own" on public.trades;
drop policy if exists "trades_update_own" on public.trades;
drop policy if exists "trades_delete_own" on public.trades;

create policy "trades_select_own"
  on public.trades for select
  using (user_id = auth.uid());

create policy "trades_insert_own"
  on public.trades for insert
  with check (user_id = auth.uid());

create policy "trades_update_own"
  on public.trades for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "trades_delete_own"
  on public.trades for delete
  using (user_id = auth.uid());
