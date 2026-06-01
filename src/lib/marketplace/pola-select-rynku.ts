/** Wspólne kolumny listy ogłoszeń (mniej duplikacji selectów w zapytaniach). */
export const POLE_SELECT_RYNEK_LISTA =
  "id, title, listing_type, category, equipment_category, location_text, price_amount, price_unit, currency, with_operator, image_urls, published_at, created_at, seller_verified, parcel_area_m2, parcel_number, geoportal_parcel_id, view_count, owner_user_id";

export const POLE_SELECT_RYNEK_STRONA_WSI =
  `${POLE_SELECT_RYNEK_LISTA}, village_id, latitude, longitude, parcel_geojson`;
