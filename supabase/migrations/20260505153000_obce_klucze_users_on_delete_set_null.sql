-- Spójne ON DELETE SET NULL dla odwołań do public.users, które wcześniej blokowały usunięcie konta
-- (moderator / osoba akceptująca / przypisany bez CASCADE).

ALTER TABLE public.user_village_roles DROP CONSTRAINT IF EXISTS user_village_roles_verified_by_fkey;
ALTER TABLE public.user_village_roles
  ADD CONSTRAINT user_village_roles_verified_by_fkey
  FOREIGN KEY (verified_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_moderated_by_fkey;
ALTER TABLE public.posts
  ADD CONSTRAINT posts_moderated_by_fkey
  FOREIGN KEY (moderated_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_moderated_by_fkey;
ALTER TABLE public.comments
  ADD CONSTRAINT comments_moderated_by_fkey
  FOREIGN KEY (moderated_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.hall_bookings DROP CONSTRAINT IF EXISTS hall_bookings_approved_by_fkey;
ALTER TABLE public.hall_bookings
  ADD CONSTRAINT hall_bookings_approved_by_fkey
  FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.entities DROP CONSTRAINT IF EXISTS entities_approved_by_fkey;
ALTER TABLE public.entities
  ADD CONSTRAINT entities_approved_by_fkey
  FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.issues DROP CONSTRAINT IF EXISTS issues_assigned_to_fkey;
ALTER TABLE public.issues
  ADD CONSTRAINT issues_assigned_to_fkey
  FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.photos DROP CONSTRAINT IF EXISTS photos_moderated_by_fkey;
ALTER TABLE public.photos
  ADD CONSTRAINT photos_moderated_by_fkey
  FOREIGN KEY (moderated_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.moderation_reports DROP CONSTRAINT IF EXISTS moderation_reports_reviewed_by_fkey;
ALTER TABLE public.moderation_reports
  ADD CONSTRAINT moderation_reports_reviewed_by_fkey
  FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.audit_log DROP CONSTRAINT IF EXISTS audit_log_user_id_fkey;
ALTER TABLE public.audit_log
  ADD CONSTRAINT audit_log_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.village_blog_posts DROP CONSTRAINT IF EXISTS village_blog_posts_moderated_by_fkey;
ALTER TABLE public.village_blog_posts
  ADD CONSTRAINT village_blog_posts_moderated_by_fkey
  FOREIGN KEY (moderated_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.village_history_entries DROP CONSTRAINT IF EXISTS village_history_entries_moderated_by_fkey;
ALTER TABLE public.village_history_entries
  ADD CONSTRAINT village_history_entries_moderated_by_fkey
  FOREIGN KEY (moderated_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.marketplace_listings DROP CONSTRAINT IF EXISTS marketplace_listings_moderated_by_fkey;
ALTER TABLE public.marketplace_listings
  ADD CONSTRAINT marketplace_listings_moderated_by_fkey
  FOREIGN KEY (moderated_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.local_news_items DROP CONSTRAINT IF EXISTS local_news_items_moderated_by_fkey;
ALTER TABLE public.local_news_items
  ADD CONSTRAINT local_news_items_moderated_by_fkey
  FOREIGN KEY (moderated_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.village_community_events DROP CONSTRAINT IF EXISTS village_community_events_moderated_by_fkey;
ALTER TABLE public.village_community_events
  ADD CONSTRAINT village_community_events_moderated_by_fkey
  FOREIGN KEY (moderated_by) REFERENCES public.users(id) ON DELETE SET NULL;
