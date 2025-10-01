
create table if not exists public.tms(
 "table" text not null, pk text not null, data jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now(), primary key("table",pk));
create table if not exists public.backups(
 key text primary key, "table" text not null, payload jsonb not null default '[]'::jsonb,
 created_at timestamptz not null default now());
alter table public.tms enable row level security;
alter table public.backups enable row level security;
do $$ begin
 if not exists (select 1 from pg_policies where schemaname='public' and tablename='tms' and policyname='tms_read_all') then
  create policy tms_read_all on public.tms for select to anon using (true);
 end if;
end $$;
do $$ begin
 if exists (select 1 from pg_publication where pubname='supabase_realtime') then
  begin execute 'alter publication supabase_realtime add table public.tms'; exception when duplicate_object then null; end;
 end if;
end $$;
