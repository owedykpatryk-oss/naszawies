/**
 * Minimalny parser .env.local (bez zależności dotenv).
 * Nie nadpisuje zmiennych już ustawionych w procesie.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export function wczytajEnvLocal() {
  const sciezka = join(process.cwd(), ".env.local");
  if (!existsSync(sciezka)) return;
  const raw = readFileSync(sciezka, "utf8");
  for (let line of raw.split(/\r?\n/)) {
    line = line.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}
