import Link from "next/link";
import type { WpisHistoriiPubliczny } from "@/lib/historia/typy-historii";

type Props = {
  wpis: WpisHistoriiPubliczny;
  sciezkaProfilu: string;
};

/** „Dzisiaj w historii” — ten sam dzień i miesiąc w przeszłości. */
export function DzisiajWHistoriiBaner({ wpis, sciezkaProfilu }: Props) {
  const data = wpis.event_date ?? wpis.created_at;
  const rok = new Date(data).getFullYear();

  return (
    <div className="mt-4 rounded-xl border border-amber-300/70 bg-gradient-to-r from-amber-100/80 to-amber-50/50 px-4 py-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">Dzisiaj w historii</p>
      <p className="mt-1 text-sm text-stone-700">
        {new Date().toLocaleDateString("pl-PL", { day: "numeric", month: "long" })} — przypomnienie z roku{" "}
        <strong>{rok}</strong>
      </p>
      <Link
        href={`${sciezkaProfilu}/historia/${wpis.id}`}
        className="mt-2 block font-medium text-amber-950 hover:underline"
      >
        {wpis.title}
      </Link>
      {wpis.short_description ? (
        <p className="mt-1 line-clamp-2 text-xs text-stone-600">{wpis.short_description}</p>
      ) : null}
    </div>
  );
}
