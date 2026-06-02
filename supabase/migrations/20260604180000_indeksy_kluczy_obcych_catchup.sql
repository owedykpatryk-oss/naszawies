-- Indeksy dla kluczy obcych zgłoszonych przez Supabase Database Linter (unindexed_foreign_keys).

CREATE INDEX IF NOT EXISTS idx_agri_ceny_lokalne_poi_id
  ON public.agri_ceny_lokalne (poi_id);

CREATE INDEX IF NOT EXISTS idx_agri_ceny_lokalne_reported_by
  ON public.agri_ceny_lokalne (reported_by);

CREATE INDEX IF NOT EXISTS agri_ceny_potwierdzenia_user_id_idx
  ON public.agri_ceny_potwierdzenia (user_id);

CREATE INDEX IF NOT EXISTS cemetery_grave_records_created_by_idx
  ON public.cemetery_grave_records (created_by);

CREATE INDEX IF NOT EXISTS cemetery_grave_records_moderated_by_idx
  ON public.cemetery_grave_records (moderated_by);

CREATE INDEX IF NOT EXISTS cemetery_virtual_candles_grave_record_id_idx
  ON public.cemetery_virtual_candles (grave_record_id);

CREATE INDEX IF NOT EXISTS community_graphic_templates_village_id_idx
  ON public.community_graphic_templates (village_id);

CREATE INDEX IF NOT EXISTS hall_recurring_bookings_created_by_idx
  ON public.hall_recurring_bookings (created_by);

CREATE INDEX IF NOT EXISTS notification_digest_queue_user_id_idx
  ON public.notification_digest_queue (user_id);

CREATE INDEX IF NOT EXISTS platform_user_feedback_admin_updated_by_idx
  ON public.platform_user_feedback (admin_updated_by);

CREATE INDEX IF NOT EXISTS platform_user_feedback_village_id_idx
  ON public.platform_user_feedback (village_id);

CREATE INDEX IF NOT EXISTS poi_proposals_created_poi_id_idx
  ON public.poi_proposals (created_poi_id);

CREATE INDEX IF NOT EXISTS poi_proposals_reviewed_by_idx
  ON public.poi_proposals (reviewed_by);

CREATE INDEX IF NOT EXISTS school_announcements_created_by_idx
  ON public.school_announcements (created_by);

CREATE INDEX IF NOT EXISTS school_announcements_school_group_id_idx
  ON public.school_announcements (school_group_id);

CREATE INDEX IF NOT EXISTS user_resident_reminder_prefs_village_id_idx
  ON public.user_resident_reminder_prefs (village_id);

CREATE INDEX IF NOT EXISTS village_alerts_created_by_idx
  ON public.village_alerts (created_by);

CREATE INDEX IF NOT EXISTS village_fitness_activities_group_id_idx
  ON public.village_fitness_activities (group_id);

CREATE INDEX IF NOT EXISTS village_history_candles_user_id_idx
  ON public.village_history_candles (user_id);

CREATE INDEX IF NOT EXISTS village_hunting_schedule_entries_created_by_idx
  ON public.village_hunting_schedule_entries (created_by);

CREATE INDEX IF NOT EXISTS village_hunting_schedule_entries_hunting_notice_id_idx
  ON public.village_hunting_schedule_entries (hunting_notice_id);

CREATE INDEX IF NOT EXISTS village_hunting_schedule_entries_organization_id_idx
  ON public.village_hunting_schedule_entries (organization_id);

CREATE INDEX IF NOT EXISTS village_hunting_schedule_entries_poi_id_idx
  ON public.village_hunting_schedule_entries (poi_id);

CREATE INDEX IF NOT EXISTS village_poll_options_poll_id_idx
  ON public.village_poll_options (poll_id);

CREATE INDEX IF NOT EXISTS village_poll_votes_option_id_idx
  ON public.village_poll_votes (option_id);

CREATE INDEX IF NOT EXISTS village_poll_votes_voter_user_id_idx
  ON public.village_poll_votes (voter_user_id);

CREATE INDEX IF NOT EXISTS village_polls_utworzone_przez_idx
  ON public.village_polls (utworzone_przez);

CREATE INDEX IF NOT EXISTS village_resident_reminders_created_by_idx
  ON public.village_resident_reminders (created_by);
