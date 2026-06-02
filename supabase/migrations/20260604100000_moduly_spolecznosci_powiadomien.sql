-- Moduły społeczności: preferencje powiadomień, alerty, głosowania, dyżury sołtysa, rezerwacje cykliczne, harmonogram śmieci.

-- =========================================
-- POWIADOMIENIA — preferencje i kolejka
-- =========================================
DO $$ BEGIN
  CREATE TYPE public.kanal_powiadomienia AS ENUM ('push', 'email', 'sms');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.czestotliwosc_powiadomienia AS ENUM (
    'natychmiast', 'digest_dzienny', 'digest_tygodniowy', 'wylaczone'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  typ_powiadomienia TEXT NOT NULL,
  kanal_push public.czestotliwosc_powiadomienia NOT NULL DEFAULT 'natychmiast',
  kanal_email public.czestotliwosc_powiadomienia NOT NULL DEFAULT 'digest_dzienny',
  kanal_sms public.czestotliwosc_powiadomienia NOT NULL DEFAULT 'wylaczone',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, typ_powiadomienia),
  CONSTRAINT user_notification_preferences_typ_len CHECK (char_length(typ_powiadomienia) <= 64)
);

ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own notification prefs" ON public.user_notification_preferences;
CREATE POLICY "Users manage own notification prefs"
  ON public.user_notification_preferences
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.notification_digest_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
  kanal public.kanal_powiadomienia NOT NULL,
  czestotliwosc public.czestotliwosc_powiadomienia NOT NULL,
  zaplanowane_na TIMESTAMPTZ NOT NULL,
  wyslane_at TIMESTAMPTZ,
  blad TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_digest_zaplanowane
  ON public.notification_digest_queue (zaplanowane_na)
  WHERE wyslane_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_digest_dedup_push
  ON public.notification_digest_queue (notification_id, kanal)
  WHERE wyslane_at IS NULL AND kanal = 'push';

