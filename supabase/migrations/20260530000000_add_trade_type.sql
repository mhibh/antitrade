alter table public.trades
  add column if not exists type text not null default 'trade' check (type in ('trade', 'withdrawal'));
