-- Rozwój: publiczne ogłoszenia wsi, pomoc sąsiedzka, zgłoszenia publiczne, szablony sołtysa, tryb UI, duplikaty.

-- 1) Posty na profilu wsi — odczyt publiczny (nie tylko targ_lokalny)
DROP POLICY IF EXISTS "Profil wsi: zatwierdzone posty publiczne" ON public.posts;
CREATE POLICY "Profil wsi: zatwierdzone posty publiczne"
ON public.posts FOR SELECT
USING (
  status = 'approved'
  AND type IN ('ogloszenie', 'wydarzenie', 'zebranie', 'awaria', 'ogloszenie_drobne')
  AND EXISTS (
    SELECT 1 FROM public.villages v
    WHERE v.id = posts.village_id AND v.is_active = true
  )
);

-- 2) Zgłoszenia rozwiązane — podsumowanie dla mieszkańców (bez danych zgłaszającego w UI)
DROP POLICY IF EXISTS "Publiczne podsumowanie rozwiazanych zgloszen" ON public.issues;
CREATE POLICY "Publiczne podsumowanie rozwiazanych zgloszen"
ON public.issues FOR SELECT
USING (
  status = 'rozwiazane'
  AND resolution_note IS NOT NULL
  AND length(trim(resolution_note)) > 0
  AND EXISTS (
    SELECT 1 FROM public.villages v
    WHERE v.id = issues.village_id AND v.is_active = true
  )
);

-- 3) Pomoc sąsiedzka
DO $$ BEGIN
  CREATE TYPE public.neighbor_help_kind AS ENUM ('szukam', 'oferuje');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.neighbor_help_category AS ENUM ('transport', 'zakupy', 'opieka', 'inne');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.neighbor_help_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  kind public.neighbor_help_kind NOT NULL,
  category public.neighbor_help_category NOT NULL DEFAULT 'inne',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  contact_hint TEXT,
  status public.publication_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  moderated_at TIMESTAMPTZ,
  moderation_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_neighbor_help_village ON public.neighbor_help_offers(village_id);
CREATE INDEX IF NOT EXISTS idx_neighbor_help_status ON public.neighbor_help_offers(status);
CREATE INDEX IF NOT EXISTS idx_neighbor_help_expires ON public.neighbor_help_offers(expires_at);

DROP TRIGGER IF EXISTS update_neighbor_help_offers_updated_at ON public.neighbor_help_offers;
CREATE TRIGGER update_neighbor_help_offers_updated_at
BEFORE UPDATE ON public.neighbor_help_offers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_set_publication_timestamp_neighbor_help ON public.neighbor_help_offers;
CREATE TRIGGER trg_set_publication_timestamp_neighbor_help
BEFORE UPDATE ON public.neighbor_help_offers
FOR EACH ROW EXECUTE FUNCTION public.set_publication_timestamp();

ALTER TABLE public.neighbor_help_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public approved neighbor help visible" ON public.neighbor_help_offers;
CREATE POLICY "Public approved neighbor help visible"
ON public.neighbor_help_offers FOR SELECT
USING (status = 'approved');

DROP POLICY IF EXISTS "Residents create neighbor help pending" ON public.neighbor_help_offers;
CREATE POLICY "Residents create neighbor help pending"
ON public.neighbor_help_offers FOR INSERT
WITH CHECK (
  author_user_id = auth.uid()
  AND status = 'pending'
  AND public.is_village_resident(village_id)
);

DROP POLICY IF EXISTS "Authors manage own neighbor help pending" ON public.neighbor_help_offers;
CREATE POLICY "Authors manage own neighbor help pending"
ON public.neighbor_help_offers FOR UPDATE
USING (author_user_id = auth.uid() AND status IN ('pending', 'approved'))
WITH CHECK (author_user_id = auth.uid());

DROP POLICY IF EXISTS "Soltys moderates neighbor help" ON public.neighbor_help_offers;
CREATE POLICY "Soltys moderates neighbor help"
ON public.neighbor_help_offers FOR ALL
USING (public.is_village_soltys(village_id))
WITH CHECK (public.is_village_soltys(village_id));

-- 4) Szablony odpowiedzi sołtysa (zgłoszenia)
CREATE TABLE IF NOT EXISTS public.issue_response_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  body TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_issue_templates_village ON public.issue_response_templates(village_id);

ALTER TABLE public.issue_response_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Soltys manages issue templates" ON public.issue_response_templates;
CREATE POLICY "Soltys manages issue templates"
ON public.issue_response_templates FOR ALL
USING (public.is_village_soltys(village_id))
WITH CHECK (public.is_village_soltys(village_id));

-- 5) Tryb uproszczony w profilu użytkownika
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS ui_mode TEXT NOT NULL DEFAULT 'standard'
  CHECK (ui_mode IN ('standard', 'senior'));

COMMENT ON COLUMN public.users.ui_mode IS 'standard | senior — większa czcionka i uproszczona nawigacja.';

