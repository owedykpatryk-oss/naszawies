import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createAdminSupabaseClient } from "../src/lib/supabase/admin-client";
import { synchronizujGruntyGus } from "../src/lib/gus/synchronizuj-grunty-gus";

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

  const wynik = await synchronizujGruntyGus(admin);
  console.log(JSON.stringify(wynik, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
