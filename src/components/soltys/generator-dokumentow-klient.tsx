"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PrzyciskPobierzPdf } from "@/components/dokumenty/przycisk-pobierz-pdf";
import {
  PRESETY_DOKUMENTOW_SOLTYSA,
  domyslneWartosciPol,
  kontekstSolectwaDlaMeta,
  uzupelnijDomyslnePresetu,
  wygenerujNumerReferencyjnySoltys,
  znajdzPreset,
} from "@/lib/dokumenty-soltysa/presety";
import { zbudujSugestieKontekstowe } from "@/lib/dokumenty-soltysa/sugestie-kontekstowe";
import type { PresetDokumentu } from "@/lib/dokumenty-soltysa/typy";

type Props = {
  /** Pierwsza wieś sołtysa — wstawiana w pole „wies” / „sołectwo”, jeśli puste */
  domyslnaWies?: string;
  domyslnaGmina?: string;
  /** Z profilu — podpis, potwierdzenia, meta „kto wygenerował” */
  domyslnySoltysNazwa?: string;
};

type ScenariuszDokumentu = {
  id: string;
  tytul: string;
  opis: string;
  presetId: string;
  uzupelnienia: Record<string, string>;
};

type StylDokumentu = "urzedowy" | "elegancki" | "nowoczesny";
type RozmiarDokumentu = "standard" | "duzy";
type ZnakWodnyDokumentu = "brak" | "subtelny";
type UkladPodpisowDokumentu = "jeden" | "dwa" | "trzy";

function polaScenariusza(pola: Record<string, string>): Record<string, string> {
  return pola;
}

function pogrupujPresety(lista: PresetDokumentu[]) {
  const map = new Map<string, PresetDokumentu[]>();
  for (const p of lista) {
    const arr = map.get(p.kategoria) ?? [];
    arr.push(p);
    map.set(p.kategoria, arr);
  }
  return Array.from(map.entries());
}

