-- Profil koła łowieckiego + rodzaje wydarzeń myśliwskich

ALTER TYPE public.village_group_type ADD VALUE IF NOT EXISTS 'lowiectwo';

ALTER TYPE public.village_event_kind ADD VALUE IF NOT EXISTS 'polowanie';
ALTER TYPE public.village_event_kind ADD VALUE IF NOT EXISTS 'zebranie_lowieckie';
ALTER TYPE public.village_event_kind ADD VALUE IF NOT EXISTS 'szkolenie_lowieckie';
ALTER TYPE public.village_event_kind ADD VALUE IF NOT EXISTS 'hubertus';
