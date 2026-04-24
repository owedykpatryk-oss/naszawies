#!/usr/bin/env node
/**
 * Wgrywa HTML szablonów Auth z repozytorium na hosting Supabase (Management API).
 *
 * Wymaga:
 *   SUPABASE_ACCESS_TOKEN — https://supabase.com/dashboard/account/tokens (uprawnienia do projektu)
 *   NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_PROJECT_REF (np. qxvdjghfsrrxrivfahmn)
 *
 * Uruchom z katalogu naszawies (root package.json):
 *   node --env-file=.env.local scripts/wgraj-szablony-maili-supabase.mjs
 *   node scripts/wgraj-szablony-maili-supabase.mjs --dry-run
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SZABLONY = path.join(ROOT, "supabase", "templates", "email");

/** Proste wczytanie .env.local (tylko KEY=wartość), bez nadpisywania już ustawionych zmiennych. */
function zaladujEnvLocal() {
  const p = path.join(ROOT, ".env.local");
  if (!fs.existsSync(p)) return;
  let raw = fs.readFileSync(p, "utf8");
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

zaladujEnvLocal();

function refZUrl(url) {
  if (!url) return null;
  const m = String(url).trim().match(/https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return m ? m[1] : null;
}

function wczytaj(nazwa) {
  const p = path.join(SZABLONY, nazwa);
  if (!fs.existsSync(p)) {
    throw new Error(`Brak pliku: ${p}`);
  }
  return fs.readFileSync(p, "utf8");
}

const dryRun = process.argv.includes("--dry-run");

const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const ref =
  process.env.SUPABASE_PROJECT_REF?.trim() ||
  refZUrl(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) ||
  refZUrl(process.env.SUPABASE_URL?.trim());

if (!ref) {
  console.error(
    "Ustaw NEXT_PUBLIC_SUPABASE_URL (https://<ref>.supabase.co) lub SUPABASE_PROJECT_REF."
  );
  process.exit(1);
}

const payload = {
  mailer_subjects_confirmation: "Potwierdź konto — naszawies.pl",
  mailer_templates_confirmation_content: wczytaj("potwierdzenie.html"),

  mailer_subjects_recovery: "Zresetuj hasło — naszawies.pl",
  mailer_templates_recovery_content: wczytaj("odbuduj-haslo.html"),

  mailer_subjects_magic_link: "Link do logowania — naszawies.pl",
  mailer_templates_magic_link_content: wczytaj("magic-link.html"),

  mailer_subjects_email_change: "Potwierdź zmianę e-mail — naszawies.pl",
  mailer_templates_email_change_content: wczytaj("zmiana-email.html"),

  mailer_subjects_invite: "Zaproszenie — naszawies.pl",
  mailer_templates_invite_content: wczytaj("zaproszenie.html"),

  mailer_subjects_reauthentication: "Kod potwierdzenia — naszawies.pl",
  mailer_templates_reauthentication_content: wczytaj("potwierdz-dzialanie.html"),
};

console.log(`Projekt (ref): ${ref}`);
for (const [k, v] of Object.entries(payload)) {
  if (k.startsWith("mailer_templates_")) {
    console.log(`  ${k}: ${v.length} znaków`);
  } else {
    console.log(`  ${k}: ${JSON.stringify(v)}`);
  }
}

if (dryRun) {
  console.log("\n--dry-run: pomijam wywołanie API.");
  process.exit(0);
}

if (!token) {
  console.error(
    "\nBrak SUPABASE_ACCESS_TOKEN. Token: https://supabase.com/dashboard/account/tokens\n" +
      "Dodaj do .env.local linię SUPABASE_ACCESS_TOKEN=... (plik jest w .gitignore), potem:\n" +
      "  npm run wgraj:szablony-maili\n" +
      "Albo jednorazowo w PowerShell: $env:SUPABASE_ACCESS_TOKEN=\"...\"; npm run wgraj:szablony-maili\n"
  );
  process.exit(1);
}

const url = `https://api.supabase.com/v1/projects/${ref}/config/auth`;
const odp = await fetch(url, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

const tekst = await odp.text();
if (!odp.ok) {
  console.error(`Błąd API ${odp.status}:`, tekst.slice(0, 2000));
  process.exit(1);
}

console.log("\nOK — szablony zapisane w Supabase (odpowiedź 2xx).");
if (tekst && tekst.length < 500) console.log(tekst);
