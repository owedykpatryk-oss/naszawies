#!/usr/bin/env node
/**
 * Kopiuje wybrane klucze z .env.local do Vercel (production + preview).
 *   node scripts/uzupelnij-env-vercel.mjs
 *   node scripts/uzupelnij-env-vercel.mjs --dry-run
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ENV_LOCAL = path.join(ROOT, ".env.local");
const dryRun = process.argv.includes("--dry-run");

/** Nie wysyłaj na Vercel (OAuth → Supabase CLI, tokeny dev). */
const POMIN = new Set([
  "SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID",
  "SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET",
  "SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID",
  "SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET",
  "SUPABASE_ACCESS_TOKEN",
  "VERCEL_TOKEN",
  "DATABASE_URL",
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_TURNSTILE_API_TOKEN",
  "UPSTASH_SEARCH_REST_URL",
  "UPSTASH_SEARCH_REST_TOKEN",
]);

/** Prefiksy opcjonalne (Sentry) — dodaj tylko jeśli wartość niepusta. */
const OPCJONALNE_PREFIKSY = ["SENTRY_"];

function parsujEnv(plik) {
  const map = new Map();
  if (!fs.existsSync(plik)) return map;
  for (const line of fs.readFileSync(plik, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    map.set(key, val);
  }
  return map;
}

function czySynchronizowac(key, val) {
  if (POMIN.has(key)) return false;
  if (!val || val.length === 0) return false;
  if (OPCJONALNE_PREFIKSY.some((p) => key.startsWith(p))) return false;
  if (key.startsWith("VERCEL_")) return false;
  return true;
}

function dodajDoVercel(key, value) {
  if (dryRun) {
    console.log(`[dry-run] ${key} → production, preview`);
    return { ok: true };
  }
  for (const target of ["production", "preview"]) {
    const proc = spawnSync(
      "vercel",
      ["env", "add", key, target, "--force", "--sensitive"],
      {
        cwd: ROOT,
        input: value,
        encoding: "utf8",
        shell: process.platform === "win32",
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
    const err = (proc.stderr || "") + (proc.stdout || "");
    if (proc.status !== 0) {
      console.error(`✗ ${key} (${target}): ${err.trim().slice(0, 180)}`);
      return { ok: false };
    }
  }
  console.log(`✓ ${key}`);
  return { ok: true };
}

const env = parsujEnv(ENV_LOCAL);
const klucze = [...env.keys()].filter((k) => czySynchronizowac(k, env.get(k))).sort();

console.log(`Synchronizacja ${klucze.length} zmiennych z .env.local → Vercel (production + preview)${dryRun ? " [dry-run]" : ""}…\n`);

let ok = 0;
let fail = 0;
for (const key of klucze) {
  const r = dodajDoVercel(key, env.get(key));
  if (r.ok) ok++;
  else fail++;
}

console.log(`\nGotowe: ${ok} OK, ${fail} błędów.`);
if (!dryRun && ok > 0) {
  console.log("→ Zrób redeploy produkcji (Vercel Dashboard lub: vercel --prod)");
}
process.exit(fail > 0 ? 1 : 0);
