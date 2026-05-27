-- Rynek: zapisane ogłoszenia, licznik nieprzeczytanych w czacie.

ALTER TABLE public.user_saved_content
  DROP CONSTRAINT IF EXISTS user_saved_content_content_type_check;

ALTER TABLE public.user_saved_content
  ADD CONSTRAINT user_saved_content_content_type_check
  CHECK (content_type IN ('post', 'event', 'listing'));

CREATE OR REPLACE FUNCTION public.chat_unread_total(p_user_id uuid DEFAULT auth.uid())
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::bigint
  FROM public.chat_messages m
  INNER JOIN public.chat_members cm ON cm.conversation_id = m.conversation_id
  WHERE cm.user_id = p_user_id
    AND m.sender_id <> p_user_id
    AND m.created_at > coalesce(cm.last_read_at, '1970-01-01'::timestamptz);
$$;

REVOKE ALL ON FUNCTION public.chat_unread_total(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.chat_unread_total(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.chat_unread_by_conversation(p_user_id uuid DEFAULT auth.uid())
RETURNS TABLE (conversation_id uuid, unread_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cm.conversation_id,
    count(*)::bigint AS unread_count
  FROM public.chat_members cm
  INNER JOIN public.chat_messages m ON m.conversation_id = cm.conversation_id
  WHERE cm.user_id = p_user_id
    AND m.sender_id <> p_user_id
    AND m.created_at > coalesce(cm.last_read_at, '1970-01-01'::timestamptz)
  GROUP BY cm.conversation_id;
$$;

REVOKE ALL ON FUNCTION public.chat_unread_by_conversation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.chat_unread_by_conversation(uuid) TO authenticated;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;