ALTER TABLE public.notification_digest_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Digest queue service only" ON public.notification_digest_queue;
CREATE POLICY "Digest queue service only"
  ON public.notification_digest_queue
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE OR REPLACE FUNCTION public.wyslij_powiadomienie(
  p_user_id UUID,
  p_typ TEXT,
  p_tytul TEXT,
  p_tresc TEXT,
  p_link_url TEXT DEFAULT NULL,
  p_related_id UUID DEFAULT NULL,
  p_related_type TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
  v_push public.czestotliwosc_powiadomienia := 'natychmiast';
  v_email public.czestotliwosc_powiadomienia := 'digest_dzienny';
  v_sms public.czestotliwosc_powiadomienia := 'wylaczone';
BEGIN
  INSERT INTO notifications (user_id, type, title, body, link_url, related_id, related_type, channel)
  VALUES (p_user_id, p_typ, p_tytul, p_tresc, p_link_url, p_related_id, p_related_type, 'in_app')
  RETURNING id INTO v_notification_id;

  SELECT
    COALESCE(kanal_push, 'natychmiast'),
    COALESCE(kanal_email, 'digest_dzienny'),
    COALESCE(kanal_sms, 'wylaczone')
  INTO v_push, v_email, v_sms
  FROM user_notification_preferences
  WHERE user_id = p_user_id AND typ_powiadomienia = p_typ;

  IF v_push = 'natychmiast' THEN
    INSERT INTO notification_digest_queue (user_id, notification_id, kanal, czestotliwosc, zaplanowane_na)
    VALUES (p_user_id, v_notification_id, 'push', 'natychmiast', NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_email = 'natychmiast' THEN
    INSERT INTO notification_digest_queue (user_id, notification_id, kanal, czestotliwosc, zaplanowane_na)
    VALUES (p_user_id, v_notification_id, 'email', 'natychmiast', NOW())
    ON CONFLICT DO NOTHING;
  ELSIF v_email = 'digest_dzienny' THEN
    INSERT INTO notification_digest_queue (user_id, notification_id, kanal, czestotliwosc, zaplanowane_na)
    VALUES (p_user_id, v_notification_id, 'email', 'digest_dzienny', date_trunc('day', NOW()) + INTERVAL '20 hours')
    ON CONFLICT DO NOTHING;
  ELSIF v_email = 'digest_tygodniowy' THEN
    INSERT INTO notification_digest_queue (user_id, notification_id, kanal, czestotliwosc, zaplanowane_na)
    VALUES (p_user_id, v_notification_id, 'email', 'digest_tygodniowy', date_trunc('week', NOW()) + INTERVAL '6 days 18 hours')
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_sms = 'natychmiast' THEN
    INSERT INTO notification_digest_queue (user_id, notification_id, kanal, czestotliwosc, zaplanowane_na)
    VALUES (p_user_id, v_notification_id, 'sms', 'natychmiast', NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN v_notification_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.wyslij_powiadomienie TO authenticated, service_role;

-- =========================================
-- ALERTY AWARII
-- =========================================
DO $$ BEGIN
  CREATE TYPE public.village_alert_kind AS ENUM ('prad', 'woda', 'droga', 'gaz', 'inne');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.village_alert_status AS ENUM ('active', 'resolved');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.village_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  kind public.village_alert_kind NOT NULL DEFAULT 'inne',
  title TEXT NOT NULL,
  body TEXT,
  status public.village_alert_status NOT NULL DEFAULT 'active',
  expected_end_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT village_alerts_title_len CHECK (char_length(title) <= 200),
  CONSTRAINT village_alerts_body_len CHECK (body IS NULL OR char_length(body) <= 4000)
);

CREATE INDEX IF NOT EXISTS idx_village_alerts_village_status
  ON public.village_alerts (village_id, status, created_at DESC);

DROP TRIGGER IF EXISTS update_village_alerts_updated_at ON public.village_alerts;
CREATE TRIGGER update_village_alerts_updated_at
BEFORE UPDATE ON public.village_alerts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.village_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active village alerts" ON public.village_alerts;
CREATE POLICY "Public read active village alerts"
  ON public.village_alerts
  FOR SELECT
  USING (
    status = 'active'
    AND EXISTS (SELECT 1 FROM villages v WHERE v.id = village_id AND v.is_active = true)
  );

DROP POLICY IF EXISTS "Residents read all village alerts" ON public.village_alerts;
CREATE POLICY "Residents read all village alerts"
  ON public.village_alerts
  FOR SELECT
  USING (public.is_village_resident(village_id));

DROP POLICY IF EXISTS "Soltys manages village alerts" ON public.village_alerts;
CREATE POLICY "Soltys manages village alerts"
  ON public.village_alerts
  FOR ALL
  USING (public.is_village_soltys(village_id))
  WITH CHECK (public.is_village_soltys(village_id));

-- =========================================
-- HARMONOGRAM ŚMIECI (strukturalny)
-- =========================================
DO $$ BEGIN
  CREATE TYPE public.waste_schedule_kind AS ENUM ('zmieszane', 'segregowane', 'gabaryty', 'pszok', 'bio', 'inne');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.village_waste_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  kind public.waste_schedule_kind NOT NULL DEFAULT 'zmieszane',
  day_of_week SMALLINT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  time_hint TEXT,
  notes TEXT,
  sort_order INT NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT village_waste_schedule_notes_len CHECK (notes IS NULL OR char_length(notes) <= 500)
);

CREATE INDEX IF NOT EXISTS idx_village_waste_schedule_village
  ON public.village_waste_schedule (village_id, is_active, sort_order);

DROP TRIGGER IF EXISTS update_village_waste_schedule_updated_at ON public.village_waste_schedule;
CREATE TRIGGER update_village_waste_schedule_updated_at
BEFORE UPDATE ON public.village_waste_schedule
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.village_waste_schedule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active waste schedule" ON public.village_waste_schedule;
CREATE POLICY "Public read active waste schedule"
  ON public.village_waste_schedule
  FOR SELECT
  USING (
    is_active = true
    AND EXISTS (SELECT 1 FROM villages v WHERE v.id = village_id AND v.is_active = true)
  );

DROP POLICY IF EXISTS "Soltys manages waste schedule" ON public.village_waste_schedule;
CREATE POLICY "Soltys manages waste schedule"
  ON public.village_waste_schedule
  FOR ALL
  USING (public.is_village_soltys(village_id))
  WITH CHECK (public.is_village_soltys(village_id));

-- =========================================
-- TABLICA GŁOSOWAŃ
-- =========================================
DO $$ BEGIN
  CREATE TYPE public.village_poll_status AS ENUM ('zaplanowane', 'aktywne', 'zakonczone', 'anulowane');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.village_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  pytanie TEXT NOT NULL,
  opis TEXT,
  utworzone_przez UUID REFERENCES public.users(id) ON DELETE SET NULL,
  rozpoczyna_sie_at TIMESTAMPTZ NOT NULL,
  konczy_sie_at TIMESTAMPTZ NOT NULL,
  status public.village_poll_status NOT NULL DEFAULT 'zaplanowane',
  wymaga_mieszkanca BOOLEAN NOT NULL DEFAULT true,
  wynik_publiczny_w_trakcie BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT village_polls_pytanie_len CHECK (char_length(pytanie) <= 500),
  CONSTRAINT village_polls_daty CHECK (konczy_sie_at > rozpoczyna_sie_at)
);

CREATE INDEX IF NOT EXISTS idx_village_polls_village_status
  ON public.village_polls (village_id, status, konczy_sie_at DESC);

DROP TRIGGER IF EXISTS update_village_polls_updated_at ON public.village_polls;
CREATE TRIGGER update_village_polls_updated_at
BEFORE UPDATE ON public.village_polls
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.village_poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.village_polls(id) ON DELETE CASCADE,
  tresc TEXT NOT NULL,
  kolejnosc INT NOT NULL DEFAULT 0,
  CONSTRAINT village_poll_options_tresc_len CHECK (char_length(tresc) <= 300)
);

CREATE TABLE IF NOT EXISTS public.village_poll_votes (
  poll_id UUID NOT NULL REFERENCES public.village_polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.village_poll_options(id) ON DELETE CASCADE,
  voter_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  oddany_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (poll_id, voter_user_id)
);

