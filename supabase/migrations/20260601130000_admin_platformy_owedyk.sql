-- Administrator platformy: Tadeusz Owedyk (sołtys Studzienki + admin reszty serwisu).
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
      AND lower(email) IN (
        lower('admin@naszawies.pl'),
        lower('tadeusz.owedyk@gmail.com')
      )
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp;
