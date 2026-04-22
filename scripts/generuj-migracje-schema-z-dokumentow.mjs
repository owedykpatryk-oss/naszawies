/**
 * Skleja schema.sql (bez bloku CREATE waitlist) + rls-policies.sql
 * do jednej migracji Supabase — uruchom: node scripts/generuj-migracje-schema-z-dokumentow.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const pakiet = path.join(root, "..", "Cloude Docs", "naszawies-package", "database");

const schema = fs.readFileSync(path.join(pakiet, "schema.sql"), "utf8");
const rls = fs.readFileSync(path.join(pakiet, "rls-policies.sql"), "utf8");

const startWait = schema.indexOf("-- =========================================\n-- WAITLIST");
const startTriggers = schema.indexOf(
  "-- =========================================\n-- TRIGGERS",
  startWait
);

if (startWait === -1 || startTriggers === -1) {
  console.error("Nie znaleziono znaczników WAITLIST / TRIGGERS w schema.sql");
  process.exit(1);
}

const przed = schema.slice(0, startWait);
const po = schema.slice(startTriggers);

const lacznikWaitlist = `
-- =========================================
-- WAITLIST — tabela już utworzona w migracji 20250422130000; dodajemy FK do users
-- =========================================
ALTER TABLE public.waitlist
  DROP CONSTRAINT IF EXISTS waitlist_converted_user_id_fkey;
ALTER TABLE public.waitlist
  ADD CONSTRAINT waitlist_converted_user_id_fkey
  FOREIGN KEY (converted_user_id) REFERENCES public.users(id) ON DELETE SET NULL;

`;

const naglowek = `-- Wygenerowano z Cloude Docs/naszawies-package/database/schema.sql + rls-policies.sql
-- Nie edytuj ręcznie — odtwórz: node scripts/generuj-migracje-schema-z-dokumentow.mjs

`;

const wynik = `${naglowek}${przed}${lacznikWaitlist}${po}\n\n-- === RLS (z rls-policies.sql) ===\n${rls}\n`;

const out = path.join(
  root,
  "supabase",
  "migrations",
  "20260423140000_schemat_i_rls_z_dokumentacji.sql"
);
fs.writeFileSync(out, wynik);
console.log("Zapisano", out, "bajtów:", wynik.length);
