function tenSamDzien(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function skrotCzasWiadomosci(iso: string): string {
  const d = new Date(iso);
  const teraz = new Date();
  const roznicaMs = teraz.getTime() - d.getTime();

  if (roznicaMs < 60_000) return "teraz";
  if (roznicaMs < 3_600_000) return `${Math.max(1, Math.floor(roznicaMs / 60_000))} min`;

  if (tenSamDzien(d, teraz)) {
    return d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  }

  const wczoraj = new Date(teraz);
  wczoraj.setDate(wczoraj.getDate() - 1);
  if (tenSamDzien(d, wczoraj)) return "wczoraj";

  if (teraz.getFullYear() === d.getFullYear()) {
    return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
  }

  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
}

export function kluczDniaWiadomosci(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function etykietaDniaWiadomosci(iso: string): string {
  const d = new Date(iso);
  const teraz = new Date();

  if (tenSamDzien(d, teraz)) return "Dziś";

  const wczoraj = new Date(teraz);
  wczoraj.setDate(wczoraj.getDate() - 1);
  if (tenSamDzien(d, wczoraj)) return "Wczoraj";

  return d.toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: d.getFullYear() !== teraz.getFullYear() ? "numeric" : undefined,
  });
}

export function skrotPodgladuWiadomosci(body: string, max = 72): string {
  const jednaLinia = body.replace(/\s+/g, " ").trim();
  if (jednaLinia.length <= max) return jednaLinia;
  return `${jednaLinia.slice(0, max - 1)}…`;
}
