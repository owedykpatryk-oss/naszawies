-- Zdjęcie przy POI (max 1 na punkt) + komentarze mieszkańców pod „ładnym miejscem”

ALTER TABLE public.pois
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS photo_path TEXT,
  ADD COLUMN IF NOT EXISTS photo_caption TEXT;

COMMENT ON COLUMN public.pois.photo_url IS 'Publiczny URL zdjęcia (bucket village_photos, max 1 na POI).';
COMMENT ON COLUMN public.pois.photo_path IS 'Ścieżka w storage do usunięcia przy zmianie zdjęcia.';

CREATE TABLE IF NOT EXISTS public.poi_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poi_id UUID NOT NULL REFERENCES public.pois(id) ON DELETE CASCADE,
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'visible'
    CHECK (status IN ('visible', 'hidden', 'pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT poi_comment_body_len CHECK (char_length(trim(body)) BETWEEN 1 AND 600)
);

CREATE INDEX IF NOT EXISTS idx_poi_comments_poi ON public.poi_comments(poi_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_poi_comments_village ON public.poi_comments(village_id, status);

DROP TRIGGER IF EXISTS update_poi_comments_updated_at ON public.poi_comments;
CREATE TRIGGER update_poi_comments_updated_at
BEFORE UPDATE ON public.poi_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.poi_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public visible poi comments" ON public.poi_comments;
CREATE POLICY "Public visible poi comments"
ON public.poi_comments
FOR SELECT
USING (status = 'visible');

DROP POLICY IF EXISTS "Members create poi comments" ON public.poi_comments;
CREATE POLICY "Members create poi comments"
ON public.poi_comments
FOR INSERT
WITH CHECK (
  auth.uid() = author_id
  AND status IN ('visible', 'pending')
  AND (
    public.is_village_resident(village_id)
    OR public.is_village_soltys(village_id)
  )
);

DROP POLICY IF EXISTS "Authors edit own poi comments" ON public.poi_comments;
CREATE POLICY "Authors edit own poi comments"
ON public.poi_comments
FOR UPDATE
USING (author_id = auth.uid() AND status = 'visible')
WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "Soltys moderates poi comments" ON public.poi_comments;
CREATE POLICY "Soltys moderates poi comments"
ON public.poi_comments
FOR ALL
USING (public.is_village_soltys(village_id))
WITH CHECK (public.is_village_soltys(village_id));
