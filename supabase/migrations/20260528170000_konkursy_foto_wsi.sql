-- Konkursy fotograficzne wsi (Fotokronika) + głosowanie mieszkańców

CREATE TABLE IF NOT EXISTS public.village_photo_contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  rules_text TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submissions', 'voting', 'closed', 'cancelled')),
  submissions_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  submissions_end TIMESTAMPTZ NOT NULL,
  voting_start TIMESTAMPTZ NOT NULL,
  voting_end TIMESTAMPTZ NOT NULL,
  max_entries_per_user INTEGER NOT NULL DEFAULT 3 CHECK (max_entries_per_user BETWEEN 1 AND 20),
  winner_photo_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_village_photo_contests_village ON public.village_photo_contests(village_id);
CREATE INDEX IF NOT EXISTS idx_village_photo_contests_status ON public.village_photo_contests(village_id, status);

ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS contest_id UUID REFERENCES public.village_photo_contests(id) ON DELETE SET NULL;

ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS vote_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_photos_contest ON public.photos(contest_id) WHERE contest_id IS NOT NULL;

ALTER TABLE public.village_photo_contests
  ADD CONSTRAINT fk_contest_winner_photo
  FOREIGN KEY (winner_photo_id) REFERENCES public.photos(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.village_photo_votes (
  contest_id UUID NOT NULL REFERENCES public.village_photo_contests(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (contest_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_village_photo_votes_photo ON public.village_photo_votes(photo_id);

DROP TRIGGER IF EXISTS update_village_photo_contests_updated_at ON public.village_photo_contests;
CREATE TRIGGER update_village_photo_contests_updated_at
BEFORE UPDATE ON public.village_photo_contests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_village_photo_votes_updated_at ON public.village_photo_votes;
CREATE TRIGGER update_village_photo_votes_updated_at
BEFORE UPDATE ON public.village_photo_votes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.refresh_photo_vote_count(p_photo_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM public.village_photo_votes
  WHERE photo_id = p_photo_id;

  UPDATE public.photos
  SET vote_count = COALESCE(v_count, 0)
  WHERE id = p_photo_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.on_village_photo_vote_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_photo_vote_count(OLD.photo_id);
  ELSE
    PERFORM public.refresh_photo_vote_count(NEW.photo_id);
    IF TG_OP = 'UPDATE' AND OLD.photo_id IS DISTINCT FROM NEW.photo_id THEN
      PERFORM public.refresh_photo_vote_count(OLD.photo_id);
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_village_photo_vote_change ON public.village_photo_votes;
CREATE TRIGGER trg_village_photo_vote_change
AFTER INSERT OR UPDATE OR DELETE ON public.village_photo_votes
FOR EACH ROW EXECUTE FUNCTION public.on_village_photo_vote_change();

CREATE OR REPLACE FUNCTION public.konkurs_foto_przyjmuje_zgloszenia(p_contest_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.village_photo_contests c
    WHERE c.id = p_contest_id
      AND c.status = 'submissions'
      AND now() >= c.submissions_start
      AND now() <= c.submissions_end
  );
$$;

CREATE OR REPLACE FUNCTION public.konkurs_foto_trwa_glosowanie(p_contest_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.village_photo_contests c
    WHERE c.id = p_contest_id
      AND c.status = 'voting'
      AND now() >= c.voting_start
      AND now() <= c.voting_end
  );
$$;

CREATE OR REPLACE FUNCTION public.mozna_glosowac_w_konkursie_foto(p_village_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_village_resident(p_village_id)
    OR public.is_village_soltys(p_village_id)
    OR EXISTS (
      SELECT 1
      FROM public.user_follows uf
      WHERE uf.user_id = auth.uid()
        AND uf.village_id = p_village_id
    );
$$;

ALTER TABLE public.village_photo_contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.village_photo_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view active photo contests" ON public.village_photo_contests;
CREATE POLICY "Public view active photo contests"
ON public.village_photo_contests
FOR SELECT
USING (status IN ('submissions', 'voting', 'closed'));

DROP POLICY IF EXISTS "Soltys manages photo contests" ON public.village_photo_contests;
CREATE POLICY "Soltys manages photo contests"
ON public.village_photo_contests
FOR ALL
USING (public.is_village_soltys(village_id))
WITH CHECK (public.is_village_soltys(village_id));

DROP POLICY IF EXISTS "Users see own contest vote" ON public.village_photo_votes;
CREATE POLICY "Users see own contest vote"
ON public.village_photo_votes
FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Eligible voters cast contest vote" ON public.village_photo_votes;
CREATE POLICY "Eligible voters cast contest vote"
ON public.village_photo_votes
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND public.konkurs_foto_trwa_glosowanie(contest_id)
  AND public.mozna_glosowac_w_konkursie_foto(
    (SELECT village_id FROM public.village_photo_contests WHERE id = contest_id)
  )
  AND EXISTS (
    SELECT 1
    FROM public.photos p
    WHERE p.id = photo_id
      AND p.contest_id = village_photo_votes.contest_id
      AND p.status = 'approved'
  )
);

DROP POLICY IF EXISTS "Users change own contest vote" ON public.village_photo_votes;
CREATE POLICY "Users change own contest vote"
ON public.village_photo_votes
FOR UPDATE
USING (user_id = auth.uid() AND public.konkurs_foto_trwa_glosowanie(contest_id))
WITH CHECK (
  user_id = auth.uid()
  AND public.konkurs_foto_trwa_glosowanie(contest_id)
);

DROP POLICY IF EXISTS "Mieszkancy wsi wgraja zdjecia do moderacji" ON public.photos;
CREATE POLICY "Mieszkancy wsi wgraja zdjecia do moderacji"
ON public.photos
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND uploaded_by = auth.uid()
  AND status = 'pending'
  AND public.is_village_resident(village_id)
  AND (
    album_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.photo_albums a
      WHERE a.id = album_id
        AND a.village_id = photos.village_id
    )
  )
  AND (
    contest_id IS NULL
    OR (
      public.konkurs_foto_przyjmuje_zgloszenia(contest_id)
      AND EXISTS (
        SELECT 1
        FROM public.village_photo_contests c
        WHERE c.id = contest_id
          AND c.village_id = photos.village_id
      )
    )
  )
);

DROP POLICY IF EXISTS "Public view approved contest photos when visible" ON public.photos;
CREATE POLICY "Public view approved contest photos when visible"
ON public.photos
FOR SELECT
USING (
  contest_id IS NOT NULL
  AND status = 'approved'
  AND visibility = 'public'
  AND EXISTS (
    SELECT 1
    FROM public.village_photo_contests c
    WHERE c.id = contest_id
      AND c.status IN ('voting', 'closed')
  )
);

GRANT EXECUTE ON FUNCTION public.konkurs_foto_przyjmuje_zgloszenia(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.konkurs_foto_trwa_glosowanie(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.mozna_glosowac_w_konkursie_foto(UUID) TO authenticated;