-- 6) Rozszerzenie automatyzacji: pomoc sąsiedzka + duplikaty zgłoszeń
CREATE OR REPLACE FUNCTION public.run_village_automation()
RETURNS TABLE(action TEXT, affected_rows BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows BIGINT;
BEGIN
  UPDATE public.marketplace_listings
  SET status = 'archived',
      archived_at = now(),
      moderation_note = COALESCE(moderation_note, 'Zarchiwizowano automatycznie po terminie ważności.')
  WHERE status IN ('approved', 'pending')
    AND expires_at IS NOT NULL
    AND expires_at < now();
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  action := 'archive_expired_marketplace_listings';
  affected_rows := v_rows;
  RETURN NEXT;

  UPDATE public.neighbor_help_offers
  SET status = 'archived',
      moderation_note = COALESCE(moderation_note, 'Oferta pomocy wygasła automatycznie.')
  WHERE status IN ('approved', 'pending')
    AND expires_at IS NOT NULL
    AND expires_at < now();
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  action := 'archive_expired_neighbor_help';
  affected_rows := v_rows;
  RETURN NEXT;

  UPDATE public.local_news_items
  SET status = 'archived',
      moderation_note = COALESCE(moderation_note, 'Wiadomość wygasła automatycznie.')
  WHERE status = 'approved'
    AND expires_at IS NOT NULL
    AND expires_at < now();
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  action := 'archive_expired_local_news';
  affected_rows := v_rows;
  RETURN NEXT;

  UPDATE public.village_bloggers b
  SET is_active = false
  WHERE b.is_active = true
    AND b.updated_at < now() - interval '365 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.village_blog_posts p
      WHERE p.blogger_id = b.id AND p.created_at > now() - interval '365 days'
    );
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  action := 'deactivate_orphan_bloggers';
  affected_rows := v_rows;
  RETURN NEXT;

  UPDATE public.village_community_events e
  SET status = 'archived',
      moderation_note = COALESCE(e.moderation_note, 'Wpis kalendarza wygasł automatycznie.')
  WHERE e.status = 'approved'
    AND e.expires_at IS NOT NULL
    AND e.expires_at < now();
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  action := 'archive_expired_community_events';
  affected_rows := v_rows;
  RETURN NEXT;

  UPDATE public.village_funding_sources
  SET status = 'archived'
  WHERE status = 'approved'
    AND application_deadline IS NOT NULL
    AND application_deadline < CURRENT_DATE;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  action := 'archive_past_funding_deadlines';
  affected_rows := v_rows;
  RETURN NEXT;

  UPDATE public.local_news_items
  SET status = 'rejected',
      moderated_at = now(),
      moderation_note = COALESCE(
        moderation_note,
        'Automatycznie odrzucono: minęło 90 dni bez decyzji sołtysa (wpis z kanału automatycznego).'
      )
  WHERE status = 'pending'
    AND is_automated = true
    AND created_at < now() - interval '90 days';
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  action := 'reject_stale_automated_local_news';
  affected_rows := v_rows;
  RETURN NEXT;

  UPDATE public.posts
  SET status = 'archived'
  WHERE status = 'approved'
    AND type IN ('wydarzenie', 'zebranie')
    AND event_end_at IS NOT NULL
    AND event_end_at < now();
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  action := 'archive_past_event_posts';
  affected_rows := v_rows;
  RETURN NEXT;

  UPDATE public.village_community_events
  SET status = 'archived',
      moderation_note = COALESCE(moderation_note, 'Wydarzenie zakończone — archiwizacja automatyczna.')
  WHERE status = 'approved'
    AND ends_at IS NOT NULL
    AND ends_at < now() - interval '3 days';
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  action := 'archive_past_community_events_by_time';
  affected_rows := v_rows;
  RETURN NEXT;

  -- Oznacz potencjalne duplikaty (nowe + ta sama kategoria + podobny tytuł w 14 dni)
  UPDATE public.issues i
  SET quick_flags = COALESCE(i.quick_flags, '{}'::jsonb) || jsonb_build_object('mozliwy_duplikat', true)
  WHERE i.status = 'nowe'
    AND NOT COALESCE((i.quick_flags->>'mozliwy_duplikat')::boolean, false)
    AND EXISTS (
      SELECT 1 FROM public.issues j
      WHERE j.village_id = i.village_id
        AND j.id <> i.id
        AND j.category = i.category
        AND j.status IN ('nowe', 'w_trakcie')
        AND j.created_at > now() - interval '14 days'
        AND lower(trim(j.title)) = lower(trim(i.title))
    );
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  action := 'flag_possible_duplicate_issues';
  affected_rows := v_rows;
  RETURN NEXT;

  DELETE FROM public.notifications
  WHERE is_read = true
    AND created_at < now() - interval '180 days';
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  action := 'purge_old_read_notifications';
  affected_rows := v_rows;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.run_village_automation() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.run_village_automation() TO authenticated, service_role;
