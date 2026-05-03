-- Rozszerzenie społeczności:
-- - dyskusje mieszkańców (wątki, komentarze, głosy)
-- - zgłaszanie treści
-- - podstawowa moderacja sołtysa

CREATE TABLE IF NOT EXISTS public.village_discussion_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'ogolne',
  visibility TEXT NOT NULL DEFAULT 'village' CHECK (visibility IN ('village', 'public')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'hidden', 'archived')),
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  comment_count INTEGER NOT NULL DEFAULT 0,
  vote_score INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  moderation_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.village_discussion_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.village_discussion_threads(id) ON DELETE CASCADE,
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'visible' CHECK (status IN ('visible', 'hidden')),
  parent_comment_id UUID REFERENCES public.village_discussion_comments(id) ON DELETE CASCADE,
  moderation_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.village_discussion_votes (
  thread_id UUID NOT NULL REFERENCES public.village_discussion_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vote SMALLINT NOT NULL CHECK (vote IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (thread_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.village_content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('thread', 'comment', 'blog_post')),
  content_id UUID NOT NULL,
  reason TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'rejected')),
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_village_disc_threads_village ON public.village_discussion_threads(village_id);
CREATE INDEX IF NOT EXISTS idx_village_disc_threads_activity ON public.village_discussion_threads(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_village_disc_threads_status ON public.village_discussion_threads(status);

CREATE INDEX IF NOT EXISTS idx_village_disc_comments_thread ON public.village_discussion_comments(thread_id);
CREATE INDEX IF NOT EXISTS idx_village_disc_comments_village ON public.village_discussion_comments(village_id);
CREATE INDEX IF NOT EXISTS idx_village_disc_comments_status ON public.village_discussion_comments(status);

CREATE INDEX IF NOT EXISTS idx_village_disc_votes_user ON public.village_discussion_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_village_content_reports_village_status ON public.village_content_reports(village_id, status);
CREATE INDEX IF NOT EXISTS idx_village_content_reports_content ON public.village_content_reports(content_type, content_id);

DROP TRIGGER IF EXISTS update_village_discussion_threads_updated_at ON public.village_discussion_threads;
CREATE TRIGGER update_village_discussion_threads_updated_at
BEFORE UPDATE ON public.village_discussion_threads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_village_discussion_comments_updated_at ON public.village_discussion_comments;
CREATE TRIGGER update_village_discussion_comments_updated_at
BEFORE UPDATE ON public.village_discussion_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_village_discussion_votes_updated_at ON public.village_discussion_votes;
CREATE TRIGGER update_village_discussion_votes_updated_at
BEFORE UPDATE ON public.village_discussion_votes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_village_content_reports_updated_at ON public.village_content_reports;
CREATE TRIGGER update_village_content_reports_updated_at
BEFORE UPDATE ON public.village_content_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.refresh_discussion_thread_counters(p_thread_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_comment_count INTEGER;
  v_vote_score INTEGER;
  v_last_comment_at TIMESTAMPTZ;
BEGIN
  SELECT COUNT(*)::INTEGER, MAX(created_at)
  INTO v_comment_count, v_last_comment_at
  FROM public.village_discussion_comments
  WHERE thread_id = p_thread_id
    AND status = 'visible';

  SELECT COALESCE(SUM(vote), 0)::INTEGER
  INTO v_vote_score
  FROM public.village_discussion_votes
  WHERE thread_id = p_thread_id;

  UPDATE public.village_discussion_threads t
  SET comment_count = COALESCE(v_comment_count, 0),
      vote_score = COALESCE(v_vote_score, 0),
      last_activity_at = COALESCE(v_last_comment_at, t.updated_at, t.created_at)
  WHERE t.id = p_thread_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.on_discussion_comment_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_discussion_thread_counters(OLD.thread_id);
  ELSE
    PERFORM public.refresh_discussion_thread_counters(NEW.thread_id);
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.on_discussion_vote_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_discussion_thread_counters(OLD.thread_id);
  ELSE
    PERFORM public.refresh_discussion_thread_counters(NEW.thread_id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_discussion_comment_change ON public.village_discussion_comments;
CREATE TRIGGER trg_discussion_comment_change
AFTER INSERT OR UPDATE OR DELETE ON public.village_discussion_comments
FOR EACH ROW EXECUTE FUNCTION public.on_discussion_comment_change();

DROP TRIGGER IF EXISTS trg_discussion_vote_change ON public.village_discussion_votes;
CREATE TRIGGER trg_discussion_vote_change
AFTER INSERT OR UPDATE OR DELETE ON public.village_discussion_votes
FOR EACH ROW EXECUTE FUNCTION public.on_discussion_vote_change();

ALTER TABLE public.village_discussion_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.village_discussion_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.village_discussion_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.village_content_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view discussion threads" ON public.village_discussion_threads;
CREATE POLICY "Members view discussion threads"
ON public.village_discussion_threads
FOR SELECT
USING (
  status IN ('open', 'closed')
  AND (
    public.is_village_resident(village_id)
    OR public.is_village_soltys(village_id)
    OR EXISTS (
      SELECT 1
      FROM public.user_follows uf
      WHERE uf.user_id = auth.uid()
        AND uf.village_id = village_id
    )
  )
);

DROP POLICY IF EXISTS "Members create discussion threads" ON public.village_discussion_threads;
CREATE POLICY "Members create discussion threads"
ON public.village_discussion_threads
FOR INSERT
WITH CHECK (
  auth.uid() = author_id
  AND (
    public.is_village_resident(village_id)
    OR public.is_village_soltys(village_id)
  )
);

DROP POLICY IF EXISTS "Authors edit own open threads" ON public.village_discussion_threads;
CREATE POLICY "Authors edit own open threads"
ON public.village_discussion_threads
FOR UPDATE
USING (author_id = auth.uid() AND status = 'open')
WITH CHECK (author_id = auth.uid() AND status IN ('open', 'closed'));

DROP POLICY IF EXISTS "Soltys moderates discussion threads" ON public.village_discussion_threads;
CREATE POLICY "Soltys moderates discussion threads"
ON public.village_discussion_threads
FOR ALL
USING (public.is_village_soltys(village_id))
WITH CHECK (public.is_village_soltys(village_id));

DROP POLICY IF EXISTS "Members view visible discussion comments" ON public.village_discussion_comments;
CREATE POLICY "Members view visible discussion comments"
ON public.village_discussion_comments
FOR SELECT
USING (
  status = 'visible'
  AND EXISTS (
    SELECT 1
    FROM public.village_discussion_threads t
    WHERE t.id = thread_id
      AND t.status IN ('open', 'closed')
      AND (
        public.is_village_resident(t.village_id)
        OR public.is_village_soltys(t.village_id)
        OR EXISTS (
          SELECT 1
          FROM public.user_follows uf
          WHERE uf.user_id = auth.uid()
            AND uf.village_id = t.village_id
        )
      )
  )
);

DROP POLICY IF EXISTS "Members create discussion comments" ON public.village_discussion_comments;
CREATE POLICY "Members create discussion comments"
ON public.village_discussion_comments
FOR INSERT
WITH CHECK (
  auth.uid() = author_id
  AND (
    public.is_village_resident(village_id)
    OR public.is_village_soltys(village_id)
  )
);

DROP POLICY IF EXISTS "Authors edit own comments" ON public.village_discussion_comments;
CREATE POLICY "Authors edit own comments"
ON public.village_discussion_comments
FOR UPDATE
USING (author_id = auth.uid() AND status = 'visible')
WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "Authors delete own comments" ON public.village_discussion_comments;
CREATE POLICY "Authors delete own comments"
ON public.village_discussion_comments
FOR DELETE
USING (author_id = auth.uid());

DROP POLICY IF EXISTS "Soltys moderates discussion comments" ON public.village_discussion_comments;
CREATE POLICY "Soltys moderates discussion comments"
ON public.village_discussion_comments
FOR ALL
USING (public.is_village_soltys(village_id))
WITH CHECK (public.is_village_soltys(village_id));

DROP POLICY IF EXISTS "Users read own votes" ON public.village_discussion_votes;
CREATE POLICY "Users read own votes"
ON public.village_discussion_votes
FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users manage own votes in their villages" ON public.village_discussion_votes;
CREATE POLICY "Users manage own votes in their villages"
ON public.village_discussion_votes
FOR ALL
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.village_discussion_threads t
    WHERE t.id = thread_id
      AND (
        public.is_village_resident(t.village_id)
        OR public.is_village_soltys(t.village_id)
      )
  )
)
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.village_discussion_threads t
    WHERE t.id = thread_id
      AND (
        public.is_village_resident(t.village_id)
        OR public.is_village_soltys(t.village_id)
      )
  )
);

