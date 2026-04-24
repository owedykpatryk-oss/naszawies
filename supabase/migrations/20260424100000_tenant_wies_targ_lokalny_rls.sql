-- Model „jedna wieś = jeden tenant”: dane zawsze z `village_id`.
-- Ogłoszenia, zebrań, świetlica (rezerwacje) — społeczność wsi (RLS jak wcześniej).
-- Targ lokalny — typ `targ_lokalny`: widoczny dla każdego (w tym anon), żeby „wszyscy co wejdą” na stronę wsi mogli zobaczyć oferty.
-- Usuwa globalne wyciekanie postów `is_public` oraz komentarzy do wewnętrznych treści.
-- Wartość enum `targ_lokalny`: migracja 20260423200000_post_type_add_targ_lokalny.sql

COMMENT ON TABLE posts IS
  'Treści wsi: tenant = village_id. Typ targ_lokalny — jedyny post widoczny globalnie (katalog ofert); pozostałe typy tylko dla mieszkańców/sołtysa/autora.';

-- Posty: zamiast „całe is_public dla świata” — tylko targ lokalny
DROP POLICY IF EXISTS "Public approved posts visible" ON posts;

CREATE POLICY "Targ lokalny widoczny dla wszystkich"
ON posts FOR SELECT
USING (status = 'approved' AND type = 'targ_lokalny');

-- Komentarze: nie pokazuj zatwierdzonych komentarzy z wewnętrznych postów całemu Internetowi
DROP POLICY IF EXISTS "Approved comments visible" ON comments;

CREATE POLICY "Komentarze przy targu lokalnym widoczne publicznie"
ON comments FOR SELECT
USING (
  status = 'approved'
  AND EXISTS (
    SELECT 1
    FROM posts p
    WHERE p.id = comments.post_id
      AND p.status = 'approved'
      AND p.type = 'targ_lokalny'
  )
);

CREATE POLICY "Komentarze przy postach wsi — mieszkancy"
ON comments FOR SELECT
USING (
  status = 'approved'
  AND EXISTS (
    SELECT 1
    FROM posts p
    WHERE p.id = comments.post_id
      AND p.status = 'approved'
      AND is_village_resident(p.village_id)
  )
);

-- Świetlica: nie lista wszystkich obiektów dla anonima; rezerwacja wymaga konta
DROP POLICY IF EXISTS "Halls publicly visible" ON halls;

CREATE POLICY "Swietlice widoczne wg dostepu do wsi"
ON halls FOR SELECT
USING (
  is_platform_admin()
  OR is_village_soltys(village_id)
  OR is_village_resident(village_id)
  OR (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM villages v
      WHERE v.id = halls.village_id
        AND v.is_active = true
    )
  )
);

DROP POLICY IF EXISTS "Inventory publicly visible" ON hall_inventory;

CREATE POLICY "Wyposazenie swietlicy jak dostep do sali"
ON hall_inventory FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM halls h
    WHERE h.id = hall_inventory.hall_id
      AND (
        is_platform_admin()
        OR is_village_soltys(h.village_id)
        OR is_village_resident(h.village_id)
        OR (
          auth.uid() IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM villages v
            WHERE v.id = h.village_id
              AND v.is_active = true
          )
        )
      )
  )
);

-- Sołtys musi móc odczytać zgłoszenia (wcześniej brak osobnej polityki SELECT)
CREATE POLICY "Soltys widzi zgloszenia dla swojej wsi"
ON issues FOR SELECT
USING (is_village_soltys(village_id));
