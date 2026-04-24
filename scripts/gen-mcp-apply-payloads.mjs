import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const names = [
  "20260430150000_mapa_wsi_granice_rpc",
  "20260430170000_szukaj_wsi_katalog_rpc",
  "20260430201000_audit_log_enable_rls",
  "20260430203000_function_search_path_waitlist_rls",
  "20260430210000_studzienki_hall_layout_data",
  "20260430220000_studzienki_soltys_owedyk_przypisanie",
  "20260430240000_studzienki_hall_layout_data_metric_sala",
];

const root = path.join(__dirname, "..");
for (const name of names) {
  const query = fs.readFileSync(
    path.join(root, "supabase", "migrations", `${name}.sql`),
    "utf8"
  );
  const out = path.join(root, "_mcp", `${name}.json`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ name, query }, null, 0), "utf8");
  console.log(name, fs.statSync(out).size);
}
