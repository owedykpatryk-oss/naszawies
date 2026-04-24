-- Naprawa kont bez wiersza public.users (np. przed triggerem) — jednorazowy INSERT własnego id.
DROP POLICY IF EXISTS "Users insert own profile row" ON public.users;
CREATE POLICY "Users insert own profile row"
ON public.users FOR INSERT
WITH CHECK (auth.uid() = id);
