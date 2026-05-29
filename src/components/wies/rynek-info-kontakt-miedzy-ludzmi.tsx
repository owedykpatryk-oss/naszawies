/** Krótka informacja: rynek to tablica ogłoszeń — bez płatności w serwisie. */
export function RynekInfoKontaktMiedzyLudzmi({ wariant = "domyslny" }: { wariant?: "domyslny" | "kompakt" }) {
  if (wariant === "kompakt") {
    return (
      <p className="text-[11px] leading-relaxed text-stone-600">
        <strong className="text-stone-800">Bez płatności online.</strong> Cena, odbiór i zapłata — między Wami (gotówka,
        przelew, umowa). Serwis tylko łączy sąsiadów: ogłoszenie, czat, telefon.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200/80 bg-stone-50/80 px-3 py-2.5 text-xs leading-relaxed text-stone-700">
      <p className="font-semibold text-stone-900">Kontakt i rozliczenie między ludźmi</p>
      <p className="mt-1">
        Naszawies <strong>nie przyjmuje płatności</strong> i nie jest pośrednikiem w transakcji. Dogadujecie się sami —
        czatem w serwisie, telefonem, WhatsApp lub na miejscu. Gotówka, przelew czy umowa to wyłącznie sprawa kupującego
        i sprzedającego.
      </p>
    </div>
  );
}
