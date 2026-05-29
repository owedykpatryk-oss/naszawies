-- POI ↔ sala świetlicy; kalendarz sal tylko od sołtysa (bez wniosków mieszkańców)

ALTER TABLE public.pois
  ADD COLUMN IF NOT EXISTS linked_hall_id UUID REFERENCES public.halls(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.pois.linked_hall_id IS 'Powiązana sala świetlicy — kalendarz zajętości z tej sali na mapie POI';

CREATE INDEX IF NOT EXISTS idx_pois_linked_hall ON public.pois(linked_hall_id) WHERE linked_hall_id IS NOT NULL;

-- Mieszkańcy nie składają już wniosków online — kalendarz uzupełnia sołtys
DROP POLICY IF EXISTS "Authenticated users book halls" ON public.hall_bookings;

CREATE POLICY "Soltys inserts hall bookings"
ON public.hall_bookings FOR INSERT
WITH CHECK (
  hall_id IN (SELECT id FROM public.halls WHERE public.is_village_soltys(village_id))
);

CREATE POLICY "Soltys deletes hall bookings"
ON public.hall_bookings FOR DELETE
USING (
  hall_id IN (SELECT id FROM public.halls WHERE public.is_village_soltys(village_id))
);

-- Publiczny kalendarz: tylko potwierdzone wpisy (sołtys)
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
    AND b.status = 'approved'
  ORDER BY b.start_at;
$$;

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
    AND b.status = 'approved'
  ORDER BY h.name, b.start_at;
$$;

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
      AND b.status = 'approved'
      AND b.start_at < p_end
      AND b.end_at > p_start
  );
$$;
