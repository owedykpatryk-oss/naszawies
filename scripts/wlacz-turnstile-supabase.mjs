#!/usr/bin/env node
/**
 * Włącza Cloudflare Turnstile w Supabase Auth (ochrona signUp/signIn bezpośrednio przez anon key).
 *
 * Wymaga: SUPABASE_ACCESS_TOKEN (lub supabase login), TURNSTILE_SECRET_KEY w .env.local
 *
 *   npm run wlacz:turnstile-supabase
 *   node scripts/wlacz-turnstile-supabase.mjs --dry-run
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
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

zaladujEnvLocal();

function refZUrl(url) {
  const m = String(url || "").trim().match(/https:\/\/([a-z0-9]+)\.supabase\.co/i);
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

const dryRun = process.argv.includes("--dry-run");

const ref =
  process.env.SUPABASE_PROJECT_REF?.trim() ||
  refZUrl(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) ||
  refZUrl(process.env.SUPABASE_URL?.trim());

const secret = process.env.TURNSTILE_SECRET_KEY?.trim();

if (!ref) {
  console.error("Ustaw NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_PROJECT_REF.");
  process.exit(1);
}
if (!secret) {
  console.error("Brak TURNSTILE_SECRET_KEY w .env.local — najpierw: npm run turnstile:setup");
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

const payload = {
  security_captcha_enabled: true,
  security_captcha_provider: "turnstile",
  security_captcha_secret: secret,
  security_sb_forwarded_for_enabled: true,
};

const url = `https://api.supabase.com/v1/projects/${ref}/config/auth`;

if (dryRun) {
  console.log(JSON.stringify({ url, payload: { ...payload, security_captcha_secret: "***" } }, null, 2));
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

console.log("Supabase Auth — Turnstile włączony:");
console.log("  captcha_enabled:", body.security_captcha_enabled ?? true);
console.log("  captcha_provider:", body.security_captcha_provider ?? "turnstile");
console.log("  forwarded_for (rate limit IP):", body.security_sb_forwarded_for_enabled ?? true);
console.log("\nDirect signUp/signIn przez anon key wymaga teraz captchaToken w options.");
