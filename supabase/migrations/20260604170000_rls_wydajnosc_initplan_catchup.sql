-- Catch-up: wrap auth.* / current_setting() in (select ...) for policies added after
-- 20260531120000_rls_wydajnosc_initplan_i_polityki.sql (auth_rls_initplan linter).

DO $$
DECLARE
  pol record;
  new_qual text;
  new_with_check text;
  roles_clause text;
  permissive_clause text;
  create_sql text;
BEGIN
  FOR pol IN
    SELECT
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname IN ('public', 'storage')
      AND (
        qual ~ 'auth\.(uid|jwt|role)\(\)'
        OR with_check ~ 'auth\.(uid|jwt|role)\(\)'
        OR qual ~ 'current_setting\('
        OR with_check ~ 'current_setting\('
      )
  LOOP
    new_qual := pol.qual;
    new_with_check := pol.with_check;

    IF new_qual IS NOT NULL THEN
      new_qual := regexp_replace(new_qual, '(?<!\(select )auth\.uid\(\)', '(select auth.uid())', 'g');
      new_qual := regexp_replace(new_qual, '(?<!\(select )auth\.jwt\(\)', '(select auth.jwt())', 'g');
      new_qual := regexp_replace(new_qual, '(?<!\(select )auth\.role\(\)', '(select auth.role())', 'g');
      new_qual := regexp_replace(
        new_qual,
        '(?<!\(select )current_setting\(([^)]*)\)',
        '(select current_setting(\1))',
        'g'
      );
    END IF;

    IF new_with_check IS NOT NULL THEN
      new_with_check := regexp_replace(new_with_check, '(?<!\(select )auth\.uid\(\)', '(select auth.uid())', 'g');
      new_with_check := regexp_replace(new_with_check, '(?<!\(select )auth\.jwt\(\)', '(select auth.jwt())', 'g');
      new_with_check := regexp_replace(new_with_check, '(?<!\(select )auth\.role\(\)', '(select auth.role())', 'g');
      new_with_check := regexp_replace(
        new_with_check,
        '(?<!\(select )current_setting\(([^)]*)\)',
        '(select current_setting(\1))',
        'g'
      );
    END IF;

    IF new_qual IS NOT DISTINCT FROM pol.qual
       AND new_with_check IS NOT DISTINCT FROM pol.with_check THEN
      CONTINUE;
    END IF;

    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      pol.policyname,
      pol.schemaname,
      pol.tablename
    );

    IF pol.roles IS NOT NULL AND cardinality(pol.roles) > 0 THEN
      SELECT ' TO ' || string_agg(quote_ident(r), ', ')
      INTO roles_clause
      FROM unnest(pol.roles) AS r;
    ELSE
      roles_clause := '';
    END IF;

    permissive_clause := CASE
      WHEN pol.permissive = 'RESTRICTIVE' THEN ' AS RESTRICTIVE'
      ELSE ''
    END;

    create_sql := format(
      'CREATE POLICY %I ON %I.%I%s FOR %s%s',
      pol.policyname,
      pol.schemaname,
      pol.tablename,
      permissive_clause,
      pol.cmd,
      COALESCE(roles_clause, '')
    );

    IF new_qual IS NOT NULL THEN
      create_sql := create_sql || format(' USING (%s)', new_qual);
    END IF;

    IF new_with_check IS NOT NULL THEN
      create_sql := create_sql || format(' WITH CHECK (%s)', new_with_check);
    END IF;

    EXECUTE create_sql;
  END LOOP;
END $$;
