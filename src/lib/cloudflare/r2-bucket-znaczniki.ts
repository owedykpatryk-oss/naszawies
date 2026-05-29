/** Nazwy bucketów R2 (tylko małe litery, cyfry, myślnik — wymóg Cloudflare). */
export const R2_BUCKET_AVATARS = "avatars";
export const R2_BUCKET_HALL_INVENTORY = "hall-inventory";
export const R2_BUCKET_BOOKING_DAMAGE = "hall-booking-damage";
export const R2_BUCKET_HALL_RULES = "hall-rules";
export const R2_BUCKET_MARKETPLACE = "marketplace";
export const R2_BUCKET_VILLAGE_PHOTOS = "village-photos";

export const R2_WSZYSTKIE_BUCKETY = [
  R2_BUCKET_AVATARS,
  R2_BUCKET_HALL_INVENTORY,
  R2_BUCKET_BOOKING_DAMAGE,
  R2_BUCKET_HALL_RULES,
  R2_BUCKET_MARKETPLACE,
  R2_BUCKET_VILLAGE_PHOTOS,
] as const;
