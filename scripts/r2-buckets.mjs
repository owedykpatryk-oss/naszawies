#!/usr/bin/env node
/**
 * Tworzy buckety R2 w Cloudflare (REST API v4).
 *
 * Wymaga (w .env.local lub środowisku):
 *   CLOUDFLARE_R2_ACCOUNT_ID  — ten sam „Account ID” co w panelu R2
 *   CLOUDFLARE_API_TOKEN      — API Token z uprawnieniem Account → R2 → Edit (nie są to klucze S3!)
 *
 * Klucze CLOUDFLARE_R2_ACCESS_KEY_ID / SECRET służą do S3 API (obiekty) — do tworzenia bucketów ich nie używasz.
 *
 * Uruchomienie: npm run r2:buckets
 */

import { wczytajEnvLocal } from "./wczytaj-env-local.mjs";

wczytajEnvLocal();

const ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;

/**
 * Buckety R2: tylko małe litery, cyfry i myślniki (underscore jest niedozwolony w R2).
 * Supabase Storage nadal używa nazw ze znakiem _ — przy migracji na R2 mapuj nazwy w kodzie.
 */
const BUCKETY = [
  { name: "avatars", locationHint: "weur" },
  { name: "hall-inventory", locationHint: "weur" },
  { name: "hall-booking-damage", locationHint: "weur" },
];

const BASE = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets`;

async function listaBucketow() {
  const res = await fetch(BASE, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const json = await res.json();
  if (!json.success) {
    console.error("Lista bucketów — błąd:", JSON.stringify(json.errors, null, 2));
    process.exit(1);
  }
  const kubel = json.result?.buckets ?? json.result;
  const lista = Array.isArray(kubel) ? kubel : [];
  return lista.map((b) => b.name).filter(Boolean);
}

async function utworzBucket({ name, locationHint }) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, locationHint }),
  });
  const json = await res.json();
  if (json.success) {
    console.log(`OK utworzono: ${name}`);
    return true;
  }
  const msg = json.errors?.[0]?.message ?? JSON.stringify(json);
  if (msg.includes("already exists") || json.errors?.[0]?.code === 10014) {
    console.log(`Pominięto (już istnieje): ${name}`);
    return true;
  }
  console.error(`Błąd ${name}:`, msg);
  return false;
}

async function main() {
  if (!ACCOUNT_ID || !TOKEN) {
    console.error(`
Brak zmiennych środowiskowych.

Ustaw w .env.local:
  CLOUDFLARE_R2_ACCOUNT_ID=…   (Cloudflare dashboard → R2 → po prawej „Account ID”)
  CLOUDFLARE_API_TOKEN=…       (My Profile → API Tokens → Create Token → Permissions:
                                Account → R2 Storage → Edit)

Klucze S3 (ACCESS_KEY / SECRET) dodajesz osobno w R2 → Manage R2 API Tokens — do aplikacji (PutObject), nie do tego skryptu.
`);
    process.exit(1);
  }

  console.log("Konto:", ACCOUNT_ID);
  let istniejace = [];
  try {
    istniejace = await listaBucketow();
    console.log("Istniejące buckety:", istniejace.length ? istniejace.join(", ") : "(brak)");
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

  let ok = true;
  for (const b of BUCKETY) {
    if (istniejace.includes(b.name)) {
      console.log(`Już jest: ${b.name}`);
      continue;
    }
    const w = await utworzBucket(b);
    if (!w) ok = false;
  }

  if (!ok) process.exit(1);
  console.log("\nGotowe. Skonfiguruj publiczny dostęp / custom domain w panelu R2 jeśli potrzebujesz URL-i jak z Supabase Storage.");
}

main();
