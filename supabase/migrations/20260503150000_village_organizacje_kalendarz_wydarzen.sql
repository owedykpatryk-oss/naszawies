-- Koła (KGW), kluby sportowe, grupy taneczne/muzyczne oraz kalendarz wydarzeń (mecze, wyjazdy, próby…)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'village_group_type'
  ) THEN
    CREATE TYPE public.village_group_type AS ENUM (
      'kgw',
      'sport',
      'taniec',
      'muzyka',
      'kolo',
      'inne'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'village_event_kind'
  ) THEN
    CREATE TYPE public.village_event_kind AS ENUM (
      'mecz',
      'wyjazd',
      'proba',
      'wystep',
      'spotkanie',
      'festyn',
      'inne'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.village_community_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  group_type public.village_group_type NOT NULL DEFAULT 'inne',
  name TEXT NOT NULL,
  short_description TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  meeting_place TEXT,
  schedule_text TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_village_community_groups_village ON public.village_community_groups(village_id);
CREATE INDEX IF NOT EXISTS idx_village_community_groups_active ON public.village_community_groups(village_id, is_active);

CREATE TABLE IF NOT EXISTS public.village_community_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.village_community_groups(id) ON DELETE SET NULL,
  event_kind public.village_event_kind NOT NULL DEFAULT 'inne',
  title TEXT NOT NULL,
  description TEXT,
  location_text TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  status public.publication_status NOT NULL DEFAULT 'pending',
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES public.users(id),
  moderated_at TIMESTAMPTZ,
  moderation_note TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_village_community_events_village ON public.village_community_events(village_id);
CREATE INDEX IF NOT EXISTS idx_village_community_events_starts ON public.village_community_events(starts_at);
CREATE INDEX IF NOT EXISTS idx_village_community_events_status ON public.village_community_events(status);

DROP TRIGGER IF EXISTS update_village_community_groups_updated_at ON public.village_community_groups;
CREATE TRIGGER update_village_community_groups_updated_at
BEFORE UPDATE ON public.village_community_groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_village_community_events_updated_at ON public.village_community_events;
CREATE TRIGGER update_village_community_events_updated_at
BEFORE UPDATE ON public.village_community_events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_set_publication_timestamp_community_events ON public.village_community_events;
CREATE TRIGGER trg_set_publication_timestamp_community_events
BEFORE UPDATE ON public.village_community_events
FOR EACH ROW EXECUTE FUNCTION public.set_publication_timestamp();

ALTER TABLE public.village_community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.village_community_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public active community groups visible" ON public.village_community_groups;
CREATE POLICY "Public active community groups visible"
ON public.village_community_groups
FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Soltys manages village community groups" ON public.village_community_groups;
CREATE POLICY "Soltys manages village community groups"
ON public.village_community_groups
FOR ALL
USING (public.is_village_soltys(village_id))
WITH CHECK (public.is_village_soltys(village_id));

DROP POLICY IF EXISTS "Public approved community events visible" ON public.village_community_events;
CREATE POLICY "Public approved community events visible"
ON public.village_community_events
FOR SELECT
USING (status = 'approved');

DROP POLICY IF EXISTS "Soltys manages village community events" ON public.village_community_events;
CREATE POLICY "Soltys manages village community events"
ON public.village_community_events
FOR ALL
USING (public.is_village_soltys(village_id))
WITH CHECK (public.is_village_soltys(village_id));

-- =========================================
-- Automatyzacja: archiwizacja wygasłych wydarzeń społecznych
-- =========================================
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
      SELECT 1
      FROM public.village_blog_posts p
      WHERE p.blogger_id = b.id
        AND p.created_at > now() - interval '365 days'
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
END;
$$;

REVOKE ALL ON FUNCTION public.run_village_automation() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.run_village_automation() TO authenticated;
