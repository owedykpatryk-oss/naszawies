-- RLS performance: auth_rls_initplan (wrap auth.* in SELECT subquery)
-- and selected multiple_permissive_policies fixes (split redundant FOR ALL SELECT).

-- ---------------------------------------------------------------------------
-- 1) Wrap auth.uid/jwt/role in (select ...) so Postgres evaluates once per query
-- ---------------------------------------------------------------------------
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
      )
  LOOP
    new_qual := pol.qual;
    new_with_check := pol.with_check;

    IF new_qual IS NOT NULL THEN
      new_qual := regexp_replace(new_qual, '(?<!\(select )auth\.uid\(\)', '(select auth.uid())', 'g');
      new_qual := regexp_replace(new_qual, '(?<!\(select )auth\.jwt\(\)', '(select auth.jwt())', 'g');
      new_qual := regexp_replace(new_qual, '(?<!\(select )auth\.role\(\)', '(select auth.role())', 'g');
    END IF;

    IF new_with_check IS NOT NULL THEN
      new_with_check := regexp_replace(new_with_check, '(?<!\(select )auth\.uid\(\)', '(select auth.uid())', 'g');
      new_with_check := regexp_replace(new_with_check, '(?<!\(select )auth\.jwt\(\)', '(select auth.jwt())', 'g');
      new_with_check := regexp_replace(new_with_check, '(?<!\(select )auth\.role\(\)', '(select auth.role())', 'g');
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

-- ---------------------------------------------------------------------------
-- 2) Split FOR ALL policies that duplicate a separate SELECT policy (safe cases)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  pol record;
  permissive_clause text;
  split_targets text[] := ARRAY[
    'public|address_points|address_points_soltys_manage',
    'public|halls|Soltys manages halls',
    'public|hall_inventory|Soltys manages inventory',
    'public|village_news_feed_sources|Soltys manages village news feeds',
    'public|user_transport_favorite_relations|Resident manages own transport favorites',
    'public|village_discussion_votes|Users manage own votes in their villages'
  ];
  target_key text;
BEGIN
  FOREACH target_key IN ARRAY split_targets
  LOOP
    SELECT
      schemaname,
      tablename,
      policyname,
      permissive,
      qual,
      with_check
    INTO pol
    FROM pg_policies
    WHERE schemaname || '|' || tablename || '|' || policyname = target_key
      AND cmd = 'ALL';

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      pol.policyname,
      pol.schemaname,
      pol.tablename
    );

    permissive_clause := CASE
      WHEN pol.permissive = 'RESTRICTIVE' THEN ' AS RESTRICTIVE'
      ELSE ''
    END;

    IF pol.with_check IS NOT NULL THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I.%I%s FOR INSERT WITH CHECK (%s)',
        pol.policyname || ' (insert)',
        pol.schemaname,
        pol.tablename,
        permissive_clause,
        pol.with_check
      );
    ELSIF pol.qual IS NOT NULL THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I.%I%s FOR INSERT WITH CHECK (%s)',
        pol.policyname || ' (insert)',
        pol.schemaname,
        pol.tablename,
        permissive_clause,
        pol.qual
      );
    END IF;

    IF pol.qual IS NOT NULL AND pol.with_check IS NOT NULL THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I.%I%s FOR UPDATE USING (%s) WITH CHECK (%s)',
        pol.policyname || ' (update)',
        pol.schemaname,
        pol.tablename,
        permissive_clause,
        pol.qual,
        pol.with_check
      );
    ELSIF pol.qual IS NOT NULL THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I.%I%s FOR UPDATE USING (%s)',
        pol.policyname || ' (update)',
        pol.schemaname,
        pol.tablename,
        permissive_clause,
        pol.qual
      );
    ELSIF pol.with_check IS NOT NULL THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I.%I%s FOR UPDATE WITH CHECK (%s)',
        pol.policyname || ' (update)',
        pol.schemaname,
        pol.tablename,
        permissive_clause,
        pol.with_check
      );
    END IF;

    IF pol.qual IS NOT NULL THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I.%I%s FOR DELETE USING (%s)',
        pol.policyname || ' (delete)',
        pol.schemaname,
        pol.tablename,
        permissive_clause,
        pol.qual
      );
    ELSIF pol.with_check IS NOT NULL THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I.%I%s FOR DELETE USING (%s)',
        pol.policyname || ' (delete)',
        pol.schemaname,
        pol.tablename,
        permissive_clause,
        pol.with_check
      );
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3) Merge duplicate INSERT policies on chat_members
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Dolaczenie do konwersacji" ON public.chat_members;
DROP POLICY IF EXISTS "Tworca dodaje czlonka do grupy" ON public.chat_members;

CREATE POLICY "Czlonkowie dolaczaja lub admin dodaje"
ON public.chat_members
FOR INSERT
WITH CHECK (
  (
    user_id = (select auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.chat_conversations c
      WHERE c.id = conversation_id
        AND public.is_village_resident(c.village_id)
    )
  )
  OR EXISTS (
    SELECT 1
    FROM public.chat_conversations c
    JOIN public.chat_members admin ON admin.conversation_id = c.id
    WHERE c.id = conversation_id
      AND c.kind = 'group'
      AND admin.user_id = (select auth.uid())
      AND admin.is_admin = true
  )
);

-- ---------------------------------------------------------------------------
-- 4) Waitlist: remove loose duplicate INSERT policy (keep validated policy)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "anon moze zapisac waitlist" ON public.waitlist;
