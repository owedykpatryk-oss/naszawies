-- Zajęty asortyment w nakładających się rezerwacjach (pending + approved)

CREATE OR REPLACE FUNCTION public.hall_inventory_zajete_w_przedziale(
  p_hall_id uuid,
  p_start timestamptz,
  p_end timestamptz,
  p_exclude_booking_id uuid DEFAULT NULL
)
RETURNS TABLE(inventory_id uuid, quantity_sum bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (elem->>'inventoryId')::uuid AS inventory_id,
    COALESCE(SUM((elem->>'quantity')::int), 0)::bigint AS quantity_sum
  FROM public.hall_bookings b
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE
      WHEN jsonb_typeof(b.requested_inventory) = 'array' THEN b.requested_inventory
      ELSE '[]'::jsonb
    END
  ) AS elem
  WHERE b.hall_id = p_hall_id
    AND b.status IN ('pending', 'approved')
    AND b.start_at < p_end
    AND b.end_at > p_start
    AND (p_exclude_booking_id IS NULL OR b.id <> p_exclude_booking_id)
    AND (elem->>'inventoryId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    AND COALESCE((elem->>'quantity')::int, 0) > 0
  GROUP BY (elem->>'inventoryId')::uuid;
$$;

COMMENT ON FUNCTION public.hall_inventory_zajete_w_przedziale IS
  'Suma requested_inventory z rezerwacji pending/approved nakładających się na podany przedział.';

GRANT EXECUTE ON FUNCTION public.hall_inventory_zajete_w_przedziale(uuid, timestamptz, timestamptz, uuid) TO authenticated;
