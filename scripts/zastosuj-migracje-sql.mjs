/**
 * Stosuje pliki z supabase/migrations/*.sql po kolei (nazwa pliku).
 * Wymaga połączenia Postgres (np. Supabase → Settings → Database → URI).
 *
 *   set DATABASE_URL=postgresql://postgres....   (PowerShell: $env:DATABASE_URL="...")
 *   node scripts/zastosuj-migracje-sql.mjs
 *
 * Opcjonalnie: node --env-file=.env.local scripts/zastosuj-migracje-sql.mjs
 *
 * Uwaga: to nie zastępuje historii Supabase CLI — używaj `supabase db push`, jeśli projekt jest podlinkowany.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const url = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!url || String(url).trim() === "") {
  console.error(
    "Brak DATABASE_URL (lub DIRECT_URL). Wklej URI z Supabase (Settings → Database) i uruchom ponownie."
  );
  process.exit(1);
}

const katalogMigracji = join(process.cwd(), "supabase", "migrations");
const pliki = readdirSync(katalogMigracji)
  .filter((n) => n.endsWith(".sql"))
  .sort();

const klient = new pg.Client({
  connectionString: url,
  ssl: url.includes("localhost") ? false : { rejectUnauthorized: false },
});

await klient.connect();
console.log(`Połączono. Migracje: ${pliki.length} plik(ów).`);

let nr = 0;
for (const nazwa of pliki) {
  nr += 1;
  const sciezka = join(katalogMigracji, nazwa);
  const sql = readFileSync(sciezka, "utf8");
  process.stdout.write(`[${nr}/${pliki.length}] ${nazwa} … `);
  try {
    await klient.query(sql);
    console.log("OK");
  } catch (e) {
    console.log("BŁĄD");
    console.error(e);
    await klient.end();
    process.exit(1);
  }
}

await klient.end();
console.log("Zakończono — wszystkie pliki SQL wykonane.");
