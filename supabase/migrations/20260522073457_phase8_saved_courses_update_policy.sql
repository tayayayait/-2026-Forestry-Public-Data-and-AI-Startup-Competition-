ALTER TABLE public.saved_courses
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_saved_courses_user_recommendation
  ON public.saved_courses(user_id, recommendation_id)
  WHERE recommendation_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'saved_courses'
      AND policyname = 'Users can update own saved courses'
  ) THEN
    CREATE POLICY "Users can update own saved courses"
      ON public.saved_courses FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS set_saved_courses_updated_at ON public.saved_courses;

CREATE TRIGGER set_saved_courses_updated_at
  BEFORE UPDATE ON public.saved_courses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
