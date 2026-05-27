-- Linki przydatne dla mieszkańców: urząd gminy, BIP, media lokalne, portale

CREATE TABLE IF NOT EXISTS public.village_useful_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  phone TEXT,
  email TEXT,
  note TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT village_useful_links_title_len CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  CONSTRAINT village_useful_links_url_len CHECK (url IS NULL OR char_length(url) <= 2000),
  CONSTRAINT village_useful_links_phone_len CHECK (phone IS NULL OR char_length(phone) <= 80),
  CONSTRAINT village_useful_links_email_len CHECK (email IS NULL OR char_length(email) <= 200),
  CONSTRAINT village_useful_links_note_len CHECK (note IS NULL OR char_length(note) <= 2000),
  CONSTRAINT village_useful_links_category_chk CHECK (
    category IN (
      'bip_gmina',
      'urzad_gmina',
      'urzad_powiat',
      'gazeta',
      'radio',
      'portal',
      'tv',
      'social',
      'pomoc_spoleczna',
      'zdrowie',
      'edukacja',
      'inne'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_village_useful_links_village ON public.village_useful_links(village_id);
CREATE INDEX IF NOT EXISTS idx_village_useful_links_active ON public.village_useful_links(village_id, is_active, display_order);

DROP TRIGGER IF EXISTS update_village_useful_links_updated_at ON public.village_useful_links;
CREATE TRIGGER update_village_useful_links_updated_at
BEFORE UPDATE ON public.village_useful_links
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.village_useful_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public useful links read" ON public.village_useful_links;
CREATE POLICY "Public useful links read"
ON public.village_useful_links
FOR SELECT
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.villages v
    WHERE v.id = village_id
      AND (
        v.is_active = true
        OR public.is_village_resident(village_id)
        OR public.is_village_soltys(village_id)
      )
  )
);

DROP POLICY IF EXISTS "Soltys manages useful links" ON public.village_useful_links;
CREATE POLICY "Soltys manages useful links"
ON public.village_useful_links
FOR ALL
USING (public.is_village_soltys(village_id))
WITH CHECK (public.is_village_soltys(village_id));
