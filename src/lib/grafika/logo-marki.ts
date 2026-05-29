import { LOGO_APP_SRC } from "@/components/marka/logo-naszawies";

/** Logo platformy na plakatach (kościół, wieś, pszenica). */
export const LOGO_GRAFIKA_SRC = LOGO_APP_SRC;

let cacheDataUrl: string | null = null;

/** Data URL do eksportu PDF/PNG (html2canvas wymaga osadzonego obrazu). */
export async function wczytajLogoMarkiJakoDataUrl(): Promise<string> {
  if (cacheDataUrl) return cacheDataUrl;
  const res = await fetch(LOGO_GRAFIKA_SRC);
  if (!res.ok) throw new Error("Nie udało się wczytać logo marki.");
  const blob = await res.blob();
  cacheDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Odczyt logo nie powiódł się."));
    reader.readAsDataURL(blob);
  });
  return cacheDataUrl;
}
