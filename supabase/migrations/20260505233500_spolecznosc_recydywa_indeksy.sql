-- Wydajność dla adaptacyjnych limitów recydywy.
-- Zapytania często filtrują po (author_id, status, updated_at).

CREATE INDEX IF NOT EXISTS idx_discussion_threads_author_status_updated
ON public.village_discussion_threads (author_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_discussion_comments_author_status_updated
ON public.village_discussion_comments (author_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_blog_posts_author_status_updated
ON public.village_blog_posts (author_id, status, updated_at DESC);
