-- Rozszerzony profil organizacji (szczególnie parafia): JSON + rodzaje wydarzeń liturgicznych

ALTER TABLE public.village_community_groups
  ADD COLUMN IF NOT EXISTS profile_data jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.village_community_groups.profile_data IS
  'Dane rozszerzone per typ organizacji (np. parafia: msze, spowiedź, kancelaria)';

ALTER TYPE public.village_event_kind ADD VALUE IF NOT EXISTS 'msza';
ALTER TYPE public.village_event_kind ADD VALUE IF NOT EXISTS 'nabozenstwo';
ALTER TYPE public.village_event_kind ADD VALUE IF NOT EXISTS 'katecheza';
ALTER TYPE public.village_event_kind ADD VALUE IF NOT EXISTS 'sakrament';
