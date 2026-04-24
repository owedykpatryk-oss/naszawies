-- Kalendarz świetlicy: publicznie i dla mieszkańców — tylko przedziały „zajęte”
-- (status pending/approved) bez wynajmującego i bez szczegółów. Pełne dane wyłącznie przez
-- istniejące RLS: własna rezerwacja (booked_by) + sołtys (wszystkie kolumny).

-- 1) Widok „zajęte terminy” dla sali w aktywnej wsi (dla anona i zalogowanych innych wsi bezpiecznie: brak PII).
CREATE OR REPLACE FUNCTION public.hall_kalendarz_zajetosci_publiczny(p_hall_id uuid)
RETURNS TABLE (start_at timestamptz, end_at timestamptz, status public.booking_status)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT b.start_at, b.end_at, b.status
  FROM public.hall_bookings b
  INNER JOIN public.halls h ON h.id = b.hall_id
  INNER JOIN public.villages v ON v.id = h.village_id
  WHERE b.hall_id = p_hall_id
    AND v.is_active = true
    AND b.status IN ('pending', 'approved')
  ORDER BY b.start_at;
$$;

-- 2) Wszystkie zarezerwowane przedziały w salach danej (aktywnej) wsi — profil publiczny.
CREATE OR REPLACE FUNCTION public.wies_kalendarz_zajetosci_sal_publiczny(p_village_id uuid)
RETURNS TABLE (
  hall_id uuid,
  hall_name text,
  start_at timestamptz,
  end_at timestamptz,
  status public.booking_status
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT h.id, h.name, b.start_at, b.end_at, b.status
  FROM public.hall_bookings b
  INNER JOIN public.halls h ON h.id = b.hall_id
  INNER JOIN public.villages v ON v.id = h.village_id
  WHERE h.village_id = p_village_id
    AND v.is_active = true
    AND b.status IN ('pending', 'approved')
  ORDER BY h.name, b.start_at;
$$;

-- 3) Sprawdzenie kolizji terminu (pending + approved) — omija ograniczenia RLS przy SELECT
-- z poziomu klienta, żeby mieszkaniec mógł uczciwie wykryć nakład z cudzymi wnioskami.
CREATE OR REPLACE FUNCTION public.hall_ma_kolizje_terminu(
  p_hall_id uuid,
  p_start timestamptz,
  p_end timestamptz
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.hall_bookings b
    WHERE b.hall_id = p_hall_id
      AND b.status IN ('pending', 'approved')
      AND b.start_at < p_end
      AND b.end_at > p_start
  );
$$;

REVOKE ALL ON FUNCTION public.hall_kalendarz_zajetosci_publiczny(uuid) FROM public;
REVOKE ALL ON FUNCTION public.wies_kalendarz_zajetosci_sal_publiczny(uuid) FROM public;
REVOKE ALL ON FUNCTION public.hall_ma_kolizje_terminu(uuid, timestamptz, timestamptz) FROM public;

GRANT EXECUTE ON FUNCTION public.hall_kalendarz_zajetosci_publiczny(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wies_kalendarz_zajetosci_sal_publiczny(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hall_ma_kolizje_terminu(uuid, timestamptz, timestamptz) TO authenticated;
