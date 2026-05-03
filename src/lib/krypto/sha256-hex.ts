import { createHash } from "crypto";

export function sha256Hex(tekst: string): string {
  return createHash("sha256").update(tekst, "utf8").digest("hex");
}
