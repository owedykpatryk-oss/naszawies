#!/usr/bin/env node
/**
 * Sprawdza połączenie z R2 przez S3 API (te same klucze co w aplikacji).
 * Nie wymaga CLOUDFLARE_API_TOKEN — tylko CLOUDFLARE_R2_ENDPOINT + ACCESS_KEY + SECRET.
 *
 * Uruchomienie: npm run r2:s3-ping
 */

import { HeadBucketCommand, ListBucketsCommand, S3Client } from "@aws-sdk/client-s3";
import { wczytajEnvLocal } from "./wczytaj-env-local.mjs";

wczytajEnvLocal();

const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT?.trim().replace(/\/$/, "");
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim();
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim();

/** R2: bez podkreśleń w nazwach bucketów (Supabase: hall_inventory itd.). */
const BUCKETY_OCZEKIWANE = ["avatars", "hall-inventory", "hall-booking-damage"];

async function main() {
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    console.error(`
Brak pełnej konfiguracji S3 do R2. Uzupełnij w .env.local:
  CLOUDFLARE_R2_ENDPOINT
  CLOUDFLARE_R2_ACCESS_KEY_ID
  CLOUDFLARE_R2_SECRET_ACCESS_KEY
`);
    process.exit(1);
  }

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });

  try {
    const out = await client.send(new ListBucketsCommand({}));
    const nazwy = (out.Buckets ?? []).map((b) => b.Name).filter(Boolean);
    console.log("Połączenie z R2 (S3 ListBuckets): OK");
    console.log("Buckety na koncie:", nazwy.length ? nazwy.join(", ") : "(żaden)");

    const brak = BUCKETY_OCZEKIWANE.filter((n) => !nazwy.includes(n));
    if (brak.length) {
      console.log("\nBrakuje nazw znanych z Supabase Storage:", brak.join(", "));
      console.log("→ npm run r2:buckets (wymaga CLOUDFLARE_API_TOKEN z uprawnieniem R2 Storage → Edit)");
    } else {
      console.log("\nWszystkie trzy buckety z migracji (nazwy) są na R2.");
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!String(msg).includes("Access Denied")) {
      console.error("ListBuckets nie powiodło się:", msg);
      process.exit(1);
    }
    console.log("ListBuckets: Access Denied (typowe dla tokenów S3 ograniczonych do bucketów).");
    console.log("Sprawdzam HeadBucket dla znanych nazw…\n");

    let jakikolwiekOk = false;
    for (const bucket of BUCKETY_OCZEKIWANE) {
      try {
        await client.send(new HeadBucketCommand({ Bucket: bucket }));
        console.log(`  ${bucket}: OK (bucket istnieje, klucz ma dostęp)`);
        jakikolwiekOk = true;
      } catch (err) {
        const m = err instanceof Error ? err.message : String(err);
        const meta = err && typeof err === "object" && "$metadata" in err ? err.$metadata : {};
        const http = meta && typeof meta === "object" && "httpStatusCode" in meta ? meta.httpStatusCode : "?";
        const kod = err && typeof err === "object" && "name" in err ? String(err.name) : "";
        console.log(`  ${bucket}: ${kod || m} (HTTP ${http})`);
      }
    }

    if (!jakikolwiekOk) {
      console.error(`
Żaden HeadBucket nie przeszedł — sprawdź w Cloudflare: R2 → Manage R2 API Tokens
(uprawnienia Object Read & Write na właściwych bucketach lub „All buckets”).
`);
      process.exit(1);
    }

    console.log(`
Uwaga: pełnej listy bucketów bez uprawnienia „Admin / List buckets” nie zobaczysz.
Jeśli któryś z trzech bucketów zwrócił 404 — utwórz go: npm run r2:buckets (+ CLOUDFLARE_API_TOKEN).`);
  }
}

main();
