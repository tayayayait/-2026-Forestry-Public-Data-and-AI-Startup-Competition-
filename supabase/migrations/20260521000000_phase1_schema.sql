-- =============================================
-- 숲 테라피 AI — Phase 1 DB 스키마 확장
-- health_profiles, recommendations, visit_records
-- =============================================

-- ── 건강 프로필 테이블 ──
CREATE TABLE IF NOT EXISTS public.health_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stress_level INT NOT NULL CHECK (stress_level BETWEEN 1 AND 10),
  sleep_quality TEXT NOT NULL CHECK (sleep_quality IN ('good','normal','poor')),
  fitness_level TEXT NOT NULL CHECK (fitness_level IN ('beginner','moderate','advanced')),
  preferred_activities TEXT[] NOT NULL DEFAULT '{}',
  companions TEXT NOT NULL CHECK (companions IN ('solo','couple','family','senior')),
  max_travel_time INT NOT NULL CHECK (max_travel_time IN (30,60,120)),
  accessibility_needs TEXT[] NOT NULL DEFAULT '{none}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_profile UNIQUE (user_id)
);

-- ── AI 추천 결과 테이블 ──
CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  facility_data JSONB NOT NULL,
  program_data JSONB NOT NULL,
  environment_data JSONB NOT NULL,
  expected_effects JSONB,
  nearby_places JSONB,
  match_score INT CHECK (match_score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 방문 기록 테이블 ──
CREATE TABLE IF NOT EXISTS public.visit_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_id UUID REFERENCES public.recommendations(id) ON DELETE SET NULL,
  facility_name TEXT NOT NULL,
  visit_date DATE NOT NULL,
  duration_minutes INT,
  activities TEXT[] DEFAULT '{}',
  pre_stress INT CHECK (pre_stress BETWEEN 1 AND 10),
  post_stress INT CHECK (post_stress BETWEEN 1 AND 10),
  pre_sleep TEXT CHECK (pre_sleep IN ('good','normal','poor')),
  post_sleep TEXT CHECK (post_sleep IN ('good','normal','poor')),
  mood_change TEXT,
  memo TEXT,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 인덱스 ──
CREATE INDEX IF NOT EXISTS idx_health_profiles_user ON public.health_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_user ON public.recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_created ON public.recommendations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visit_records_user ON public.visit_records(user_id);
CREATE INDEX IF NOT EXISTS idx_visit_records_date ON public.visit_records(visit_date DESC);

-- ── Row Level Security ──
ALTER TABLE public.health_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_records ENABLE ROW LEVEL SECURITY;

-- health_profiles RLS
CREATE POLICY "Users can view own health profile"
  ON public.health_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health profile"
  ON public.health_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health profile"
  ON public.health_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own health profile"
  ON public.health_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- recommendations RLS
CREATE POLICY "Users can view own recommendations"
  ON public.recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recommendations"
  ON public.recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recommendations"
  ON public.recommendations FOR DELETE
  USING (auth.uid() = user_id);

-- visit_records RLS
CREATE POLICY "Users can view own visit records"
  ON public.visit_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own visit records"
  ON public.visit_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own visit records"
  ON public.visit_records FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own visit records"
  ON public.visit_records FOR DELETE
  USING (auth.uid() = user_id);

-- ── updated_at 자동 갱신 트리거 ──
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_health_profiles_updated_at
  BEFORE UPDATE ON public.health_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
