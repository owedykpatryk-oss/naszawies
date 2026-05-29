-- Bezpieczeństwo: globalna automatyzacja tylko service_role (cron).
-- Sołtys: wersja ograniczona do jednej wsi z kontrolą is_village_soltys().

REVOKE EXECUTE ON FUNCTION public.run_village_automation() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.run_village_automation() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.run_village_automation() TO service_role;

CREATE OR REPLACE FUNCTION public.run_village_automation_for_village(p_village_id uuid)
RETURNS TABLE(action TEXT, affected_rows BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows BIGINT;
BEGIN
  IF p_village_id IS NULL THEN
    RAISE EXCEPTION 'Brak identyfikatora wsi.' USING ERRCODE = '22023';
  END IF;

  IF NOT public.is_village_soltys(p_village_id) THEN
    RAISE EXCEPTION 'Brak uprawnień sołtysa dla tej wsi.' USING ERRCODE = '42501';
  END IF;

  UPDATE public.marketplace_listings
  SET status = 'archived',
      archived_at = now(),
      moderation_note = COALESCE(moderation_note, 'Zarchiwizowano automatycznie po terminie ważności.')
  WHERE village_id = p_village_id
    AND status IN ('approved', 'pending')
    AND expires_at IS NOT NULL
    AND expires_at < now();
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  action := 'archive_expired_marketplace_listings';
  affected_rows := v_rows;
  RETURN NEXT;

  UPDATE public.neighbor_help_offers
  SET status = 'archived',
      moderation_note = COALESCE(moderation_note, 'Oferta pomocy wygasła automatycznie.')
  WHERE village_id = p_village_id
    AND status IN ('approved', 'pending')
    AND expires_at IS NOT NULL
    AND expires_at < now();
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  action := 'archive_expired_neighbor_help';
  affected_rows := v_rows;
  RETURN NEXT;

  UPDATE public.local_news_items
  SET status = 'archived',
      moderation_note = COALESCE(moderation_note, 'Wiadomość wygasła automatycznie.')
  WHERE village_id = p_village_id
    AND status = 'approved'
    AND expires_at IS NOT NULL
    AND expires_at < now();
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  action := 'archive_expired_local_news';
  affected_rows := v_rows;
  RETURN NEXT;

  UPDATE public.village_bloggers b
  SET is_active = false
  WHERE b.village_id = p_village_id
    AND b.is_active = true
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
  WHERE e.village_id = p_village_id
    AND e.status = 'approved'
    AND e.expires_at IS NOT NULL
    AND e.expires_at < now();
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  action := 'archive_expired_community_events';
  affected_rows := v_rows;
  RETURN NEXT;

  UPDATE public.village_funding_sources
  SET status = 'archived'
  WHERE village_id = p_village_id
    AND status = 'approved'
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
  WHERE village_id = p_village_id
    AND status = 'pending'
    AND is_automated = true
    AND created_at < now() - interval '90 days';
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  action := 'reject_stale_automated_local_news';
  affected_rows := v_rows;
  RETURN NEXT;

  UPDATE public.posts
  SET status = 'archived'
  WHERE village_id = p_village_id
    AND status = 'approved'
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
  WHERE village_id = p_village_id
    AND status = 'approved'
    AND ends_at IS NOT NULL
    AND ends_at < now() - interval '3 days';
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  action := 'archive_past_community_events_by_time';
  affected_rows := v_rows;
  RETURN NEXT;

  UPDATE public.issues i
  SET quick_flags = COALESCE(i.quick_flags, '{}'::jsonb) || jsonb_build_object('mozliwy_duplikat', true)
  WHERE i.village_id = p_village_id
    AND i.status = 'nowe'
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
END;
$$;

REVOKE ALL ON FUNCTION public.run_village_automation_for_village(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.run_village_automation_for_village(uuid) TO authenticated, service_role;

COMMENT ON FUNCTION public.run_village_automation_for_village(uuid) IS
  'Automatyzacja porządkowa tylko dla jednej wsi — wymaga aktywnej roli sołtysa/współadmina.';
