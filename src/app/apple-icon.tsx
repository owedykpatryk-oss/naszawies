import { generujIkoneMarki } from "@/lib/pwa/generuj-ikone-marki";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return generujIkoneMarki(180);
}
