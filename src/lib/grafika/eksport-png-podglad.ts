/** PNG w natywnym rozmiarze podglądu (nie social). */

function czekajNaMalowanie(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export function bezpiecznaNazwaPlikuPngPodglad(nazwa: string): string {
  const trimmed = (nazwa || "grafika").trim() || "grafika";
  const bez = trimmed.replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "_").replace(/\s+/g, "_");
  const base = bez.slice(0, 90).replace(/_+/g, "_").replace(/^_|_$/g, "") || "grafika";
  return base.toLowerCase().endsWith(".png") ? base : `${base}.png`;
}

export async function pobierzPngPodgladuNatywny(
  zrodlo: HTMLElement,
  nazwaPliku: string,
): Promise<{ ok: true } | { ok: false; komunikat: string }> {
  if (typeof document === "undefined") {
    return { ok: false, komunikat: "Funkcja dostępna tylko w przeglądarce." };
  }

  const klon = zrodlo.cloneNode(true) as HTMLElement;
  klon.querySelectorAll(".no-print").forEach((node) => {
    node.parentElement?.removeChild(node);
  });

  const wrap = document.createElement("div");
  wrap.style.cssText =
    "position:fixed;left:0;top:0;z-index:2147483646;background:#fff;overflow:visible;pointer-events:none;";
  wrap.appendChild(klon);
  document.body.appendChild(wrap);
  void wrap.offsetHeight;
  await czekajNaMalowanie();

  try {
    const html2canvas = (await import("html2canvas")).default;
    const rect = klon.getBoundingClientRect();
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const scale = Math.min(2, Math.max(1, dpr));

    const canvas = await html2canvas(klon, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: Math.ceil(rect.width),
      height: Math.ceil(rect.height),
      scrollX: 0,
      scrollY: 0,
    });

    const link = document.createElement("a");
    link.download = nazwaPliku;
    link.href = canvas.toDataURL("image/png", 0.95);
    link.click();
    return { ok: true };
  } catch (e) {
    const komunikat = e instanceof Error ? e.message : "Nie udało się utworzyć PNG.";
    return { ok: false, komunikat };
  } finally {
    wrap.parentElement?.removeChild(wrap);
  }
}
