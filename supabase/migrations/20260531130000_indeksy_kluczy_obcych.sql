-- Indeksy na kolumnach kluczy obcych (Supabase linter: unindexed_foreign_keys)

CREATE INDEX IF NOT EXISTS idx_bus_departures_cache_poi_id
  ON public.bus_departures_cache (poi_id);

CREATE INDEX IF NOT EXISTS chat_conversations_created_by_idx
  ON public.chat_conversations (created_by);

CREATE INDEX IF NOT EXISTS chat_messages_sender_id_idx
  ON public.chat_messages (sender_id);

CREATE INDEX IF NOT EXISTS marketplace_listings_sales_poi_id_idx
  ON public.marketplace_listings (sales_poi_id);

CREATE INDEX IF NOT EXISTS neighbor_help_offers_author_user_id_idx
  ON public.neighbor_help_offers (author_user_id);

CREATE INDEX IF NOT EXISTS poi_comments_author_id_idx
  ON public.poi_comments (author_id);

CREATE INDEX IF NOT EXISTS site_feedback_reports_user_id_idx
  ON public.site_feedback_reports (user_id);

CREATE INDEX IF NOT EXISTS soltys_village_applications_village_id_idx
  ON public.soltys_village_applications (village_id);

CREATE INDEX IF NOT EXISTS soltys_village_applications_reviewed_by_idx
  ON public.soltys_village_applications (reviewed_by);

CREATE INDEX IF NOT EXISTS village_graphic_designs_booking_id_idx
  ON public.village_graphic_designs (booking_id);

CREATE INDEX IF NOT EXISTS village_graphic_designs_linked_event_id_idx
  ON public.village_graphic_designs (linked_event_id);

CREATE INDEX IF NOT EXISTS village_graphic_designs_linked_post_id_idx
  ON public.village_graphic_designs (linked_post_id);

CREATE INDEX IF NOT EXISTS village_hunting_notices_created_by_idx
  ON public.village_hunting_notices (created_by);

CREATE INDEX IF NOT EXISTS village_hunting_notices_moderated_by_idx
  ON public.village_hunting_notices (moderated_by);

CREATE INDEX IF NOT EXISTS village_photo_contests_winner_photo_id_idx
  ON public.village_photo_contests (winner_photo_id);

CREATE INDEX IF NOT EXISTS village_photo_contests_created_by_idx
  ON public.village_photo_contests (created_by);

CREATE INDEX IF NOT EXISTS village_photo_votes_user_id_idx
  ON public.village_photo_votes (user_id);

CREATE INDEX IF NOT EXISTS village_soltys_calendar_entries_created_by_idx
  ON public.village_soltys_calendar_entries (created_by);