DROP POLICY IF EXISTS "Reporter or soltys view reports" ON public.village_content_reports;
CREATE POLICY "Reporter or soltys view reports"
ON public.village_content_reports
FOR SELECT
USING (
  reporter_id = auth.uid()
  OR public.is_village_soltys(village_id)
);

DROP POLICY IF EXISTS "Members create reports" ON public.village_content_reports;
CREATE POLICY "Members create reports"
ON public.village_content_reports
FOR INSERT
WITH CHECK (
  reporter_id = auth.uid()
  AND (
    public.is_village_resident(village_id)
    OR public.is_village_soltys(village_id)
    OR EXISTS (
      SELECT 1
      FROM public.user_follows uf
      WHERE uf.user_id = auth.uid()
        AND uf.village_id = village_id
    )
  )
);

DROP POLICY IF EXISTS "Soltys reviews reports" ON public.village_content_reports;
CREATE POLICY "Soltys reviews reports"
ON public.village_content_reports
FOR UPDATE
USING (public.is_village_soltys(village_id))
WITH CHECK (public.is_village_soltys(village_id));

-- Zaostrzenie polityk bloga: autor/bloger musi być członkiem tej wsi.
DROP POLICY IF EXISTS "Owner manages own blogger profile" ON public.village_bloggers;
CREATE POLICY "Owner manages own blogger profile"
ON public.village_bloggers
FOR ALL
USING (
  user_id = auth.uid()
  AND (
    public.is_village_resident(village_id)
    OR public.is_village_soltys(village_id)
  )
)
WITH CHECK (
  user_id = auth.uid()
  AND (
    public.is_village_resident(village_id)
    OR public.is_village_soltys(village_id)
  )
);

DROP POLICY IF EXISTS "Authors manage own blog posts" ON public.village_blog_posts;
CREATE POLICY "Authors manage own blog posts"
ON public.village_blog_posts
FOR ALL
USING (
  author_id = auth.uid()
  AND (
    public.is_village_resident(village_id)
    OR public.is_village_soltys(village_id)
  )
)
WITH CHECK (
  author_id = auth.uid()
  AND (
    public.is_village_resident(village_id)
    OR public.is_village_soltys(village_id)
  )
);
