-- Regulamin placu zabaw — poziom sołectwa (jedna treść na wieś; edycja przez sołtysa w panelu sali)
ALTER TABLE public.villages
  ADD COLUMN IF NOT EXISTS playground_rules_text TEXT;

COMMENT ON COLUMN public.villages.playground_rules_text IS
  'Regulamin korzystania z placu zabaw / urządzeń zewnętrznych w sołectwie. Edycja: panel sołtysa przy świetlicy wsi.';
