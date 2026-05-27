-- ============================================================
-- forest_plants: 산림청 숲에 사는 식물 정보 (정제 CSV 기반)
-- ============================================================

create table if not exists public.forest_plants (
  id            bigint       primary key,            -- 숲이야기순번
  category      text,                                 -- 구분
  name          text         not null,                -- 식물명
  english_name  text,                                 -- 영문명
  guide         text,                                 -- 안내
  scientific_name text,                               -- 학명
  class_name    text,                                 -- 식물분류군명
  habitat       text,                                 -- 서식장소
  lifetime      text,                                 -- 식물의일생
  story         text,                                 -- 식물이야기설명
  offer         text,                                 -- 식물자료제공
  registered_at date,                                 -- 등록일
  created_at    timestamptz  not null default now()
);

-- RLS: 누구나 조회 가능 (anon SELECT)
alter table public.forest_plants enable row level security;

create policy "forest_plants_select_public"
  on public.forest_plants
  for select
  using (true);

-- 검색 성능을 위한 trigram 인덱스
create extension if not exists pg_trgm;

create index if not exists idx_forest_plants_name_trgm
  on public.forest_plants
  using gin (name gin_trgm_ops);

create index if not exists idx_forest_plants_scientific_name_trgm
  on public.forest_plants
  using gin (scientific_name gin_trgm_ops);

comment on table public.forest_plants is '산림청 숲에 사는 식물 정보 (정제 CSV → DB 이관)';
