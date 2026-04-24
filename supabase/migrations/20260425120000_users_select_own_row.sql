-- Użytkownik musi móc odczytać swój wiersz public.users (np. status pending) przy edycji profilu w panelu.
DROP POLICY IF EXISTS "Users read own profile row" ON public.users;
CREATE POLICY "Users read own profile row"
ON public.users FOR SELECT
USING (auth.uid() = id);
