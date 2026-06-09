-- Komentarze publiczne pod wpisami kroniki + odczyt publicznych dyskusji wsi.

CREATE TABLE IF NOT EXISTS public.village_history_entry_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.village_history_entries(id) ON DELETE CASCADE,
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'visible' CHECK (status IN ('visible', 'hidden', 'pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT village_history_comment_body_len CHECK (char_length(trim(body)) BETWEEN 1 AND 600)
);

CREATE INDEX IF NOT EXISTS idx_village_history_comments_entry
  ON public.village_history_entry_comments(entry_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_village_history_comments_village
  ON public.village_history_entry_comments(village_id, status);

DROP TRIGGER IF EXISTS update_village_history_entry_comments_updated_at ON public.village_history_entry_comments;
CREATE TRIGGER update_village_history_entry_comments_updated_at
BEFORE UPDATE ON public.village_history_entry_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.village_history_entry_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public visible history entry comments" ON public.village_history_entry_comments;
CREATE POLICY "Public visible history entry comments"
ON public.village_history_entry_comments
FOR SELECT
USING (
  status = 'visible'
  AND EXISTS (
    SELECT 1
    FROM public.village_history_entries e
    WHERE e.id = entry_id
      AND e.status = 'approved'::publication_status
  )
);

DROP POLICY IF EXISTS "Members create history entry comments" ON public.village_history_entry_comments;
CREATE POLICY "Members create history entry comments"
ON public.village_history_entry_comments
FOR INSERT
WITH CHECK (
  auth.uid() = author_id
  AND status IN ('visible', 'pending')
  AND (
    public.is_village_resident(village_id)
    OR public.is_village_soltys(village_id)
    OR EXISTS (
      SELECT 1 FROM public.user_follows uf
      WHERE uf.user_id = auth.uid() AND uf.village_id = village_history_entry_comments.village_id
    )
  )
  AND EXISTS (
    SELECT 1
    FROM public.village_history_entries e
    WHERE e.id = entry_id
      AND e.village_id = village_history_entry_comments.village_id
      AND e.status = 'approved'::publication_status
  )
);

DROP POLICY IF EXISTS "Authors edit own history comments" ON public.village_history_entry_comments;
CREATE POLICY "Authors edit own history comments"
ON public.village_history_entry_comments
FOR UPDATE
USING (author_id = auth.uid() AND status = 'visible')
WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "Soltys moderates history entry comments" ON public.village_history_entry_comments;
CREATE POLICY "Soltys moderates history entry comments"
ON public.village_history_entry_comments
FOR ALL
USING (public.is_village_soltys(village_id))
WITH CHECK (public.is_village_soltys(village_id));

-- Publiczne dyskusje (visibility = public) widoczne bez roli mieszkańca.
DROP POLICY IF EXISTS "Public view public discussion threads" ON public.village_discussion_threads;
CREATE POLICY "Public view public discussion threads"
ON public.village_discussion_threads
FOR SELECT
USING (visibility = 'public' AND status IN ('open', 'closed'));

DROP POLICY IF EXISTS "Public view comments on public threads" ON public.village_discussion_comments;
CREATE POLICY "Public view comments on public threads"
ON public.village_discussion_comments
FOR SELECT
USING (
  status = 'visible'
  AND EXISTS (
    SELECT 1
    FROM public.village_discussion_threads t
    WHERE t.id = thread_id
      AND t.visibility = 'public'
      AND t.status IN ('open', 'closed')
  )
);

COMMENT ON TABLE public.village_history_entry_comments IS
  'Komentarze mieszkańców i obserwujących pod publicznymi wpisami kroniki wsi.';
