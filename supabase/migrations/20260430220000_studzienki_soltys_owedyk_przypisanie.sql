-- Sołectwo Studzienki (TERYT 0088390): przypisanie oficjalnego sołtysa Tadeusza Owedyk (konto po e-mailu).
-- Wymaga, aby użytkownik był już w auth.users (najpierw rejestracja na tadeusz.owedyk@gmail.com).
-- Jeśli wiersz zostanie pominięty (brak konta), uruchom ponownie po rejestracji albo wykonaj w SQL Editor w Supabase.

DO $$
DECLARE
  vid   uuid;
  uid   uuid;
  istnieje_inny_aktywny boolean;
BEGIN
  SELECT id INTO vid
  FROM public.villages
  WHERE teryt_id = '0088390'
  LIMIT 1;

  IF vid IS NULL THEN
    RAISE NOTICE 'M004: brak wsi Studzienki (0088390) — wykonaj seed wsi.';
    RETURN;
  END IF;

  SELECT u.id
  INTO uid
  FROM auth.users au
  JOIN public.users u ON u.id = au.id
  WHERE lower(au.email) = lower('tadeusz.owedyk@gmail.com')
  LIMIT 1;

  IF uid IS NULL THEN
    RAISE NOTICE 'M004: brak użytkownika auth/public.users dla tadeusz.owedyk@gmail.com — użytkownik musi zarejestrować konto, potem powtórz migrację (lub wstaw wiersz ręcznie).';
    RETURN;
  END IF;

  UPDATE public.users
  SET display_name = 'Tadeusz Owedyk',
      updated_at = now()
  WHERE id = uid;

  SELECT EXISTS (
    SELECT 1
    FROM public.user_village_roles
    WHERE village_id = vid
      AND role = 'soltys'
      AND status = 'active'
      AND user_id IS DISTINCT FROM uid
  ) INTO istnieje_inny_aktywny;

  IF istnieje_inny_aktywny THEN
    UPDATE public.user_village_roles
    SET
      status = 'suspended',
      updated_at = now(),
      verification_notes = coalesce(verification_notes, '') || ' [M004: zwolniono na rzecz przypisanego sołtysa bazy]'
    WHERE village_id = vid
      AND role = 'soltys'
      AND status = 'active'
      AND user_id IS DISTINCT FROM uid;
  END IF;

  INSERT INTO public.user_village_roles (user_id, village_id, role, status, verification_notes, verified_at, verified_by)
  VALUES (uid, vid, 'soltys', 'active', 'Oficjalny sołtys sołectwa (Kcynia / BIP) — przypisanie inicjujące platformę.', now(), uid)
  ON CONFLICT (user_id, village_id, role)
  DO UPDATE SET
    status = 'active',
    verification_notes = EXCLUDED.verification_notes,
    verified_at = now(),
    verified_by = EXCLUDED.verified_by,
    updated_at = now();

  RAISE NOTICE 'M004: przypisano sołtysa Studzienki: user_id=%, village_id=%', uid, vid;
END $$;
