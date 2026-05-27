#!/usr/bin/env node
/**
 * Włącza Google / GitHub OAuth i poprawia Site URL + Redirect URLs w Supabase (Management API).
 *
 * Wymaga w .env.local (lub zmiennych środowiska):
 *   SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID
 *   SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET
 *   (opcjonalnie GitHub: SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID + _SECRET)
 *   NEXT_PUBLIC_SITE_URL (domyślnie https://naszawies.pl)
 *
 * Token: SUPABASE_ACCESS_TOKEN albo token z `supabase login` (Windows Credential Manager).
 *
 *   node --env-file=.env.local scripts/wlacz-oauth-supabase.mjs
 *   node --env-file=.env.local scripts/wlacz-oauth-supabase.mjs --dry-run
 *   node --env-file=.env.local scripts/wlacz-oauth-supabase.mjs --tylko-adresy
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

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

function pobierzToken() {
  const jawny = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (jawny) return jawny;
  try {
    return execFileSync("node", [path.join(__dirname, "pobierz-token-supabase-cli.mjs")], {
      encoding: "utf8",
    }).trim();
  } catch {
    return null;
  }
}

function listaPrzekierowan(siteUrl) {
  const baza = siteUrl.replace(/\/$/, "");
  const www = baza.includes("://www.") ? baza : baza.replace("://", "://www.");
  const bezWww = baza.replace("://www.", "://");
  const unikalne = new Set([
    `${bezWww}/**`,
    `${www}/**`,
    "http://localhost:3000/**",
    "http://127.0.0.1:3000/**",
    "https://*.vercel.app/**",
    `${bezWww}/auth/potwierdz`,
    `${www}/auth/potwierdz`,
    "http://localhost:3000/auth/potwierdz",
  ]);
  return [...unikalne].join(",");
}

const dryRun = process.argv.includes("--dry-run");
const tylkoAdresy = process.argv.includes("--tylko-adresy");

const ref =
  process.env.SUPABASE_PROJECT_REF?.trim() ||
  refZUrl(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) ||
  refZUrl(process.env.SUPABASE_URL?.trim());

if (!ref) {
  console.error("Ustaw NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_PROJECT_REF.");
  process.exit(1);
}

const token = pobierzToken();
if (!token) {
  console.error(
    "Brak SUPABASE_ACCESS_TOKEN. Zaloguj się: supabase login\n" +
      "albo dodaj token z https://supabase.com/dashboard/account/tokens do .env.local",
  );
  process.exit(1);
}

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://naszawies.pl").replace(/\/$/, "");

const googleId = process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID?.trim();
const googleSecret = process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET?.trim();
const githubId = process.env.SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID?.trim();
const githubSecret = process.env.SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET?.trim();

const payload = {
  site_url: siteUrl,
  uri_allow_list: listaPrzekierowan(siteUrl),
};

if (!tylkoAdresy) {
  if (googleId && googleSecret) {
    payload.external_google_enabled = true;
    payload.external_google_client_id = googleId;
    payload.external_google_secret = googleSecret;
    payload.external_google_skip_nonce_check = false;
  } else {
    console.warn(
      "Pominięto Google OAuth — brak SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID / _SECRET w .env.local",
    );
  }

  if (githubId && githubSecret) {
    payload.external_github_enabled = true;
    payload.external_github_client_id = githubId;
    payload.external_github_secret = githubSecret;
  }
}

const url = `https://api.supabase.com/v1/projects/${ref}/config/auth`;

if (dryRun) {
  console.log(JSON.stringify({ url, payload: { ...payload, external_google_secret: payload.external_google_secret ? "***" : undefined, external_github_secret: payload.external_github_secret ? "***" : undefined } }, null, 2));
  process.exit(0);
}

const resp = await fetch(url, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

const bodyText = await resp.text();
let body;
try {
  body = JSON.parse(bodyText);
} catch {
  body = bodyText;
}

if (!resp.ok) {
  console.error("Błąd Management API:", resp.status, body);
  process.exit(1);
}

console.log("Auth zaktualizowany:");
console.log("  site_url:", body.site_url ?? siteUrl);
console.log("  google:", body.external_google_enabled ? "włączony" : "wyłączony");
console.log("  github:", body.external_github_enabled ? "włączony" : "wyłączony");
console.log(
  "  redirect URLs:",
  String(body.uri_allow_list ?? payload.uri_allow_list)
    .split(/[\n,]/)
    .filter(Boolean).length,
  "wpisów",
);

if (!body.external_google_enabled && !tylkoAdresy) {
  console.log("\nAby włączyć Google:");
  console.log("1. Google Cloud Console → OAuth client (Web)");
  console.log(`2. Redirect URI: https://${ref}.supabase.co/auth/v1/callback`);
  console.log("3. Dodaj do .env.local:");
  console.log("   SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=...");
  console.log("   SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=...");
  console.log("4. Uruchom ponownie: npm run wlacz:oauth-supabase");
}
