#!/usr/bin/env node
/**
 * Uzupełnia puste klucze w .env.local wartościami z pliku pobranego z Vercel.
 *
 *   npm run env:pull-vercel
 *   npm run env:merge-vercel
 *   npm run env:merge-vercel -- .env.vercel.check
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LOCAL = path.join(ROOT, ".env.local");
const DOMYSLNY_VERCEL = path.join(ROOT, ".env.vercel.check");

const vercelPlik = process.argv[2] ? path.resolve(process.argv[2]) : DOMYSLNY_VERCEL;

/** Nigdy nie nadpisuj lokalnych sekretów dev-only z Vercel. */
const POMIN = new Set([
  "SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID",
  "SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET",
  "SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID",
  "SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET",
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_TURNSTILE_API_TOKEN",
  "VERCEL_TOKEN",
  "VERCEL_OIDC_TOKEN",
]);

/** Zmienne wstrzykiwane przez Vercel CLI/build — nie trafiają do .env.local. */
const POMIN_PREFIKS = ["VERCEL_", "TURBO_", "NX_"];

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

if (!fs.existsSync(LOCAL)) {
  console.error("Brak .env.local");
  process.exit(1);
}

if (!fs.existsSync(vercelPlik)) {
  console.log("Brak pliku Vercel — pobieram…");
  const proc = spawnSync("npm", ["run", "env:pull-vercel"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (proc.status !== 0) process.exit(proc.status ?? 1);
}

const local = parsujEnv(LOCAL);
const vercel = parsujEnv(vercelPlik);

const uzupelnione = [];
for (const [key, val] of vercel) {
  if (POMIN.has(key)) continue;
  if (POMIN_PREFIKS.some((p) => key.startsWith(p))) continue;
  if (!val) continue;
  const obecna = local.get(key);
  if (obecna && obecna.trim() !== "") continue;
  local.set(key, val);
  uzupelnione.push(key);
}

if (uzupelnione.length === 0) {
  console.log(".env.local — brak pustych kluczy do uzupełnienia z Vercel.");
  process.exit(0);
}

const linie = fs.readFileSync(LOCAL, "utf8").split(/\r?\n/);
const out = [];
const zapisane = new Set();

for (const line of linie) {
  const t = line.trim();
  const m = t.match(/^([A-Za-z_][A-Za-z0-9_]*)=/);
  if (m && uzupelnione.includes(m[1])) {
    const val = local.get(m[1]);
    const cudzyslow = val.includes(" ") ? `"${val.replace(/"/g, '\\"')}"` : val;
    out.push(`${m[1]}=${cudzyslow}`);
    zapisane.add(m[1]);
    continue;
  }
  out.push(line);
}

for (const key of uzupelnione.filter((k) => !zapisane.has(k))) {
  const val = local.get(key);
  const cudzyslow = val.includes(" ") ? `"${val.replace(/"/g, '\\"')}"` : val;
  out.push(`${key}=${cudzyslow}`);
}

fs.writeFileSync(LOCAL, out.join("\n").replace(/\n{3,}/g, "\n\n") + "\n", "utf8");
console.log(`Uzupełniono .env.local z Vercel (${uzupelnione.length}): ${uzupelnione.join(", ")}`);
