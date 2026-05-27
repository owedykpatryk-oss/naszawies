-- Slug PL (zgodny z slugify locale pl) + huby administracyjne dla /wies/{woj}/{powiat}/{gmina}

CREATE OR REPLACE FUNCTION public.slug_pl(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT trim(both '-' FROM regexp_replace(
    lower(translate(coalesce(input, ''),
      'ąćęłńóśżźĄĆĘŁŃÓŚŻŹ', 'acelnoszzacelnoszz')),
    '[^a-z0-9]+', '-', 'g'));
$$;

CREATE OR REPLACE FUNCTION public.hub_wsi_po_sciezce(
  p_woj_slug text,
  p_pow_slug text DEFAULT NULL,
  p_gmina_slug text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  voivodeship text,
  county text,
  commune text,
  commune_type text,
  population integer,
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    v.id,
    v.name,
    v.slug,
    v.voivodeship,
    v.county,
    v.commune,
    v.commune_type,
    v.population,
    v.is_active
  FROM public.villages v
  WHERE public.slug_pl(v.voivodeship) = p_woj_slug
    AND (p_pow_slug IS NULL OR public.slug_pl(v.county) = p_pow_slug)
    AND (p_gmina_slug IS NULL OR public.slug_pl(v.commune) = p_gmina_slug)
  ORDER BY v.name ASC;
$$;

CREATE OR REPLACE FUNCTION public.hub_gminy_w_powiacie(p_woj_slug text, p_pow_slug text)
RETURNS TABLE (
  commune text,
  commune_type text,
  liczba_wsi bigint,
  liczba_aktywnych bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    v.commune,
    max(v.commune_type) AS commune_type,
    count(*)::bigint AS liczba_wsi,
    count(*) FILTER (WHERE v.is_active)::bigint AS liczba_aktywnych
  FROM public.villages v
  WHERE public.slug_pl(v.voivodeship) = p_woj_slug
    AND public.slug_pl(v.county) = p_pow_slug
  GROUP BY v.commune
  ORDER BY v.commune ASC;
$$;

CREATE OR REPLACE FUNCTION public.hub_powiaty_w_wojewodztwie(p_woj_slug text)
RETURNS TABLE (
  county text,
  liczba_gmin bigint,
  liczba_wsi bigint,
  liczba_aktywnych bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    v.county,
    count(DISTINCT v.commune)::bigint AS liczba_gmin,
    count(*)::bigint AS liczba_wsi,
    count(*) FILTER (WHERE v.is_active)::bigint AS liczba_aktywnych
  FROM public.villages v
  WHERE public.slug_pl(v.voivodeship) = p_woj_slug
  GROUP BY v.county
  ORDER BY v.county ASC;
$$;

REVOKE ALL ON FUNCTION public.slug_pl(text) FROM public;
REVOKE ALL ON FUNCTION public.hub_wsi_po_sciezce(text, text, text) FROM public;
REVOKE ALL ON FUNCTION public.hub_gminy_w_powiacie(text, text) FROM public;
REVOKE ALL ON FUNCTION public.hub_powiaty_w_wojewodztwie(text) FROM public;

GRANT EXECUTE ON FUNCTION public.slug_pl(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hub_wsi_po_sciezce(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hub_gminy_w_powiacie(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hub_powiaty_w_wojewodztwie(text) TO anon, authenticated;
