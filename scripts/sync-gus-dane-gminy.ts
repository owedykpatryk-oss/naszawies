import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createAdminSupabaseClient } from "../src/lib/supabase/admin-client";
import { synchronizujGruntyGus } from "../src/lib/gus/synchronizuj-grunty-gus";
import { synchronizujLudnoscGus } from "../src/lib/gus/synchronizuj-ludnosc-gus";
import { synchronizujPsrGus } from "../src/lib/gus/synchronizuj-psr-gus";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

for (const plik of [".env.local", ".env"]) {
  const sciezka = resolve(root, plik);
  if (!existsSync(sciezka)) continue;
  for (const linia of readFileSync(sciezka, "utf8").split("\n")) {
    const m = linia.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const k = m[1].trim();
    const v = m[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
}

async function main() {
  const admin = createAdminSupabaseClient();
  if (!admin) {
    console.error("Brak SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const { count: gruntyCount } = await admin
    .from("gus_ceny_gruntow_woj")
    .select("wojewodztwo", { count: "exact", head: true });

  if ((gruntyCount ?? 0) < 16) {
    console.log("Sync: grunty...");
    const grunty = await synchronizujGruntyGus(admin);
    console.log(JSON.stringify(grunty, null, 2));
  } else {
    console.log(`Sync: grunty pominięte (${gruntyCount} woj. w bazie).`);
  }

  console.log("Sync: ludność...");
  const ludnosc = await synchronizujLudnoscGus(admin);
  console.log(JSON.stringify(ludnosc, null, 2));

  console.log("Sync: PSR...");
  const psr = await synchronizujPsrGus(admin);
  console.log(JSON.stringify(psr, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
