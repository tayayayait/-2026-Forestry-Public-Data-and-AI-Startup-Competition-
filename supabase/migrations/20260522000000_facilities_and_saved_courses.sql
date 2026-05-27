-- 1. facilities 테이블: 치유의숲/휴양림/수목원 통합 시설 마스터
CREATE TABLE IF NOT EXISTS public.facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT,                    -- 기존 코드의 serial_number 등
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('healing_forest','recreation_forest','arboretum','education')),
  region TEXT,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  tel TEXT,
  homepage TEXT,
  intro TEXT,
  operator TEXT,                       -- 국립/공립/사립
  participation_method TEXT,
  programs TEXT[] DEFAULT '{}',
  accessibility JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',         -- 확장 필드
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. saved_courses 테이블: 사용자가 저장한 AI 추천 코스
CREATE TABLE IF NOT EXISTS public.saved_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_id UUID REFERENCES public.recommendations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  facility_name TEXT NOT NULL,
  memo TEXT,
  is_bookmarked BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_facilities_type ON public.facilities(type);
CREATE INDEX IF NOT EXISTS idx_facilities_region ON public.facilities(region);
CREATE INDEX IF NOT EXISTS idx_saved_courses_user ON public.saved_courses(user_id);

-- RLS
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view facilities" ON public.facilities FOR SELECT USING (true);
CREATE POLICY "Only admins can modify facilities" ON public.facilities FOR ALL USING (false);

ALTER TABLE public.saved_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own saved courses" ON public.saved_courses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved courses" ON public.saved_courses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved courses" ON public.saved_courses FOR DELETE USING (auth.uid() = user_id);

-- updated_at 트리거
CREATE TRIGGER set_facilities_updated_at
  BEFORE UPDATE ON public.facilities
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
