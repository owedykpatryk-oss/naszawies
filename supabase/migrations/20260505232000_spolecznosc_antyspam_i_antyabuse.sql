-- Antyspam / antyabuse dla społeczności mieszkańców

-- Jedno otwarte zgłoszenie na użytkownika dla tej samej treści.
CREATE UNIQUE INDEX IF NOT EXISTS ux_village_content_reports_open_unique
ON public.village_content_reports (reporter_id, content_type, content_id)
WHERE status = 'open';

-- Szybkie filtrowanie pod limity czasowe.
CREATE INDEX IF NOT EXISTS idx_discussion_threads_author_created
ON public.village_discussion_threads (author_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_discussion_comments_author_created
ON public.village_discussion_comments (author_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_reports_reporter_created
ON public.village_content_reports (reporter_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_blog_posts_author_created
ON public.village_blog_posts (author_id, created_at DESC);
