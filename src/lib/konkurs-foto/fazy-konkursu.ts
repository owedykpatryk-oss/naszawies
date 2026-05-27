export type StatusKonkursuFoto = "draft" | "submissions" | "voting" | "closed" | "cancelled";

export type KonkursFotoPubliczny = {
  id: string;
  title: string;
  description: string | null;
  rulesText: string | null;
  status: StatusKonkursuFoto;
  submissionsStart: string;
  submissionsEnd: string;
  votingStart: string;
  votingEnd: string;
  maxEntriesPerUser: number;
  winnerPhotoId: string | null;
};

export type ZdjecieKonkursu = {
  id: string;
  url: string;
  caption: string | null;
  voteCount: number;
  createdAt: string;
};

export function etykietaFazyKonkursu(status: StatusKonkursuFoto): string {
  if (status === "draft") return "Przygotowanie";
  if (status === "cancelled") return "Anulowany";
  if (status === "submissions") return "Trwa zgłaszanie zdjęć";
  if (status === "voting") return "Trwa głosowanie";
  if (status === "closed") return "Zakończony — wyniki";
  return status;
}

export function czyMoznaZglaszac(k: KonkursFotoPubliczny, teraz = Date.now()): boolean {
  if (k.status !== "submissions") return false;
  const start = new Date(k.submissionsStart).getTime();
  const end = new Date(k.submissionsEnd).getTime();
  return teraz >= start && teraz <= end;
}

export function czyMoznaGlosowac(k: KonkursFotoPubliczny, teraz = Date.now()): boolean {
  if (k.status !== "voting") return false;
  const start = new Date(k.votingStart).getTime();
  const end = new Date(k.votingEnd).getTime();
  return teraz >= start && teraz <= end;
}

export function formatujZakresDat(start: string, end: string): string {
  const fmt = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short" });
  return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`;
}
