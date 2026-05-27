CREATE TABLE IF NOT EXISTS public.facility_image_curations (
  facility_id TEXT PRIMARY KEY,
  facility_name TEXT NOT NULL,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_facility_image_curations_updated_at
  ON public.facility_image_curations(updated_at DESC);

ALTER TABLE public.facility_image_curations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view facility image curations"
  ON public.facility_image_curations
  FOR SELECT
  USING (true);

DROP TRIGGER IF EXISTS set_facility_image_curations_updated_at
  ON public.facility_image_curations;

CREATE TRIGGER set_facility_image_curations_updated_at
  BEFORE UPDATE ON public.facility_image_curations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
