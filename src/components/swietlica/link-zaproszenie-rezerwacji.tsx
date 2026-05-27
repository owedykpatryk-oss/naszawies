import Link from "next/link";

type Props = {
  bookingId: string;
  eventType: string;
  eventTitle: string | null;
  startAt: string;
  endAt: string;
  hallName: string;
  status: string;
};

/** Link do kreatora grafiki z danymi rezerwacji w query string. */
export function LinkZaproszenieRezerwacji({
  bookingId,
  eventType,
  eventTitle,
  startAt,
  endAt,
  hallName,
  status,
}: Props) {
  if (status !== "approved" && status !== "pending" && status !== "completed") return null;

  const params = new URLSearchParams({
    rezerwacja: bookingId,
    typ: eventType,
    start: startAt,
    koniec: endAt,
    sala: hallName,
  });
  if (eventTitle?.trim()) params.set("tytul", eventTitle.trim());

  return (
    <Link
      href={`/panel/mieszkaniec/grafika?${params.toString()}`}
      className="mt-2 inline-flex items-center gap-1 rounded-lg border border-green-800/30 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-900 hover:bg-green-100"
    >
      {status === "completed" ? "✉ Zaproszenie / podziękowanie" : "✉ Wygeneruj zaproszenie"}
    </Link>
  );
}
