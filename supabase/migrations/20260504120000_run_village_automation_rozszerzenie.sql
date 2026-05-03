-- Rozszerzenie run_village_automation(): nabory, RSS, wydarzenia (posts + społeczność), powiadomienia.
-- Zachowujemy dotychczasowe kroki, dodajemy nowe na końcu (jedna transakcja = jedna definicja funkcji).

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

  -- Nabory / zapisy o dofinansowaniu: po minionym dniu końca naboru nie pokazujemy jako „aktualne”.
  UPDATE public.village_funding_sources
  SET status = 'archived'
  WHERE status = 'approved'
    AND application_deadline IS NOT NULL
    AND application_deadline < CURRENT_DATE;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  action := 'archive_past_funding_deadlines';
  affected_rows := v_rows;
  RETURN NEXT;

  -- RSS / automat: zaległe „pending” — porządek w kolejce moderacji (90 dni).
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

  -- Ogłoszenia typu wydarzenie / zebranie po zakończeniu (koniec wydarzenia w przeszłości).
  UPDATE public.posts
  SET status = 'archived'
  WHERE type IN ('wydarzenie', 'zebranie')
    AND status = 'approved'
    AND event_end_at IS NOT NULL
    AND event_end_at < now();
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  action := 'archive_past_event_posts';
  affected_rows := v_rows;
  RETURN NEXT;

  -- Wydarzenia organizacji (KGW itd.): bez ustawionego expires_at — archiwizacja kilka dni po starcie/końcu.
  UPDATE public.village_community_events e
  SET status = 'archived',
      moderation_note = COALESCE(e.moderation_note, 'Wydarzenie minęło — zarchiwizowano automatycznie.')
  WHERE e.status = 'approved'
    AND COALESCE(e.ends_at, e.starts_at) < (now() - interval '3 days');
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  action := 'archive_past_community_events_by_time';
  affected_rows := v_rows;
  RETURN NEXT;

  -- Powiadomienia przeczytane: retencja (oszczędność miejsca, RLS i tak per user).
  DELETE FROM public.notifications
  WHERE is_read = true
    AND read_at IS NOT NULL
    AND read_at < now() - interval '180 days';
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  action := 'purge_old_read_notifications';
  affected_rows := v_rows;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.run_village_automation() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.run_village_automation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.run_village_automation() TO service_role;

COMMENT ON FUNCTION public.run_village_automation() IS
  'Cron: marketplace/news/bloggers/community_events/funding, RSS pending 90d, posts wydarzenie, community by czas, purge notifications.';

CREATE INDEX IF NOT EXISTS idx_notifications_read_at_purge
  ON public.notifications (read_at)
  WHERE is_read = true AND read_at IS NOT NULL;
