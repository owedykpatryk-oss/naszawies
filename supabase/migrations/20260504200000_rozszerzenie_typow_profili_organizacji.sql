-- Rozszerzenie typów profili organizacji lokalnych (KGW/OSP/parafia/rada sołecka itd.)
-- bez przebudowy obecnego modelu `village_community_groups`.

ALTER TYPE public.village_group_type ADD VALUE IF NOT EXISTS 'osp';
ALTER TYPE public.village_group_type ADD VALUE IF NOT EXISTS 'parafia';
ALTER TYPE public.village_group_type ADD VALUE IF NOT EXISTS 'rada_solecka';
ALTER TYPE public.village_group_type ADD VALUE IF NOT EXISTS 'seniorzy';
ALTER TYPE public.village_group_type ADD VALUE IF NOT EXISTS 'mlodziez';
ALTER TYPE public.village_group_type ADD VALUE IF NOT EXISTS 'wolontariat';
ALTER TYPE public.village_group_type ADD VALUE IF NOT EXISTS 'rolnicy';
ALTER TYPE public.village_group_type ADD VALUE IF NOT EXISTS 'przedsiebiorcy';

COMMENT ON TYPE public.village_group_type IS
  'Typy profili organizacji i grup lokalnych: KGW/OSP/parafia/rada sołecka/seniorzy/młodzież/wolontariat/rolnicy/przedsiębiorcy/sport/taniec/muzyka/...';
