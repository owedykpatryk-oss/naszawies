import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "_mcp");
const base = process.argv[2];
if (!base) {
  console.error("Usage: print-mcp-apply-args <migration_base_name>, e.g. 20260430150000_mapa_wsi_granice_rpc");
  process.exit(1);
}
const p = path.join(root, `${base}.json`);
const o = JSON.parse(fs.readFileSync(p, "utf8"));
process.stdout.write(JSON.stringify(o));
