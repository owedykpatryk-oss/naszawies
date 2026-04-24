-- Nowa wartość enum w osobnej migracji: w jednej transakcji Postgres nie pozwala od razu użyć świeżo dodanej etykiety enum w politykach RLS (55P04).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'post_type'
      AND e.enumlabel = 'targ_lokalny'
  ) THEN
    ALTER TYPE post_type ADD VALUE 'targ_lokalny';
  END IF;
END
$$;
