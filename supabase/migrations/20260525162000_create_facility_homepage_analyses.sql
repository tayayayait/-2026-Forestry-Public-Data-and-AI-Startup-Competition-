create table if not exists public.facility_homepage_analyses (
  homepage_url text primary key,
  facility_name text not null,
  analysis jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.facility_homepage_analyses enable row level security;

drop policy if exists "Public read facility homepage analyses"
on public.facility_homepage_analyses;

create policy "Public read facility homepage analyses"
on public.facility_homepage_analyses
for select
using (true);
