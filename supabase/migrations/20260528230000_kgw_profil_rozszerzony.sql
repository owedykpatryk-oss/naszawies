-- Rozszerzony profil KGW + rodzaje wydarzeń (zebrania, kiermasze, warsztaty)

ALTER TYPE public.village_event_kind ADD VALUE IF NOT EXISTS 'zebranie_kgw';
ALTER TYPE public.village_event_kind ADD VALUE IF NOT EXISTS 'kiermasz';
ALTER TYPE public.village_event_kind ADD VALUE IF NOT EXISTS 'warsztaty';
ALTER TYPE public.village_event_kind ADD VALUE IF NOT EXISTS 'piknik';
