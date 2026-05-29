#!/usr/bin/env node
/**
 * Audyt zmiennych środowiska — lokalnie vs .env.example vs (opcjonalnie) plik z Vercel.
 *
 *   node scripts/sprawdz-env.mjs
 *   node scripts/sprawdz-env.mjs --vercel .env.vercel.check
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function wczytajKlucze(plik) {
  if (!fs.existsSync(plik)) return new Set();
  const out = new Set();
  for (const line of fs.readFileSync(plik, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const m = t.match(/^([A-Za-z_][A-Za-z0-9_]*)=/);
    if (m) out.add(m[1]);
  }
  return out;
}

const wymaganeProdukcja = [
  { klucz: "NEXT_PUBLIC_SUPABASE_URL", opis: "Supabase — URL projektu" },
  { klucz: "NEXT_PUBLIC_SUPABASE_ANON_KEY", opis: "Supabase — klucz anon (klient)" },
  { klucz: "NEXT_PUBLIC_SITE_URL", opis: "Kanoniczny URL (OAuth, maile, manifest)" },
  { klucz: "SUPABASE_SERVICE_ROLE_KEY", opis: "Serwer: powiadomienia, cron RSS, push do obserwujących" },
  { klucz: "CRON_SECRET", opis: "Autoryzacja cronów Vercel (vercel.json)" },
];

const zalecaneProdukcja = [
  { klucz: "UPSTASH_REDIS_REST_URL", opis: "Rate limit — Upstash Redis REST (nie Search)" },
  { klucz: "UPSTASH_REDIS_REST_TOKEN", opis: "Token Upstash Redis REST" },
  { klucz: "NEXT_PUBLIC_TURNSTILE_SITE_KEY", opis: "Cloudflare Turnstile (kontakt, waitlist)" },
  { klucz: "TURNSTILE_SECRET_KEY", opis: "Walidacja Turnstile po stronie serwera" },
  { klucz: "NEXT_PUBLIC_R2_PUBLIC_BASE_URL", opis: "Cloudflare R2 CDN — publiczny URL (cdn.naszawies.pl)" },
  { klucz: "CLOUDFLARE_R2_ENDPOINT", opis: "R2 S3 endpoint — upload serwerowy" },
  { klucz: "CLOUDFLARE_R2_ACCESS_KEY_ID", opis: "R2 access key" },
  { klucz: "CLOUDFLARE_R2_SECRET_ACCESS_KEY", opis: "R2 secret key" },
  { klucz: "RESEND_API_KEY", opis: "Formularz kontaktowy" },
  { klucz: "RESEND_ZE_STRONY", opis: "Nadawca e-maili Resend" },
  { klucz: "NEXT_PUBLIC_VAPID_PUBLIC_KEY", opis: "Web Push w panelu" },
  { klucz: "VAPID_PRIVATE_KEY", opis: "Web Push — serwer" },
  { klucz: "VAPID_SUBJECT", opis: "Web Push — mailto:…" },
  { klucz: "TRANSPORT_SYNC_ENABLED", opis: "Widget transportu PKP (1 = włączony)" },
  { klucz: "PKP_PLK_API_KEY", opis: "API rozkładu jazdy PKP PLK" },
];

const tylkoLokalOauth = [
  "SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID",
  "SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET",
  "SUPABASE_ACCESS_TOKEN",
];

function maKlucz(zestaw, { klucz, alias }) {
  if (zestaw.has(klucz)) return klucz;
  if (alias && zestaw.has(alias)) return `${alias} (alias)`;
  return null;
}

function raportuj(nazwa, zestaw, lista) {
  const braki = [];
  const ok = [];
  for (const wpis of lista) {
    const znaleziony = maKlucz(zestaw, wpis);
    if (znaleziony) ok.push({ ...wpis, znaleziony });
    else braki.push(wpis);
  }
  console.log(`\n=== ${nazwa} ===`);
  if (ok.length) {
    console.log("OK:");
    for (const w of ok) console.log(`  ✓ ${w.klucz}${w.znaleziony !== w.klucz ? ` ← ${w.znaleziony}` : ""}`);
  }
  if (braki.length) {
    console.log("BRAKUJE:");
    for (const w of braki) console.log(`  ✗ ${w.klucz} — ${w.opis}`);
  }
  return braki;
}

const local = wczytajKlucze(path.join(ROOT, ".env.local"));
const example = wczytajKlucze(path.join(ROOT, ".env.example"));

const vercelArg = process.argv.indexOf("--vercel");
const vercelPlik =
  vercelArg >= 0 && process.argv[vercelArg + 1]
    ? path.resolve(process.cwd(), process.argv[vercelArg + 1])
    : null;
const vercel = vercelPlik ? wczytajKlucze(vercelPlik) : null;

console.log("Audyt env — naszawies.pl");
console.log(`Pliki: .env.local (${local.size} kluczy)${vercel ? `, ${vercelPlik} (${vercel.size})` : ""}`);

raportuj("LOKAL — wymagane do pełnego dev", local, wymaganeProdukcja);
raportuj("LOKAL — zalecane", local, zalecaneProdukcja);

const r2Pelny =
  local.has("NEXT_PUBLIC_R2_PUBLIC_BASE_URL") &&
  local.has("CLOUDFLARE_R2_ENDPOINT") &&
  local.has("CLOUDFLARE_R2_ACCESS_KEY_ID") &&
  local.has("CLOUDFLARE_R2_SECRET_ACCESS_KEY");
console.log("\n=== Cloudflare R2 (magazyn zdjęć) ===");
console.log(
  r2Pelny
    ? "  ✓ Upload + CDN skonfigurowane (nowe pliki → R2)"
    : "  ✗ Uzupełnij R2 — docs/CLOUDFLARE.md (fallback: Supabase Storage)",
);
if (local.has("NEXT_PUBLIC_R2_CDN_IMAGES")) {
  console.log("  ✓ NEXT_PUBLIC_R2_CDN_IMAGES — miniaturki przez CDN");
} else {
  console.log("  ○ NEXT_PUBLIC_R2_CDN_IMAGES — opcjonalnie (Image Resizing)");
}

console.log("\n=== LOKAL — OAuth (tylko skrypt → Supabase, nie Vercel) ===");
for (const k of tylkoLokalOauth) {
  console.log(local.has(k) ? `  ✓ ${k}` : `  ✗ ${k}`);
}

if (vercel) {
  const brakiVercelWym = raportuj("VERCEL — wymagane na produkcji", vercel, wymaganeProdukcja);
  const brakiVercelZal = raportuj("VERCEL — zalecane", vercel, zalecaneProdukcja);
  if (brakiVercelWym.length + brakiVercelZal.length > 0) {
    console.log("\n→ Uzupełnij w Vercel: Settings → Environment Variables → Redeploy");
    console.log("  Lub skopiuj z .env.local: vercel env add NAZWA production");
  }
}

const brakExample = [...example].filter((k) => !local.has(k));
if (brakExample.length) {
  console.log(`\n=== W .env.example, brak w .env.local (${brakExample.length}) ===`);
  console.log(brakExample.slice(0, 15).join(", ") + (brakExample.length > 15 ? "…" : ""));
}

console.log("\n=== Google OAuth ===");
console.log("Klucze Google idą do Supabase (npm run wlacz:oauth-supabase), nie na Vercel.");
console.log("W Google Cloud → Authorized JavaScript origins:");
console.log("  https://naszawies.pl, https://www.naszawies.pl, http://localhost:3000");
console.log("Redirect URI (tylko Supabase):");
console.log("  https://qxvdjghfsrrxrivfahmn.supabase.co/auth/v1/callback");
