import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createAdminSupabaseClient } from "../src/lib/supabase/admin-client";
import { synchronizujCenyGus } from "../src/lib/gus/synchronizuj-ceny-gus-automatycznie";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function wczytajEnv() {
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
}

wczytajEnv();

async function main() {
  const admin = createAdminSupabaseClient();
  if (!admin) {
    console.error("Brak SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL");
    process.exit(1);
  }

  console.log("Start synchronizacji cen GUS BDL...");
  const start = Date.now();
  const wynik = await synchronizujCenyGus(admin);
  console.log(JSON.stringify(wynik, null, 2));
  console.log(`Czas: ${((Date.now() - start) / 1000).toFixed(1)}s`);

  const { count } = await admin.from("agri_ceny_gus").select("id", { count: "exact", head: true });
  console.log(`Wierszy w agri_ceny_gus: ${count ?? "?"}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
