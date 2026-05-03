-- Subskrypcje Web Push (VAPID) — zapis z przeglądarki po zalogowaniu; wysyłka z backendu w osobnym kroku.

CREATE TABLE IF NOT EXISTS public.user_web_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_web_push_endpoint_len CHECK (char_length(endpoint) <= 4096),
  CONSTRAINT user_web_push_p256dh_len CHECK (char_length(keys_p256dh) <= 2000),
  CONSTRAINT user_web_push_auth_len CHECK (char_length(keys_auth) <= 500)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_web_push_user_endpoint
  ON public.user_web_push_subscriptions(user_id, endpoint);
CREATE INDEX IF NOT EXISTS idx_user_web_push_user ON public.user_web_push_subscriptions(user_id);

DROP TRIGGER IF EXISTS update_user_web_push_subscriptions_updated_at ON public.user_web_push_subscriptions;
CREATE TRIGGER update_user_web_push_subscriptions_updated_at
BEFORE UPDATE ON public.user_web_push_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.user_web_push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own web push subscriptions" ON public.user_web_push_subscriptions;
CREATE POLICY "Users manage own web push subscriptions"
ON public.user_web_push_subscriptions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.user_web_push_subscriptions IS
  'Endpoint Push API + klucze; wysyłka z serwera (web-push + VAPID private) osobno.';