/** Małe litery + usunięcie znaków diakrytycznych — wygodne szukanie po polsku. */
function znormalizujDoSzukania(tekst: string): string {
  return tekst
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function presetPasujeDoFiltra(p: PresetDokumentu, frazaSurowa: string): boolean {
  const f = znormalizujDoSzukania(frazaSurowa);
  if (!f) return true;
  const paczka = [p.tytul, p.opis, p.kategoria, p.id.replace(/-/g, " ")].join(" ");
  return znormalizujDoSzukania(paczka).includes(f);
}

export function GeneratorDokumentowSoltysaKlient({
  domyslnaWies = "",
  domyslnaGmina = "",
  domyslnySoltysNazwa = "",
}: Props) {
  const pierwszy = PRESETY_DOKUMENTOW_SOLTYSA[0];
  const [presetId, ustawPresetId] = useState(pierwszy?.id ?? "");
  const [filtrSzukaj, ustawFiltrSzukaj] = useState("");
  const [numerReferencyjnySesji, ustawNumerReferencyjnySesji] = useState(() =>
    wygenerujNumerReferencyjnySoltys(),
  );
  const [aktywnyKrokLejka, ustawAktywnyKrokLejka] = useState<number | null>(null);
  const [stylDokumentu, ustawStylDokumentu] = useState<StylDokumentu>("urzedowy");
  const [rozmiarDokumentu, ustawRozmiarDokumentu] = useState<RozmiarDokumentu>("standard");
  const [znakWodnyDokumentu, ustawZnakWodnyDokumentu] = useState<ZnakWodnyDokumentu>("subtelny");
  const [ukladPodpisow, ustawUkladPodpisow] = useState<UkladPodpisowDokumentu>("jeden");
  const [aktywnieEdytowanePole, ustawAktywnieEdytowanePole] = useState<string>("");

  const opcjeDomyslne = useMemo(
    () => ({
      domyslnaWies,
      domyslnaGmina,
      domyslnySoltysNazwa,
    }),
    [domyslnaWies, domyslnaGmina, domyslnySoltysNazwa],
  );

  const scenariuszeWow = useMemo<ScenariuszDokumentu[]>(() => {
    const nazwaWsi = domyslnaWies.trim() || "Twojej wsi";
    const nazwaGminy = domyslnaGmina.trim() || "Twojej gminy";
    const podpis = domyslnySoltysNazwa.trim()
      ? `Sołtys ${domyslnySoltysNazwa.trim()}`
      : "Sołtys sołectwa";
    const kontakt = "tel. …, e-mail …";
    const wnioskodawcaSolectwo =
      nazwaWsi !== "Twojej wsi" && nazwaGminy !== "Twojej gminy"
        ? `Sołectwo ${nazwaWsi}, gmina ${nazwaGminy}`
        : nazwaWsi !== "Twojej wsi"
          ? `Sołectwo ${nazwaWsi}`
          : "Sołectwo …";

    return [
      {
        id: "wow-finanse-firma",
        tytul: "Kampania sponsora (finanse)",
        opis: "Prośba o środki do firmy — start z gotowym uzasadnieniem i pakietem korzyści.",
        presetId: "prosba-wsparcie-finansowe-firma",
        uzupelnienia: polaScenariusza({
          adresat: "Do Zarządu / Właściciela\n[NAZWA FIRMY]\n[ADRES]",
          wnioskodawca: wnioskodawcaSolectwo,
          cel: "doposażenie świetlicy wiejskiej",
          kwota: "3 000,00 PLN",
          uzasadnienie:
            "Celem projektu jest doposażenie świetlicy i zwiększenie dostępności zajęć dla dzieci, seniorów oraz spotkań integracyjnych mieszkańców. Inicjatywa realnie poprawi warunki życia społecznego w sołectwie.",
          korzysci:
            "Publiczne podziękowanie na stronie wsi i tablicy ogłoszeń, informacja o partnerstwie podczas wydarzenia, możliwość oznaczenia sponsora na materiałach promocyjnych.",
          kontakt,
          podpis,
        }),
      },
      {
        id: "wow-rzeczowe-uslugi",
        tytul: "Wsparcie rzeczowe/usługowe",
        opis: "Pismo o materiały, transport lub robociznę z gotową sekcją rozliczenia.",
        presetId: "prosba-wsparcie-rzeczowe-uslugowe",
        uzupelnienia: polaScenariusza({
          adresat: "Do [NAZWA FIRMY / SKLEPU / WYKONAWCY]",
          cel: "odświeżenie i naprawy w świetlicy wiejskiej",
          zakres:
            "1) Materiały wykończeniowe.\n2) Transport materiałów.\n3) Wsparcie robocizną przy pracach przygotowawczych.",
          termin: "do uzupełnienia (preferowany termin realizacji)",
          rozliczenie:
            "Przekazanie wsparcia zostanie udokumentowane protokołem odbioru. Po realizacji przygotujemy krótkie podsumowanie efektów dla darczyńcy.",
          kontakt,
          podpis,
        }),
      },
      {
        id: "wow-podziekowanie",
        tytul: "Podziękowanie po realizacji",
        opis: "Gotowe eleganckie podziękowanie dla sponsora po zakończonym działaniu.",
        presetId: "podziekowanie-za-wsparcie",
        uzupelnienia: polaScenariusza({
          adresat: "Do [NAZWA FIRMY / ORGANIZACJI]",
          projekt: "doposażenie świetlicy wiejskiej",
          wsparcie:
            "Dziękujemy za przekazane wsparcie finansowe / rzeczowe, które umożliwiło realizację zadania wskazanego przez mieszkańców.",
          efekt:
            "Dzięki wsparciu poprawiono warunki korzystania ze świetlicy i zwiększono dostępność wydarzeń społecznych dla mieszkańców.",
          publikacja: "strona sołectwa, tablica ogłoszeń i profil społecznościowy",
          podpis,
        }),
      },
      {
        id: "wow-potwierdzenie-darowizny",
        tytul: "Protokół odbioru darowizny",
        opis: "Potwierdzenie dla darczyńcy do podpisu, gotowe do wydruku.",
        presetId: "potwierdzenie-darowizny-rzeczowej",
        uzupelnienia: polaScenariusza({
          darczyca: "[NAZWA DARCZYŃCY / FIRMY]",
          odbiorca: wnioskodawcaSolectwo,
          cel: "doposażenie i utrzymanie świetlicy wiejskiej",
          przedmiot: "Lista przekazanych materiałów / sprzętu / usług (ilość, stan, wartość orientacyjna).",
          uwagi: "Przekazanie zgodne z ustaleniami stron.",
          podpis,
        }),
      },
      {
        id: "wow-kgw-plan-roczny",
        tytul: "KGW: plan roczny",
        opis: "Gotowy układ działań, harmonogramu i budżetu dla koła gospodyń.",
        presetId: "plan-pracy-kgw-roczny",
        uzupelnienia: polaScenariusza({
          nazwa_kgw: "KGW [NAZWA KOŁA]",
          wies: nazwaWsi !== "Twojej wsi" ? nazwaWsi : "Sołectwo …",
          rok_plan: String(new Date().getFullYear()),
          cele:
            "1) Integracja mieszkańców przez wydarzenia lokalne.\n2) Wzmocnienie współpracy międzypokoleniowej.\n3) Promocja tradycji kulinarnych i rękodzielniczych.",
          harmonogram:
            "I kwartał: warsztaty kulinarne.\nII kwartał: piknik rodzinny.\nIII kwartał: udział w dożynkach.\nIV kwartał: kiermasz świąteczny i podsumowanie.",
          budzet:
            "Składki członkowskie, wsparcie sponsorskie, mikrodotacje gminne i dochód z wydarzeń lokalnych.",
          podpis: "Przewodnicząca KGW …",
        }),
      },
      {
        id: "wow-kgw-dotacja",
        tytul: "KGW: wniosek o mikrodotację",
        opis: "Start do naboru gminnego z gotowym opisem projektu i rezultatami.",
        presetId: "wniosek-kgw-mikrodotacja",
        uzupelnienia: polaScenariusza({
          adresat: "Do [NAZWA PROGRAMU / GMINY / FUNDACJI]",
          nazwa_kgw: "KGW [NAZWA KOŁA]",
          wies: nazwaWsi !== "Twojej wsi" ? nazwaWsi : "Sołectwo …",
          tytul_projektu: "Tradycja i integracja pokoleń",
          kwota: "4 500,00 PLN",
          opis:
            "Projekt obejmuje cykl otwartych warsztatów i wydarzeń sąsiedzkich budujących integrację oraz aktywność mieszkańców.",
          rezultaty:
            "Min. 4 wydarzenia, wzrost udziału mieszkańców w działaniach społecznych, trwałe materiały i know-how dla kolejnych edycji.",
          podpis: "Przewodnicząca KGW …",
        }),
      },
      {
        id: "wow-osp-komunikat",
        tytul: "OSP: komunikat bezpieczeństwa",
        opis: "Szybki szablon informacji dla mieszkańców o ćwiczeniach i zaleceniach.",
        presetId: "komunikat-osp-bezpieczenstwo",
        uzupelnienia: polaScenariusza({
          jednostka: "OSP [NAZWA JEDNOSTKI]",
          temat: "Ćwiczenia OSP i czasowe utrudnienia",
          data_miejsce: "Data: …\nMiejsce: …",
          tresc:
            "W wyznaczonym czasie odbędą się ćwiczenia służb. Mogą wystąpić chwilowe utrudnienia w ruchu i wzmożony ruch pojazdów ratowniczych.",
          zalecenia:
            "Prosimy o zachowanie ostrożności, nieblokowanie dojazdów i stosowanie się do poleceń służb porządkowych.",
          kontakt,
        }),
      },
    ];
  }, [domyslnaWies, domyslnaGmina, domyslnySoltysNazwa]);

  const lejekSponsora = useMemo(() => {
    const nazwaWsi = domyslnaWies.trim() || "Twojej wsi";
    const nazwaGminy = domyslnaGmina.trim() || "Twojej gminy";
    const podpis = domyslnySoltysNazwa.trim()
      ? `Sołtys ${domyslnySoltysNazwa.trim()}`
      : "Sołtys sołectwa";
    const kontakt = "tel. …, e-mail …";
    const wnioskodawcaSolectwo =
      nazwaWsi !== "Twojej wsi" && nazwaGminy !== "Twojej gminy"
        ? `Sołectwo ${nazwaWsi}, gmina ${nazwaGminy}`
        : nazwaWsi !== "Twojej wsi"
          ? `Sołectwo ${nazwaWsi}`
          : "Sołectwo …";
    const celSwietlica = "doposażenie świetlicy wiejskiej";

    return [
      {
        krok: 1,
        tytul: "Prośba",
        opis: "Pierwsze pismo z uzasadnieniem i korzyściami dla sponsora.",
        scenariusz: {
          id: "lejek-1-prosba",
          tytul: "",
          opis: "",
          presetId: "prosba-wsparcie-finansowe-firma",
          uzupelnienia: polaScenariusza({
            adresat: "Do Zarządu / Właściciela\n[NAZWA FIRMY]\n[ADRES]",
            wnioskodawca: wnioskodawcaSolectwo,
            cel: celSwietlica,
            kwota: "3 000,00 PLN",
            uzasadnienie:
              "Celem projektu jest doposażenie świetlicy i zwiększenie dostępności zajęć dla dzieci, seniorów oraz spotkań integracyjnych mieszkańców. Inicjatywa realnie poprawi warunki życia społecznego w sołectwie.",
            korzysci:
              "Publiczne podziękowanie na stronie wsi i tablicy ogłoszeń, informacja o partnerstwie podczas wydarzenia, możliwość oznaczenia sponsora na materiałach promocyjnych.",
            kontakt,
            podpis,
          }),
        },
      },
      {
        krok: 2,
        tytul: "Przypomnienie",
        opis: "Delikatne przypomnienie po pierwszej prośbie.",
        scenariusz: {
          id: "lejek-2-przypomnienie",
          tytul: "",
          opis: "",
          presetId: "przypomnienie-o-wsparcie-sponsora",
          uzupelnienia: polaScenariusza({
            adresat: "Do Zarządu / Właściciela\n[NAZWA FIRMY]\n[ADRES]",
            cel: celSwietlica,
            data_pierwszej_prosby: "… (uzupełnij datę pierwszego pisma)",
            tresc:
              "Uprzejmie przypominam o wcześniejszej prośbie o wsparcie inicjatywy sołeckiej. Jeśli jest możliwość krótkiej odpowiedzi lub propozycji innej formy pomocy, będę wdzięczny/a. Pozostaję do dyspozycji.",
            kontakt,
            podpis,
          }),
        },
      },
      {
        krok: 3,
        tytul: "Potwierdzenie wpływu",
        opis: "Notatka po otrzymaniu przelewu — do archiwum.",
        scenariusz: {
          id: "lejek-3-finanse",
          tytul: "",
          opis: "",
          presetId: "potwierdzenie-wplywu-srodkow-finansowych",
          uzupelnienia: polaScenariusza({
            darczyca: "[NAZWA FIRMY / DARCZYŃCY]",
            odbiorca: wnioskodawcaSolectwo,
            kwota: "3 000,00",
            nr_operacji: "… (z wyciągu bankowego)",
            cel: `realizacja zadania: ${celSwietlica}`,
            uwagi: "Dokument ma charakter informacyjny — dopasuj do praktyki księgowej w sołectwie / gminie.",
            podpis,
          }),
        },
      },
      {
        krok: 4,
        tytul: "Podziękowanie",
        opis: "Domknięcie współpracy z podziękowaniem i informacją o publikacji.",
        scenariusz: {
          id: "lejek-4-podziekowanie",
          tytul: "",
          opis: "",
          presetId: "podziekowanie-za-wsparcie",
          uzupelnienia: polaScenariusza({
            adresat: "Do [NAZWA FIRMY / ORGANIZACJI]",
            projekt: celSwietlica,
            wsparcie:
              "Dziękujemy za przekazane wsparcie finansowe, które umożliwiło realizację zadania wskazanego przez mieszkańców.",
            efekt:
              "Dzięki wsparciu poprawiono warunki korzystania ze świetlicy i zwiększono dostępność wydarzeń społecznych dla mieszkańców.",
            publikacja: "strona sołectwa, tablica ogłoszeń i profil społecznościowy",
            podpis,
          }),
        },
      },
    ];
  }, [domyslnaWies, domyslnaGmina, domyslnySoltysNazwa]);

  const presetyPoFiltze = useMemo(
    () => PRESETY_DOKUMENTOW_SOLTYSA.filter((p) => presetPasujeDoFiltra(p, filtrSzukaj)),
    [filtrSzukaj],
  );

  const preset = znajdzPreset(presetId) ?? pierwszy;

  const [wartosci, ustawWartosci] = useState<Record<string, string>>(() => {
    if (!pierwszy) return {};
    const w = domyslneWartosciPol(pierwszy);
    if (domyslnaWies) w.wies = w.wies || domyslnaWies;
    if (domyslnaGmina) w.gmina = w.gmina || domyslnaGmina;
    return uzupelnijDomyslnePresetu(pierwszy, w, {
      domyslnaWies,
      domyslnaGmina,
      domyslnySoltysNazwa,
    });
  });

  const zmienPreset = useCallback(
    (id: string) => {
      ustawPresetId(id);
      const p = znajdzPreset(id);
      if (!p) return;
      const w = domyslneWartosciPol(p);
      if (domyslnaWies && p.pola.some((x) => x.id === "wies")) w.wies = w.wies || domyslnaWies;
      if (domyslnaGmina && p.pola.some((x) => x.id === "gmina")) w.gmina = w.gmina || domyslnaGmina;
      ustawWartosci(uzupelnijDomyslnePresetu(p, w, opcjeDomyslne));
    },
    [domyslnaWies, domyslnaGmina, opcjeDomyslne],
  );

  const uruchomScenariusz = useCallback(
    (scenariusz: ScenariuszDokumentu) => {
      const p = znajdzPreset(scenariusz.presetId);
      if (!p) return;
      ustawPresetId(scenariusz.presetId);
      const bazowe = domyslneWartosciPol(p);
      const merged = { ...bazowe, ...scenariusz.uzupelnienia };
      if (domyslnaWies && p.pola.some((x) => x.id === "wies")) merged.wies = merged.wies || domyslnaWies;
      if (domyslnaGmina && p.pola.some((x) => x.id === "gmina")) merged.gmina = merged.gmina || domyslnaGmina;
      ustawWartosci(uzupelnijDomyslnePresetu(p, merged, opcjeDomyslne));
    },
    [domyslnaWies, domyslnaGmina, opcjeDomyslne],
  );

  const uruchomKrokLejka = useCallback(
    (krok: number, scenariusz: ScenariuszDokumentu) => {
      ustawAktywnyKrokLejka(krok);
      uruchomScenariusz(scenariusz);
    },
    [uruchomScenariusz],
  );

  useEffect(() => {
    const dopasowany = lejekSponsora.find((x) => x.scenariusz.presetId === presetId);
    ustawAktywnyKrokLejka(dopasowany ? dopasowany.krok : null);
  }, [presetId, lejekSponsora]);

  useEffect(() => {
    if (presetyPoFiltze.length === 0) return;
    if (presetyPoFiltze.some((p) => p.id === presetId)) return;
    zmienPreset(presetyPoFiltze[0].id);
  }, [presetyPoFiltze, presetId, zmienPreset]);

  const metaDokumentu = useMemo(() => {
    const d = new Date();
    return {
      dataWygenerowania: d.toLocaleString("pl-PL", {
        dateStyle: "long",
        timeStyle: "short",
      }),
      stanNaDzien: d.toLocaleDateString("pl-PL", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      numerReferencyjny: numerReferencyjnySesji,
      kontekstSolectwa: kontekstSolectwaDlaMeta(domyslnaWies, domyslnaGmina),
      wygenerowalNazwa: domyslnySoltysNazwa.trim() || undefined,
      stylWydruku: stylDokumentu,
      rozmiarWydruku: rozmiarDokumentu,
      znakWodny: znakWodnyDokumentu,
      ukladPodpisow,
    };
  }, [
    domyslnaWies,
    domyslnaGmina,
    domyslnySoltysNazwa,
    numerReferencyjnySesji,
    stylDokumentu,
    rozmiarDokumentu,
    znakWodnyDokumentu,
    ukladPodpisow,
  ]);

  const htmlPodglad = useMemo(() => {
    if (!preset) return "";
    return preset.budujHtml(wartosci, metaDokumentu);
  }, [preset, wartosci, metaDokumentu]);

  const nazwaPlikuPdf = useMemo(() => {
    if (!preset) return "naszawies-soltys.pdf";
    const slug = preset.id.replace(/[^a-z0-9-]/gi, "_");
    const d = new Date().toISOString().slice(0, 10);
    const nr = numerReferencyjnySesji.replace(/[^\w-]+/g, "") || "ref";
    return `naszawies-soltys_${slug}_${nr}_${d}.pdf`;
  }, [preset, numerReferencyjnySesji]);

  const wyczyscPolaPresetu = useCallback(() => {
    if (!preset) return;
    const w = domyslneWartosciPol(preset);
    if (domyslnaWies && preset.pola.some((x) => x.id === "wies")) w.wies = domyslnaWies;
    if (domyslnaGmina && preset.pola.some((x) => x.id === "gmina")) w.gmina = domyslnaGmina;
    ustawWartosci(uzupelnijDomyslnePresetu(preset, w, opcjeDomyslne));
  }, [preset, domyslnaWies, domyslnaGmina, opcjeDomyslne]);

  const wstawDoPola = useCallback((poleId: string, fragment: string, dopisz: boolean) => {
    ustawWartosci((prev) => {
      const cur = (prev[poleId] ?? "").trim();
      if (dopisz && cur.length > 0) {
        return { ...prev, [poleId]: `${cur}\n\n${fragment}` };
      }
      return { ...prev, [poleId]: fragment };
    });
  }, []);

  const poprawBrzmieniePola = useCallback(
    (wariant: "formalny" | "konkretny" | "uprzejmy") => {
      const poleId = aktywnieEdytowanePole;
      if (!poleId) return;
      ustawWartosci((prev) => {
        const bazowy = (prev[poleId] ?? "").trim();
        if (!bazowy) return prev;
        let nowy = bazowy;
        if (wariant === "formalny") {
          nowy = `Niniejszym informuję, że ${bazowy.charAt(0).toLowerCase()}${bazowy.slice(1)}.`;
        } else if (wariant === "konkretny") {
          nowy = `Zakres działań:\n- ${bazowy.replace(/\n+/g, "\n- ")}`;
        } else {
          nowy = `${bazowy}\n\nW razie pytań pozostaję do dyspozycji i dziękuję za życzliwe rozpatrzenie sprawy.`;
        }
        return { ...prev, [poleId]: nowy };
      });
    },
    [aktywnieEdytowanePole],
  );

  const wartosciDlaSugestii = useMemo(
    () => ({
      ...wartosci,
      gmina: (wartosci.gmina ?? "").trim() || domyslnaGmina,
      wies: (wartosci.wies ?? "").trim() || domyslnaWies,
      podpis: (wartosci.podpis ?? "").trim() || domyslnySoltysNazwa,
    }),
    [wartosci, domyslnaGmina, domyslnaWies, domyslnySoltysNazwa],
  );

  const sugestieGrup = useMemo(() => {
    const p = znajdzPreset(presetId) ?? pierwszy;
    if (!p || presetyPoFiltze.length === 0) return [];
    return zbudujSugestieKontekstowe(p, wartosciDlaSugestii, {
      domyslnaWies,
      domyslnaGmina,
      domyslnySoltysNazwa,
    });
  }, [
    presetId,
    pierwszy,
    presetyPoFiltze,
    wartosciDlaSugestii,
    domyslnaWies,
    domyslnaGmina,
    domyslnySoltysNazwa,
  ]);

  if (!preset) {
    return <p className="text-sm text-stone-600">Brak presetów dokumentów.</p>;
  }

  const grupy = pogrupujPresety(presetyPoFiltze);
  const calkowita = PRESETY_DOKUMENTOW_SOLTYSA.length;
  const poFiltrze = presetyPoFiltze.length;

  return (
    <div className="space-y-8">
      <section className="no-print rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 via-white to-teal-50/50 p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="font-serif text-lg text-green-950">Scenariusze WOW (1 klik)</h2>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-stone-600">
              Szybkie uruchomienie najczęstszych pism dla sołtysa. Po kliknięciu generator wybiera dokument i
              uzupełnia przykładowe treści, które możesz od razu dopracować i wydrukować.
            </p>
          </div>
          <span className="rounded-full border border-emerald-300 bg-white px-2.5 py-1 text-[11px] font-medium text-emerald-900">
            Oszczędność czasu: start w kilkanaście sekund
          </span>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {scenariuszeWow.map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => uruchomScenariusz(sc)}
              className="rounded-xl border border-emerald-200 bg-white/95 p-3 text-left shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50/60 active:scale-[0.99]"
            >
              <p className="text-sm font-semibold text-green-950">{sc.tytul}</p>
              <p className="mt-1 text-xs leading-relaxed text-stone-600">{sc.opis}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="no-print rounded-2xl border border-violet-200/90 bg-gradient-to-br from-violet-50/90 via-white to-fuchsia-50/40 p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="font-serif text-lg text-green-950">Lejek sponsora (4 kroki)</h2>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-stone-600">
              Od pierwszej prośby do podziękowania — każdy krok otwiera gotowy dokument i uzupełnia pola. Zapisz PDF
              po każdym etapie, żeby mieć spójne archiwum korespondencji.
            </p>
          </div>
        </div>
        <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {lejekSponsora.map(({ krok, tytul, opis, scenariusz }) => {
            const aktywny = aktywnyKrokLejka === krok;
            return (
              <li key={krok} className="list-none">
                <button
                  type="button"
                  onClick={() => uruchomKrokLejka(krok, scenariusz)}
                  className={`flex h-full min-h-[88px] w-full flex-col rounded-xl border p-3 text-left text-sm transition hover:border-violet-400 hover:bg-violet-50/50 active:scale-[0.99] ${
                    aktywny
                      ? "border-violet-500 bg-violet-100/60 font-medium text-green-950 ring-2 ring-violet-300/60"
                      : "border-violet-200/80 bg-white/90 text-stone-800"
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-800/90">
                    Krok {krok} / 4
                  </span>
                  <span className="mt-1 font-serif text-[15px] text-green-950">{tytul}</span>
                  <span className="mt-1 text-xs leading-snug text-stone-600">{opis}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="no-print rounded-2xl border border-stone-200 bg-amber-50/40 p-4 text-sm leading-snug text-amber-950">
        Dokumenty są <strong>szablonami informacyjnymi</strong> — nie stanowią porady prawnej. Przed wysłaniem do
        urzędu lub banku dopasuj treść do przepisów i uchwał w Twojej gminie.{" "}
        <strong>Na telefonie</strong> użyj „Pobierz PDF” (zapis pliku); „Drukuj / PDF z systemu” otwiera menu
        drukowania przeglądarki — tam często jest „Zapisz jako PDF”.
      </div>

      <div className="no-print grid gap-6 pb-[max(1rem,env(safe-area-inset-bottom))] lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-8">
        <aside className="min-w-0 space-y-3 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100dvh-5rem)] lg:overflow-hidden lg:flex lg:flex-col">
          <h2 className="font-serif text-lg text-green-950">Wybierz dokument</h2>
          <label htmlFor="soltys-dok-szukaj" className="sr-only">
            Szukaj w szablonach dokumentów
          </label>
          <input
            id="soltys-dok-szukaj"
            type="search"
            value={filtrSzukaj}
            onChange={(e) => ustawFiltrSzukaj(e.target.value)}
            placeholder="Szukaj: zebranie, fundusz, świetlica…"
            autoComplete="off"
            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 shadow-sm outline-none ring-green-800/20 placeholder:text-stone-400 focus:border-green-700 focus:ring-2"
          />
          <p className="text-xs text-stone-500">
            {filtrSzukaj.trim() ? (
              <>
                Znaleziono <strong className="text-stone-800">{poFiltrze}</strong> z {calkowita} szablonów
                {poFiltrze === 0 ? " — wyczyść filtr lub zmień frazę." : "."}
              </>
            ) : (
              <>Dostępnych szablonów: {calkowita}. Wyszukiwanie ignoruje polskie znaki (ą → a).</>
            )}
          </p>
          <nav
            className="max-h-[min(50vh,28rem)] flex-1 space-y-5 overflow-y-auto overscroll-y-contain pr-1 text-sm [-webkit-overflow-scrolling:touch] lg:max-h-none lg:min-h-0"
            aria-label="Presety dokumentów"
          >
            {poFiltrze === 0 ? (
              <p className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
                Brak szablonów pasujących do „{filtrSzukaj.trim()}”.
              </p>
            ) : (
              grupy.map(([kat, items]) => (
                <div key={kat}>
                  <p className="mb-2 font-medium text-stone-800">{kat}</p>
                  <ul className="space-y-1 border-l-2 border-green-900/15 pl-3">
                    {items.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => zmienPreset(p.id)}
                          className={`min-h-[44px] w-full touch-manipulation rounded-md px-3 py-2.5 text-left text-[15px] leading-snug transition-colors hover:bg-stone-100 active:bg-stone-200 sm:min-h-0 sm:py-1.5 sm:text-sm ${
                            p.id === presetId ? "bg-green-900/10 font-medium text-green-950" : "text-stone-700"
                          }`}
                        >
                          {p.tytul}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </nav>
        </aside>

        <div className="min-w-0 space-y-4">
          {poFiltrze === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-6 text-sm text-amber-950">
              <p className="font-medium">Żaden szablon nie pasuje do wyszukiwania.</p>
              <p className="mt-2 text-stone-700">
                Wyczyść pole szukania albo wpisz inną frazę (np. „zebranie”, „fundusz”, „pelnomocnictwo”).
              </p>
            </div>
          ) : (
            <>
          <div>
            <h2 className="font-serif text-xl text-green-950">{preset.tytul}</h2>
            <p className="mt-1 text-sm text-stone-600">{preset.opis}</p>
            <p className="mt-2 font-mono text-[11px] text-stone-500">
              Nr ref. sesji: <span className="text-green-900">{numerReferencyjnySesji}</span>
            </p>
          </div>

          <div className="no-print rounded-xl border border-sky-200/80 bg-sky-50/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-900">Styl dokumentu</p>
            <p className="mt-1 text-xs text-stone-600">
              Zmień wygląd podglądu i PDF bez zmiany treści: urzędowy, elegancki lub nowoczesny.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {([
                { id: "urzedowy", label: "Urzędowy" },
                { id: "elegancki", label: "Elegancki" },
                { id: "nowoczesny", label: "Nowoczesny" },
              ] as { id: StylDokumentu; label: string }[]).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => ustawStylDokumentu(s.id)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    stylDokumentu === s.id
                      ? "border-sky-600 bg-sky-100 text-sky-950"
                      : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="no-print rounded-xl border border-fuchsia-200/80 bg-fuchsia-50/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-900">Wygląd wydruku i PDF</p>
            <p className="mt-1 text-xs text-stone-600">
              Dopracuj finalny wygląd pod prezentację dla gminy, sponsora lub zebrania.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium text-stone-700">Rozmiar tekstu:</span>
              {([
                { id: "standard", label: "Standard" },
                { id: "duzy", label: "Większy (czytelniejszy)" },
              ] as { id: RozmiarDokumentu; label: string }[]).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => ustawRozmiarDokumentu(r.id)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                    rozmiarDokumentu === r.id
                      ? "border-fuchsia-600 bg-fuchsia-100 text-fuchsia-950"
                      : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium text-stone-700">Znak wodny:</span>
              {([
                { id: "subtelny", label: "Subtelny" },
                { id: "brak", label: "Bez znaku" },
              ] as { id: ZnakWodnyDokumentu; label: string }[]).map((z) => (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => ustawZnakWodnyDokumentu(z.id)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                    znakWodnyDokumentu === z.id
                      ? "border-fuchsia-600 bg-fuchsia-100 text-fuchsia-950"
                      : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  {z.label}
                </button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium text-stone-700">Układ podpisów:</span>
              {([
                { id: "jeden", label: "1 podpis" },
                { id: "dwa", label: "2 podpisy" },
                { id: "trzy", label: "3 podpisy" },
              ] as { id: UkladPodpisowDokumentu; label: string }[]).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => ustawUkladPodpisow(u.id)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                    ukladPodpisow === u.id
                      ? "border-fuchsia-600 bg-fuchsia-100 text-fuchsia-950"
                      : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          <div className="no-print rounded-xl border border-amber-200/80 bg-amber-50/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">Dopasowanie języka</p>
            <p className="mt-1 text-xs text-stone-600">
              Kliknij pole tekstowe (np. uzasadnienie), a potem wybierz szybkie dopracowanie stylu.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => poprawBrzmieniePola("formalny")}
                className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-800 hover:bg-stone-50"
              >
                Bardziej formalnie
              </button>
              <button
                type="button"
                onClick={() => poprawBrzmieniePola("konkretny")}
                className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-800 hover:bg-stone-50"
              >
                Bardziej konkretnie
              </button>
              <button
                type="button"
                onClick={() => poprawBrzmieniePola("uprzejmy")}
                className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-800 hover:bg-stone-50"
              >
                Bardziej uprzejmie
              </button>
            </div>
            <p className="mt-2 text-[11px] text-stone-500">
              Aktywne pole:{" "}
              <span className="font-mono text-stone-700">{aktywnieEdytowanePole || "— kliknij najpierw pole"}</span>
            </p>
          </div>

          {sugestieGrup.length > 0 ? (
            <div
              className="no-print rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/95 via-white to-teal-50/40 p-4 shadow-sm"
              role="region"
              aria-label="Sugestie treści do dokumentu"
            >
              <h3 className="font-serif text-base text-green-950">Sugestie</h3>
              <p className="mt-1 text-xs leading-relaxed text-stone-600">
                Gotowe fragmenty wg typu dokumentu i pól (wies, gmina) — <strong>bez sztucznej inteligencji</strong>, reguły
                z naszawies.pl. Zawsze dopasuj treść do uchwał i BIP przed wysłaniem.
              </p>
              <div className="mt-3 space-y-4">
                {sugestieGrup.map((g) => (
                  <div key={g.grupa}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900/90">{g.grupa}</p>
                    {g.opis ? <p className="mt-0.5 text-[11px] text-stone-500">{g.opis}</p> : null}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {g.sugestie.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          title={`Wstaw do: ${s.poleDocelowe}`}
                          onClick={() =>
                            wstawDoPola(s.poleDocelowe, s.wartosc, Boolean(s.preferujDopisanie))
                          }
                          className="rounded-full border border-green-900/20 bg-white/90 px-2.5 py-1 text-left text-xs font-medium text-green-950 shadow-sm transition hover:border-green-800/40 hover:bg-emerald-50 active:scale-[0.98]"
                        >
                          {s.etykieta}
                          <span className="ml-1 font-normal text-stone-500">→ {s.poleDocelowe}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            {preset.pola.map((pole) => (
              <div key={pole.id}>
                <label className="block text-xs font-medium text-stone-600" htmlFor={`pole-${pole.id}`}>
                  {pole.etykieta}
                </label>
                {pole.typ === "textarea" ? (
                  <textarea
                    id={`pole-${pole.id}`}
                    value={wartosci[pole.id] ?? ""}
                    onChange={(e) => ustawWartosci((prev) => ({ ...prev, [pole.id]: e.target.value }))}
                    onFocus={() => ustawAktywnieEdytowanePole(pole.id)}
                    rows={pole.wiersze ?? 4}
                    placeholder={pole.placeholder}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-base sm:py-2 sm:text-sm"
                  />
                ) : (
                  <input
                    id={`pole-${pole.id}`}
                    type={pole.typ === "date" ? "date" : "text"}
                    value={wartosci[pole.id] ?? ""}
                    onChange={(e) => ustawWartosci((prev) => ({ ...prev, [pole.id]: e.target.value }))}
                    onFocus={() => ustawAktywnieEdytowanePole(pole.id)}
                    placeholder={pole.placeholder}
                    className="mt-1 w-full min-h-[48px] rounded-lg border border-stone-300 px-3 py-2.5 text-base sm:min-h-0 sm:py-2 sm:text-sm"
                  />
                )}
                {pole.podpowiedz ? (
                  <p className="mt-0.5 text-[11px] text-stone-500">{pole.podpowiedz}</p>
                ) : null}
                {pole.szybkieWstawki && pole.szybkieWstawki.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5" aria-label={`Szybkie wstawki: ${pole.etykieta}`}>
                    {pole.szybkieWstawki.map((sw) => {
                      const cur = (wartosci[pole.id] ?? "").trim();
                      const dopisz = pole.typ === "textarea" && cur.length > 0;
                      return (
                        <button
                          key={`${pole.id}-${sw.etykieta}`}
                          type="button"
                          onClick={() => wstawDoPola(pole.id, sw.wartosc, dopisz)}
                          className="rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-[11px] font-medium text-stone-800 transition hover:border-green-800/30 hover:bg-emerald-50/80 active:scale-[0.98]"
                        >
                          {sw.etykieta}
                          {dopisz ? (
                            <span className="ml-1 font-normal text-stone-500">(dopisz)</span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="no-print flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch">
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-start">
              <PrzyciskPobierzPdf
                elementId="soltys-generator-dokument-html"
                nazwaPliku={nazwaPlikuPdf}
                className="sm:shrink-0"
              />
              <button
                type="button"
                onClick={() => window.print()}
                className="min-h-[48px] w-full touch-manipulation rounded-lg border-2 border-green-900/35 bg-white px-4 py-3 text-base font-medium text-green-950 shadow-sm transition hover:bg-green-50 sm:w-auto sm:min-h-[44px] sm:py-2.5 sm:text-sm"
              >
                Drukuj / PDF z systemu
              </button>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
              {(domyslnaWies || domyslnaGmina || domyslnySoltysNazwa) && (
                <button
                  type="button"
                  onClick={() =>
                    ustawWartosci((prev) => uzupelnijDomyslnePresetu(preset, prev, opcjeDomyslne))
                  }
                  className="min-h-[44px] w-full touch-manipulation rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-800 transition hover:bg-stone-50 sm:w-auto sm:text-sm"
                >
                  Wypełnij puste pola z panelu
                </button>
              )}
              <button
                type="button"
                onClick={wyczyscPolaPresetu}
                className="min-h-[44px] w-full touch-manipulation rounded-lg border border-stone-300 bg-stone-50 px-3 py-2.5 text-base text-stone-800 transition hover:bg-stone-100 sm:w-auto sm:text-sm"
              >
                Wyczyść pola tego dokumentu
              </button>
              <button
                type="button"
                onClick={() => ustawNumerReferencyjnySesji(wygenerujNumerReferencyjnySoltys())}
                className="min-h-[44px] w-full touch-manipulation rounded-lg border border-green-800/25 bg-green-50 px-3 py-2.5 text-base font-medium text-green-950 transition hover:bg-green-100 sm:w-auto sm:text-sm"
              >
                Nowy numer referencyjny
              </button>
            </div>
            <p className="text-sm leading-snug text-stone-500 sm:flex-1 sm:text-xs">
              Podgląd poniżej — przy druku ukrywane są formularz i menu panelu. Numer ref. w PDF i podglądzie
              aktualizuje się po „Nowy numer…” lub odświeżeniu strony (nowa sesja).
            </p>
          </div>
            </>
          )}
        </div>
      </div>

      <section className="rounded-2xl border border-stone-200/90 bg-gradient-to-b from-white via-stone-50/40 to-stone-100/30 p-3 shadow-[0_12px_40px_-24px_rgba(20,83,45,0.18)] sm:p-5 print:border-0 print:bg-white print:p-0 print:shadow-none">
        <p className="no-print mb-2 flex items-center gap-2 text-xs font-medium text-stone-600 sm:mb-3">
          <span
            className="inline-flex h-2 w-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.25)]"
            aria-hidden
          />
          Podgląd / wydruk
        </p>
        {poFiltrze === 0 ? (
          <p className="text-sm text-stone-500">Wybierz szablon z listy po lewej — podgląd pojawi się tutaj.</p>
        ) : (
          <div className="overflow-x-auto [-webkit-overflow-scrolling:touch] rounded-lg border border-stone-200/80 bg-white print:overflow-visible print:border-0">
            {/*
              PDF: html2canvas + element z overflow:auto często daje pustą stronę — id tylko na wewnętrznym bloku.
            */}
            <div
              id="soltys-generator-dokument-html"
              className="min-w-0 px-2 py-3 sm:px-4 sm:py-5 print:p-0"
              dangerouslySetInnerHTML={{ __html: htmlPodglad }}
            />
          </div>
        )}
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media print {
            .no-print { display: none !important; }
            body { background: #fff !important; }
            #soltys-generator-dokument-html { box-shadow: none !important; }
          }
        `,
        }}
      />
    </div>
  );
}
