-- Sołtys musi móc SELECT-ować zdjęcia w swojej wsi (w tym pending), żeby moderować;
-- polityka UPDATE już istnieje; SELECT był tylko dla własnych / publicznych.
CREATE POLICY "Sołtys widzi zdjecia wsi (moderacja fotokroniki)"
ON public.photos
FOR SELECT
TO authenticated
USING (public.is_village_soltys(village_id));