ALTER TABLE public.village_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.village_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.village_poll_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active polls" ON public.village_polls;
CREATE POLICY "Public read active polls"
  ON public.village_polls
  FOR SELECT
  USING (
    status IN ('aktywne', 'zakonczone')
    AND EXISTS (SELECT 1 FROM villages v WHERE v.id = village_id AND v.is_active = true)
  );

DROP POLICY IF EXISTS "Soltys manages polls" ON public.village_polls;
CREATE POLICY "Soltys manages polls"
  ON public.village_polls
  FOR ALL
  USING (public.is_village_soltys(village_id))
  WITH CHECK (public.is_village_soltys(village_id));

DROP POLICY IF EXISTS "Public read poll options" ON public.village_poll_options;
CREATE POLICY "Public read poll options"
  ON public.village_poll_options
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM village_polls p
      WHERE p.id = poll_id AND p.status IN ('aktywne', 'zakonczone')
    )
  );

DROP POLICY IF EXISTS "Soltys manages poll options" ON public.village_poll_options;
CREATE POLICY "Soltys manages poll options"
  ON public.village_poll_options
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM village_polls p WHERE p.id = poll_id AND public.is_village_soltys(p.village_id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM village_polls p WHERE p.id = poll_id AND public.is_village_soltys(p.village_id))
  );

DROP POLICY IF EXISTS "Voters read own votes" ON public.village_poll_votes;
CREATE POLICY "Voters read own votes"
  ON public.village_poll_votes
  FOR SELECT
  USING (voter_user_id = auth.uid());

DROP POLICY IF EXISTS "Residents vote in polls" ON public.village_poll_votes;
CREATE POLICY "Residents vote in polls"
  ON public.village_poll_votes
  FOR INSERT
  WITH CHECK (
    voter_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM village_polls p
      WHERE p.id = poll_id
        AND p.status = 'aktywne'
        AND now() BETWEEN p.rozpoczyna_sie_at AND p.konczy_sie_at
        AND (NOT p.wymaga_mieszkanca OR public.is_village_resident(p.village_id))
    )
  );

-- =========================================
-- DYŻURY SOŁTYSA
-- =========================================
CREATE TABLE IF NOT EXISTS public.soltys_duty_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  day_of_week SMALLINT CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6)),
  specific_date DATE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  notes TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT soltys_duty_slots_czas CHECK (end_time > start_time),
  CONSTRAINT soltys_duty_slots_dzien CHECK (day_of_week IS NOT NULL OR specific_date IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_soltys_duty_village
  ON public.soltys_duty_slots (village_id, is_active);

DROP TRIGGER IF EXISTS update_soltys_duty_slots_updated_at ON public.soltys_duty_slots;
CREATE TRIGGER update_soltys_duty_slots_updated_at
BEFORE UPDATE ON public.soltys_duty_slots
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.soltys_duty_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active duty slots" ON public.soltys_duty_slots;
CREATE POLICY "Public read active duty slots"
  ON public.soltys_duty_slots
  FOR SELECT
  USING (
    is_active = true
    AND EXISTS (SELECT 1 FROM villages v WHERE v.id = village_id AND v.is_active = true)
  );

DROP POLICY IF EXISTS "Soltys manages duty slots" ON public.soltys_duty_slots;
CREATE POLICY "Soltys manages duty slots"
  ON public.soltys_duty_slots
  FOR ALL
  USING (public.is_village_soltys(village_id))
  WITH CHECK (public.is_village_soltys(village_id));

-- =========================================
-- REZERWACJE CYKLICZNE SAL
-- =========================================
CREATE TABLE IF NOT EXISTS public.hall_recurring_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hall_id UUID NOT NULL REFERENCES public.halls(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  event_type TEXT NOT NULL,
  event_title TEXT NOT NULL,
  expected_guests INT NOT NULL DEFAULT 10,
  organization_name TEXT,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT hall_recurring_bookings_czas CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_hall_recurring_hall
  ON public.hall_recurring_bookings (hall_id, is_active);

DROP TRIGGER IF EXISTS update_hall_recurring_bookings_updated_at ON public.hall_recurring_bookings;
CREATE TRIGGER update_hall_recurring_bookings_updated_at
BEFORE UPDATE ON public.hall_recurring_bookings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.hall_recurring_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active recurring bookings" ON public.hall_recurring_bookings;
CREATE POLICY "Public read active recurring bookings"
  ON public.hall_recurring_bookings
  FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM halls h
      JOIN villages v ON v.id = h.village_id
      WHERE h.id = hall_id AND v.is_active = true
    )
  );

DROP POLICY IF EXISTS "Soltys manages recurring bookings" ON public.hall_recurring_bookings;
CREATE POLICY "Soltys manages recurring bookings"
  ON public.hall_recurring_bookings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM halls h
      WHERE h.id = hall_id AND public.is_village_soltys(h.village_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM halls h
      WHERE h.id = hall_id AND public.is_village_soltys(h.village_id)
    )
  );
