-- Presety nazwanych planów sali + godziny dyżurów opiekuna
ALTER TABLE halls
  ADD COLUMN IF NOT EXISTS layout_presets jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS contact_duty_hours text;

COMMENT ON COLUMN halls.layout_presets IS 'Tablica { id, nazwa, plan } — zapisane warianty układu stołów';
COMMENT ON COLUMN halls.contact_duty_hours IS 'Godziny dyżurów opiekuna sali (tekst wolny)';
