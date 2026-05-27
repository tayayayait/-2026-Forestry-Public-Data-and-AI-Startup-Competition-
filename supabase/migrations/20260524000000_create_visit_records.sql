create table visit_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  facility_id text not null,
  facility_name text not null,
  visit_date date not null,
  duration_hours numeric(3,1),
  activities text[] default '{}',
  pre_stress integer check (pre_stress between 1 and 10),
  post_stress integer check (post_stress between 1 and 10),
  pre_sleep text check (pre_sleep in ('good', 'moderate', 'poor')),
  post_sleep text check (post_sleep in ('good', 'moderate', 'poor')),
  mood_change text check (mood_change in ('much_better', 'better', 'same', 'worse')),
  memo text,
  photos text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS 정책
alter table visit_records enable row level security;
create policy "Users can CRUD own records"
  on visit_records for all
  using (auth.uid() = user_id);

-- 뱃지/업적용 뷰
create view user_visit_summary as
  select
    user_id,
    count(*) as total_visits,
    count(distinct facility_id) as unique_facilities,
    avg(pre_stress - post_stress) as avg_stress_reduction,
    max(visit_date) as last_visit
  from visit_records
  group by user_id;
