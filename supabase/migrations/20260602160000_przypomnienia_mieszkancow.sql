-- Automatyczne przypomnienia dla mieszkańców (śmieci, podatki, działki) — reguły per wieś, zgody użytkownika.

DO $$ BEGIN
  CREATE TYPE public.resident_reminder_kind AS ENUM ('smieci', 'podatek', 'dzialka', 'pszok', 'inne');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.resident_reminder_recurrence AS ENUM ('weekly', 'monthly', 'yearly');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.village_resident_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  kind public.resident_reminder_kind NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  recurrence public.resident_reminder_recurrence NOT NULL,
  day_of_week SMALLINT CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6)),
  day_of_month SMALLINT CHECK (day_of_month IS NULL OR (day_of_month >= 1 AND day_of_month <= 31)),
  month SMALLINT CHECK (month IS NULL OR (month >= 1 AND month <= 12)),
  days_before SMALLINT NOT NULL DEFAULT 1 CHECK (days_before >= 0 AND days_before <= 60),
  link_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 100,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT village_resident_reminders_title_len CHECK (char_length(title) <= 160),
  CONSTRAINT village_resident_reminders_body_len CHECK (body IS NULL OR char_length(body) <= 2000),
  CONSTRAINT village_resident_reminders_weekly_day CHECK (
    recurrence <> 'weekly' OR day_of_week IS NOT NULL
  ),
  CONSTRAINT village_resident_reminders_monthly_day CHECK (
    recurrence <> 'monthly' OR day_of_month IS NOT NULL
  ),
  CONSTRAINT village_resident_reminders_yearly_date CHECK (
    recurrence <> 'yearly' OR (month IS NOT NULL AND day_of_month IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_village_resident_reminders_village
  ON public.village_resident_reminders (village_id, is_active, sort_order);

DROP TRIGGER IF EXISTS update_village_resident_reminders_updated_at ON public.village_resident_reminders;
CREATE TRIGGER update_village_resident_reminders_updated_at
BEFORE UPDATE ON public.village_resident_reminders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.village_resident_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public active resident reminders read" ON public.village_resident_reminders;
CREATE POLICY "Public active resident reminders read"
  ON public.village_resident_reminders
  FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.villages v
      WHERE v.id = village_id AND v.is_active = true
    )
  );

DROP POLICY IF EXISTS "Soltys manages resident reminders" ON public.village_resident_reminders;
CREATE POLICY "Soltys manages resident reminders"
  ON public.village_resident_reminders
  FOR ALL
  USING (public.is_village_soltys(village_id))
  WITH CHECK (public.is_village_soltys(village_id));

-- Preferencje mieszkańca (domyślnie włączone po pierwszym zapisie).
CREATE TABLE IF NOT EXISTS public.user_resident_reminder_prefs (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  notify_smieci BOOLEAN NOT NULL DEFAULT true,
  notify_podatek BOOLEAN NOT NULL DEFAULT true,
  notify_dzialka BOOLEAN NOT NULL DEFAULT true,
  notify_pszok BOOLEAN NOT NULL DEFAULT true,
  notify_inne BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, village_id)
);

ALTER TABLE public.user_resident_reminder_prefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own resident reminder prefs" ON public.user_resident_reminder_prefs;
CREATE POLICY "Users manage own resident reminder prefs"
  ON public.user_resident_reminder_prefs
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_village_resident(village_id)
  );

-- Dedup wysyłek (cron).
CREATE TABLE IF NOT EXISTS public.resident_reminder_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES public.village_resident_reminders(id) ON DELETE CASCADE,
  fire_on DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, rule_id, fire_on)
);

CREATE INDEX IF NOT EXISTS idx_resident_reminder_deliveries_rule
  ON public.resident_reminder_deliveries (rule_id, fire_on);

ALTER TABLE public.resident_reminder_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own reminder deliveries" ON public.resident_reminder_deliveries;
CREATE POLICY "Users see own reminder deliveries"
  ON public.resident_reminder_deliveries
  FOR SELECT
  USING (user_id = auth.uid());

COMMENT ON TABLE public.village_resident_reminders IS
  'Reguły automatycznych przypomnień (śmieci, podatki, działki) — konfiguruje sołtys.';
COMMENT ON TABLE public.user_resident_reminder_prefs IS
  'Zgody mieszkańca na kategorie przypomnień w danej wsi.';
