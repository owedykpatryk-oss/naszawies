"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  PodgladSzablonuGrafiki,
} from "@/components/grafika/podglad-szablonu-grafiki";

const EdytorFabricKlient = dynamic(
  () => import("@/components/grafika/edytor-fabric-klient").then((m) => ({ default: m.EdytorFabricKlient })),
  { ssr: false, loading: () => <p className="text-sm text-stone-500">Ładowanie edytora…</p> },
);

const MasowyDrukDyplomowKlient = dynamic(
  () =>
    import("@/components/grafika/masowy-druk-dyplomow-klient").then((m) => ({
      default: m.MasowyDrukDyplomowKlient,
    })),
  { ssr: false, loading: () => <p className="text-sm text-stone-500">Ładowanie druku…</p> },
);
import { PrzewodnikKreatoraGrafiki } from "@/components/grafika/przewodnik-kreatora-grafiki";
import { NawigacjaZakladekKreatora } from "@/components/grafika/nawigacja-zakladek-kreatora";
import { SelektorTrybuGrafiki } from "@/components/grafika/selektor-trybu-grafiki";
import { ZakladkaSzablonGrafiki } from "@/components/grafika/zakladka-szablon-grafiki";
import { ZakladkaEdycjaGrafiki } from "@/components/grafika/zakladka-edycja-grafiki";
import { ZakladkaEksportGrafiki } from "@/components/grafika/zakladka-eksport-grafiki";
import { ZachetaKontaGrafiki } from "@/components/grafika/zacheta-konta-grafiki";
import { znajdzMotyw } from "@/lib/grafika/motywy";
import type { PrefillRezerwacji } from "@/lib/grafika/prefill-rezerwacja";
import { domyslnyUrlQrWies } from "@/lib/grafika/qr-kod";
import type { TrybPracyGrafiki, ZakladkaKreatora } from "@/lib/grafika/kreator-zakladki";
import {
  SZABLONY_GRAFIKI,
  domyslneWartosciPol,
  filtrujSzablonyDlaRoli,
  znajdzSzablon,
} from "@/lib/grafika/szablony";
import type { KontekstGrafiki, ProfilWsiGrafiki, ProjektGrafiki, SzablonSpolecznosciGrafiki } from "@/lib/grafika/typy";
import {
  opublikujPlakatNaProfilWsi,
  pobierzLogoWsiJakoDataUrl,
  usunProjektGrafiki,
  wczytajProjektyGrafiki,
  zapiszProjektGrafiki,
} from "@/app/(site)/panel/grafika/akcje";
import { zapiszOstatniSzablon } from "@/lib/grafika/ostatnie-szablony";
import { wczytajLogoMarkiJakoDataUrl } from "@/lib/grafika/logo-marki";
import { uzupelnijWartosciDatamiSezonowymi } from "@/lib/grafika/daty-sezonowe";
import { DOMYSLNY_BACKGROUND_OVERLAY, normalizujBackgroundOverlay } from "@/lib/grafika/meta-tla-grafiki";
import { szablonPasujeDoTematu, type FiltrTematuGrafiki } from "@/lib/grafika/filtr-tematu";
import { wartosciPolZParametrowUrl } from "@/lib/grafika/link-grafika";
import { gotowyDoEksportu, walidujPrzedEksportem } from "@/lib/grafika/walidacja-pol-grafiki";

const ID_PODGLADU = "podglad-grafiki-export";
const KLUCZ_LOCAL_STORAGE = "naszawies-grafika-szkic";

type Props = {
  kontekst: KontekstGrafiki;
  villageId?: string | null;
  trybSoltys?: boolean;
  trybKgw?: boolean;
  trybOsp?: boolean;
  zapisDoBazy?: boolean;
  /** Publiczna wersja demo — mocniejsze CTA rejestracji */
  trybPubliczny?: boolean;
  nextPoRejestracji?: string;
  prefill?: PrefillRezerwacji | null;
  sciezkaWsi?: string;
  profilWsi?: ProfilWsiGrafiki | null;
};

function znormalizujDoSzukania(tekst: string): string {
  return tekst
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function KreatorGrafikiKlient({
  kontekst,
  villageId = null,
  trybSoltys = false,
  trybKgw = false,
  trybOsp = false,
  zapisDoBazy = false,
  trybPubliczny = false,
  nextPoRejestracji = "/panel/mieszkaniec/grafika",
  prefill = null,
  sciezkaWsi = "",
  profilWsi = null,
}: Props) {
  const searchParams = useSearchParams();
  const dostepneSzablony = useMemo(
    () => filtrujSzablonyDlaRoli(SZABLONY_GRAFIKI, { trybSoltys, trybKgw, trybOsp }),
    [trybSoltys, trybKgw, trybOsp],
  );

  const pierwszy = dostepneSzablony[0];
  const [tryb, ustawTryb] = useState<TrybPracyGrafiki>("zaproszenie");
  const [zakladka, ustawZakladke] = useState<ZakladkaKreatora>("szablon");
  const [szablonId, ustawSzablonId] = useState(pierwszy?.id ?? "");
  const [podgladSzablonId, ustawPodgladSzablonId] = useState(pierwszy?.id ?? "");
  const [motywId, ustawMotywId] = useState(pierwszy?.domyslnyMotyw ?? "zielony-wies");
  const [wartosci, ustawWartosci] = useState<Record<string, string>>(() =>
    pierwszy ? domyslneWartosciPol(pierwszy, kontekst) : {},
  );
  const [logoDataUrl, ustawLogoDataUrl] = useState<string | null>(null);
  const [backgroundDataUrl, ustawBackgroundDataUrl] = useState<string | null>(null);
  const [backgroundOverlay, ustawBackgroundOverlay] = useState(DOMYSLNY_BACKGROUND_OVERLAY);
  const [canvasJson, ustawCanvasJson] = useState<Record<string, unknown> | null>(null);
  const [qrUrl, ustawQrUrl] = useState(() => (sciezkaWsi ? domyslnyUrlQrWies(sciezkaWsi) : ""));
  const [bookingId, ustawBookingId] = useState<string | null>(prefill?.bookingId ?? null);
  const [ostatniZapisId, ustawOstatniZapisId] = useState<string | null>(null);
  const [filtr, ustawFiltr] = useState("");
  const [kategoria, ustawKategorie] = useState<string>("wszystkie");
  const [filtrTemat, ustawFiltrTemat] = useState<FiltrTematuGrafiki>("wszystkie");
  const [tytulProjektu, ustawTytulProjektu] = useState("");
  const [projekty, ustawProjekty] = useState<ProjektGrafiki[]>([]);
  const [komunikat, ustawKomunikat] = useState<string | null>(null);
  const [blad, ustawBlad] = useState<string | null>(null);
  const [oczekuje, startTransition] = useTransition();
  const [kluczOdswiezeniaSzablonow, ustawKluczOdswiezeniaSzablonow] = useState(0);

  const szablon = znajdzSzablon(szablonId) ?? pierwszy;
  const motyw = znajdzMotyw(motywId);
  const szablonPodgladu = znajdzSzablon(zakladka === "szablon" ? podgladSzablonId || szablonId : szablonId) ?? szablon;
  const motywPodgladu =
    zakladka === "szablon"
      ? znajdzMotyw(znajdzSzablon(podgladSzablonId || szablonId)?.domyslnyMotyw ?? motywId)
      : motyw;
  const wartosciPodgladu = useMemo(() => {
    if (zakladka === "szablon") {
      return domyslneWartosciPol(szablonPodgladu, kontekst);
    }
    return wartosci;
  }, [zakladka, szablonPodgladu, kontekst, wartosci]);

  const przefiltrowane = useMemo(() => {
    const f = znormalizujDoSzukania(filtr);
    return dostepneSzablony.filter((s) => {
      if (kategoria !== "wszystkie" && s.kategoria !== kategoria) return false;
      if (!szablonPasujeDoTematu(s, filtrTemat)) return false;
      if (!f) return true;
      const paczka = [s.tytul, s.opis, s.kategoria, ...(s.tagi ?? [])].join(" ");
      return znormalizujDoSzukania(paczka).includes(f);
    });
  }, [dostepneSzablony, filtr, kategoria, filtrTemat]);

  const ukonczoneZakladki = useMemo(
    (): Partial<Record<ZakladkaKreatora, boolean>> => ({
      szablon: Boolean(szablonId),
      edycja: Object.values(wartosci).some((v) => v?.trim()),
      eksport: szablon ? gotowyDoEksportu(szablon, wartosci) : false,
    }),
    [szablonId, wartosci, szablon],
  );

  const aktualnyProjekt = useMemo(
    () => (ostatniZapisId ? projekty.find((p) => p.id === ostatniZapisId) : undefined),
    [ostatniZapisId, projekty],
  );

  const wczytajProjekty = useCallback(async () => {
    if (zapisDoBazy) {
      const r = await wczytajProjektyGrafiki(villageId ?? undefined);
      if ("projekty" in r) ustawProjekty(r.projekty);
    } else {
      try {
        const raw = localStorage.getItem(KLUCZ_LOCAL_STORAGE);
        if (raw) ustawProjekty(JSON.parse(raw) as ProjektGrafiki[]);
      } catch {
        /* ignore */
      }
    }
  }, [zapisDoBazy, villageId]);

  useEffect(() => {
    void wczytajProjekty();
  }, [wczytajProjekty]);

  useEffect(() => {
    let anuluj = false;
    void wczytajLogoMarkiJakoDataUrl()
      .then((url) => {
        if (!anuluj) ustawLogoDataUrl((prev) => prev ?? url);
      })
      .catch(() => {
        /* logo marki opcjonalne — podgląd ma fallback z /marka/ */
      });
    return () => {
      anuluj = true;
    };
  }, []);

  useEffect(() => {
    if (!prefill) return;
    ustawTryb("zaproszenie");
    ustawZakladke("edycja");
    ustawSzablonId(prefill.szablonId);
    ustawWartosci(prefill.wartosci);
    ustawTytulProjektu(prefill.tytulProjektu);
    if (prefill.bookingId) ustawBookingId(prefill.bookingId);
    ustawKomunikat("Dane z rezerwacji świetlicy wczytane — sprawdź treść w kroku 2.");
  }, [prefill]);

  useEffect(() => {
    const szablonUrl = searchParams.get("szablon")?.trim();
    const trybUrl = searchParams.get("tryb")?.trim();
    const motywUrl = searchParams.get("motyw")?.trim();
    const tytulUrl = searchParams.get("tytulProjektu")?.trim();
    if (trybUrl === "dyplomy") ustawTryb("dyplomy");
    if (trybUrl === "edytor") ustawTryb("edytor");
    if (szablonUrl && znajdzSzablon(szablonUrl)) {
      const s = znajdzSzablon(szablonUrl)!;
      if (trybUrl !== "dyplomy" && trybUrl !== "edytor") ustawTryb("zaproszenie");
      ustawSzablonId(szablonUrl);
      ustawPodgladSzablonId(szablonUrl);
      ustawMotywId(motywUrl && znajdzMotyw(motywUrl) ? motywUrl : s.domyslnyMotyw);
      const bazowe = domyslneWartosciPol(s, kontekst);
      const zUrl = wartosciPolZParametrowUrl(
        searchParams,
        s.pola.map((p) => p.id),
      );
      ustawWartosci({ ...bazowe, ...zUrl });
      ustawTytulProjektu(tytulUrl || s.tytul);
      ustawZakladke("edycja");
      ustawKomunikat(
        Object.keys(zUrl).length > 0
          ? "Szablon i treść wczytane z linku — sprawdź pola i pobierz PDF."
          : "Szablon wczytany z linku — sprawdź treść i pobierz PDF.",
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- jednorazowe wczytanie z URL
  }, []);

  const przejdzDoEksportu = () => {
    if (!szablon) return;
    const bledy = walidujPrzedEksportem(szablon, wartosci);
    if (bledy.length > 0) {
      ustawBlad(`Uzupełnij przed eksportem: ${bledy.join(", ")}.`);
      return;
    }
    ustawBlad(null);
    ustawZakladke("eksport");
  };

  const wybierzPaczkeWow = (w: {
    szablonId: string;
    motywId: string;
    wartosci: Record<string, string>;
    tytulProjektu: string;
    komunikat: string;
  }) => {
    ustawSzablonId(w.szablonId);
    ustawPodgladSzablonId(w.szablonId);
    ustawMotywId(w.motywId);
    const sz = znajdzSzablon(w.szablonId);
    const wartosciZData = sz
      ? uzupelnijWartosciDatamiSezonowymi(w.wartosci, sz.id, sz.tagi ?? [])
      : w.wartosci;
    ustawWartosci(wartosciZData);
    ustawTytulProjektu(w.tytulProjektu);
    ustawKomunikat(w.komunikat);
    ustawBlad(null);
    ustawZakladke("edycja");
    zapiszOstatniSzablon({ szablonId: w.szablonId, motywId: w.motywId, tytul: w.tytulProjektu });
  };

  const wybierzSzablon = (id: string) => {
    const s = znajdzSzablon(id);
    if (!s) return;
    ustawSzablonId(id);
    ustawPodgladSzablonId(id);
    ustawMotywId(s.domyslnyMotyw);
    const bazowe = domyslneWartosciPol(s, kontekst);
    ustawWartosci(uzupelnijWartosciDatamiSezonowymi(bazowe, s.id, s.tagi ?? []));
    ustawTytulProjektu(s.tytul);
    ustawKomunikat(null);
    ustawBlad(null);
    ustawZakladke("edycja");
    zapiszOstatniSzablon({ szablonId: id, motywId: s.domyslnyMotyw, tytul: s.tytul });
  };

  const ustawPole = (id: string, wartosc: string) => {
    ustawWartosci((prev) => ({ ...prev, [id]: wartosc }));
  };

  const wstawDaneZProfilu = () => {
    const tel = profilWsi?.telefon?.trim() || kontekst.telefon?.trim();
    const mail = profilWsi?.email?.trim() || kontekst.email?.trim();
    const kontakt = [tel ? `tel. ${tel}` : "", mail].filter(Boolean).join(" · ");

    ustawWartosci((prev) => ({
      ...prev,
      ...(kontakt && !prev.kontakt?.trim() ? { kontakt } : {}),
      ...(kontakt && prev.kontakt?.includes("tel. …") ? { kontakt } : {}),
      ...(kontekst.organizator && !prev.organizator?.trim() ? { organizator: kontekst.organizator } : {}),
    }));

    if (profilWsi?.zdjecieTloUrl && !backgroundDataUrl) {
      ustawBackgroundDataUrl(profilWsi.zdjecieTloUrl);
    }

    ustawKomunikat("Dane z profilu wsi wstawione — sprawdź kontakt i tło.");
    ustawBlad(null);
  };

  const wstawLogoZProfilu = () => {
    if (!villageId) {
      ustawBlad("Logo z profilu wymaga przypisania do wsi (panel sołtysa).");
      return;
    }
    startTransition(async () => {
      const r = await pobierzLogoWsiJakoDataUrl(villageId);
      if ("blad" in r) {
        ustawBlad(r.blad);
        return;
      }
      ustawLogoDataUrl(r.dataUrl);
      ustawKomunikat("Logo (okładka wsi) wczytane z profilu.");
      ustawBlad(null);
    });
  };

  const wstawTloZProfilu = () => {
    if (!villageId) {
      ustawBlad("Tło z profilu wymaga przypisania do wsi (panel sołtysa).");
      return;
    }
    startTransition(async () => {
      const r = await pobierzLogoWsiJakoDataUrl(villageId);
      if ("blad" in r) {
        ustawBlad(r.blad);
        return;
      }
      ustawBackgroundDataUrl(r.dataUrl);
      ustawKomunikat("Okładka wsi ustawiona jako tło — reguluj widoczność suwakiem.");
      ustawBlad(null);
    });
  };

  const uzyjSzablonuSpolecznosci = (s: SzablonSpolecznosciGrafiki) => {
    const sz = znajdzSzablon(s.templateId);
    if (!sz) {
      ustawBlad("Szablon społecznościowy nie jest już dostępny w bibliotece.");
      return;
    }
    ustawSzablonId(s.templateId);
    ustawPodgladSzablonId(s.templateId);
    ustawMotywId(s.motywId);
    ustawWartosci(s.wartosci);
    ustawTytulProjektu(s.tytul);
    ustawLogoDataUrl(s.logoDataUrl ?? null);
    ustawBackgroundDataUrl(s.backgroundDataUrl ?? null);
    ustawBackgroundOverlay(normalizujBackgroundOverlay(s.backgroundOverlay));
    ustawQrUrl(s.qrUrl ?? "");
    ustawZakladke("edycja");
    ustawKomunikat(`Wczytano publiczny szablon „${s.tytul}” — dostosuj treść i pobierz PDF.`);
    ustawBlad(null);
  };

  const wstawPodpisCyfrowy = () => {
    const imie = kontekst.organizator?.replace(/^Sołtys\s+/i, "").trim();
    if (!imie) {
      ustawBlad("Brak nazwiska sołtysa w profilu — wpisz podpis ręcznie.");
      return;
    }
    ustawWartosci((prev) => ({ ...prev, podpis_cyfrowy: imie }));
    ustawKomunikat("Podpis elektroniczny wstawiony — sprawdź w podglądzie.");
  };

  const maDateWydarzenia = Boolean(wartosci.data?.trim());
  const toDyplom = szablon.kategoria === "dyplomy";

  const ustawDateSezonowa = () => {
    const next = uzupelnijWartosciDatamiSezonowymi(wartosci, szablon.id, szablon.tagi ?? []);
    ustawWartosci(next);
    ustawKomunikat(
      next.data ? `Ustawiono datę sezonową: ${next.data}${next.godzina ? `, godz. ${next.godzina}` : ""}.` : "Brak sugerowanej daty dla tego szablonu.",
    );
  };

  const duplikujSzkic = () => {
    if (!szablon) return;
    const kopia: ProjektGrafiki = {
      id: crypto.randomUUID(),
      templateId: szablon.id,
      tytul: `${(tytulProjektu.trim() || szablon.tytul).slice(0, 80)} (kopia)`,
      motywId,
      wartosci: { ...wartosci },
      logoDataUrl,
      backgroundDataUrl,
      backgroundOverlay,
      canvasJson,
      qrUrl,
      villageId,
      bookingId,
      updatedAt: new Date().toISOString(),
    };
    const next = [kopia, ...projekty].slice(0, 20);
    if (!zapisDoBazy) {
      localStorage.setItem(KLUCZ_LOCAL_STORAGE, JSON.stringify(next));
    }
    ustawProjekty(next);
    ustawKomunikat(`Duplikat zapisany: „${kopia.tytul}”. Wczytaj go z listy projektów.`);
  };

  const onObraz = (e: React.ChangeEvent<HTMLInputElement>, ustaw: (v: string | null) => void) => {
    const plik = e.target.files?.[0];
    if (!plik) return;
    if (plik.size > 2 * 1024 * 1024) {
      ustawBlad("Obraz może mieć maks. 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => ustaw(reader.result as string);
    reader.readAsDataURL(plik);
  };

  const zapiszSzkic = () => {
    if (!szablon) return;
    const projekt: ProjektGrafiki = {
      id: ostatniZapisId ?? crypto.randomUUID(),
      templateId: szablon.id,
      tytul: tytulProjektu.trim() || szablon.tytul,
      motywId,
      wartosci,
      logoDataUrl,
      backgroundDataUrl,
      backgroundOverlay,
      canvasJson,
      qrUrl,
      villageId,
      bookingId,
      updatedAt: new Date().toISOString(),
    };

    startTransition(async () => {
      if (zapisDoBazy) {
        const r = await zapiszProjektGrafiki({
          id: projekt.id,
          villageId,
          templateId: projekt.templateId,
          tytul: projekt.tytul,
          motywId: projekt.motywId,
          wartosci: projekt.wartosci,
          logoDataUrl: projekt.logoDataUrl,
          backgroundDataUrl: projekt.backgroundDataUrl,
          backgroundOverlay: projekt.backgroundOverlay,
          canvasJson: projekt.canvasJson,
          qrUrl: projekt.qrUrl,
          bookingId: projekt.bookingId,
        });
        if ("blad" in r) {
          ustawBlad(r.blad);
          return;
        }
        if (r.id) ustawOstatniZapisId(r.id);
        ustawKomunikat("Projekt zapisany.");
        await wczytajProjekty();
      } else {
        const next = [projekt, ...projekty.filter((p) => p.id !== projekt.id)].slice(0, 20);
        localStorage.setItem(KLUCZ_LOCAL_STORAGE, JSON.stringify(next));
        ustawProjekty(next);
        ustawKomunikat("Szkic zapisany w tej przeglądarce.");
      }
      ustawBlad(null);
    });
  };

  const wczytajProjekt = (p: ProjektGrafiki) => {
    ustawTryb("zaproszenie");
    ustawZakladke("edycja");
    ustawSzablonId(p.templateId);
    ustawMotywId(p.motywId);
    ustawWartosci(p.wartosci);
    ustawLogoDataUrl(p.logoDataUrl ?? null);
    ustawBackgroundDataUrl(p.backgroundDataUrl ?? null);
    ustawBackgroundOverlay(normalizujBackgroundOverlay(p.backgroundOverlay));
    ustawCanvasJson(p.canvasJson ?? null);
    ustawQrUrl(p.qrUrl ?? "");
    ustawOstatniZapisId(p.id);
    ustawTytulProjektu(p.tytul);
    ustawKomunikat(`Wczytano: ${p.tytul}`);
  };

  const opublikuj = () => {
    if (!ostatniZapisId) {
      ustawBlad("Najpierw kliknij „Zapisz projekt”, potem opublikuj.");
      return;
    }
    startTransition(async () => {
      const r = await opublikujPlakatNaProfilWsi(ostatniZapisId);
      if ("blad" in r) {
        ustawBlad(r.blad);
        return;
      }
      ustawKomunikat("Plakat jest na publicznym profilu wsi.");
      ustawBlad(null);
    });
  };

  const usunProjekt = (id: string) => {
    startTransition(async () => {
      if (zapisDoBazy) {
        const r = await usunProjektGrafiki(id);
        if ("blad" in r) {
          ustawBlad(r.blad);
          return;
        }
      } else {
        const next = projekty.filter((p) => p.id !== id);
        localStorage.setItem(KLUCZ_LOCAL_STORAGE, JSON.stringify(next));
        ustawProjekty(next);
      }
      await wczytajProjekty();
    });
  };

  if (!szablon) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        Brak dostępnych szablonów dla Twojej roli.
      </p>
    );
  }

  const nazwaPliku = `${tytulProjektu || szablon.tytul}-${kontekst.wies || "projekt"}`;

  const zmienTryb = (t: TrybPracyGrafiki) => {
    ustawTryb(t);
    if (t === "zaproszenie") ustawZakladke("szablon");
  };

  const maProfil = Boolean(profilWsi || kontekst.telefon || kontekst.email);

  return (
    <div className="space-y-6">
      {trybPubliczny ? (
        <ZachetaKontaGrafiki
          liczbaSzablonow={dostepneSzablony.length}
          nextSciezka={nextPoRejestracji}
          wariant="baner"
        />
      ) : null}

      <PrzewodnikKreatoraGrafiki
        trybSoltys={trybSoltys}
        zapisDoBazy={zapisDoBazy}
        aktywnaZakladka={tryb === "zaproszenie" ? zakladka : undefined}
        tryb={tryb}
      />

      <SelektorTrybuGrafiki tryb={tryb} onZmiana={zmienTryb} />

      {tryb === "dyplomy" ? (
        <MasowyDrukDyplomowKlient
          kontekst={kontekst}
          szablonId={szablonId}
          motywId={motywId}
          szablonyDyplomow={dostepneSzablony.filter((s) => s.kategoria === "dyplomy")}
        />
      ) : null}

      {tryb === "edytor" ? (
        <div className="space-y-4">
          <p className="no-print rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            To tryb opcjonalny. Jeśli wystarczy Ci gotowy szablon, wróć do „Zaproszenie lub plakat” — będzie szybciej.
          </p>
          <EdytorFabricKlient
            tloKolor={motyw.tlo}
            tloObraz={backgroundDataUrl}
            canvasJson={canvasJson}
            onCanvasChange={ustawCanvasJson}
          />
        </div>
      ) : null}

      {tryb === "zaproszenie" ? (
        <>
          <NawigacjaZakladekKreatora
            aktywna={zakladka}
            onZmiana={ustawZakladke}
            ukonczone={ukonczoneZakladki}
          />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="no-print space-y-4">
              {zakladka === "szablon" ? (
                <ZakladkaSzablonGrafiki
                  kontekst={kontekst}
                  szablonId={szablonId}
                  szablony={przefiltrowane}
                  kategoria={kategoria}
                  filtr={filtr}
                  filtrTemat={filtrTemat}
                  liczbaWszystkich={dostepneSzablony.length}
                  onKategoria={ustawKategorie}
                  onFiltr={ustawFiltr}
                  onFiltrTemat={ustawFiltrTemat}
                  onWyborSzablon={wybierzSzablon}
                  onPodgladSzablon={(id) => ustawPodgladSzablonId(id)}
                  onWyborPaczkiWow={wybierzPaczkeWow}
                  onUzyjSzablonSpolecznosci={uzyjSzablonuSpolecznosci}
                  odswiezKluczSzablonow={kluczOdswiezeniaSzablonow}
                  onDalej={() => ustawZakladke("edycja")}
                />
              ) : null}

              {zakladka === "edycja" ? (
                <ZakladkaEdycjaGrafiki
                  szablon={szablon}
                  motyw={motyw}
                  motywId={motywId}
                  wartosci={wartosci}
                  tytulProjektu={tytulProjektu}
                  logoDataUrl={logoDataUrl}
                  backgroundDataUrl={backgroundDataUrl}
                  backgroundOverlay={backgroundOverlay}
                  qrUrl={qrUrl}
                  sciezkaWsi={sciezkaWsi}
                  profilWsi={profilWsi}
                  toDyplom={toDyplom}
                  trybSoltys={trybSoltys}
                  villageId={villageId}
                  oczekuje={oczekuje}
                  maProfil={maProfil}
                  wszystkieSzablony={dostepneSzablony}
                  kontekst={kontekst}
                  onPole={ustawPole}
                  onTytulProjektu={ustawTytulProjektu}
                  onMotyw={ustawMotywId}
                  onLogo={(e) => onObraz(e, ustawLogoDataUrl)}
                  onTlo={(e) => onObraz(e, ustawBackgroundDataUrl)}
                  onUsunLogo={() => ustawLogoDataUrl(null)}
                  onUsunTlo={() => ustawBackgroundDataUrl(null)}
                  onTloZProfilu={wstawTloZProfilu}
                  onBackgroundOverlay={ustawBackgroundOverlay}
                  onQr={ustawQrUrl}
                  onWstawProfil={wstawDaneZProfilu}
                  onPodpisCyfrowy={wstawPodpisCyfrowy}
                  onLogoZProfilu={wstawLogoZProfilu}
                  onUstawDateSezonowa={ustawDateSezonowa}
                  onWyborSzablon={wybierzSzablon}
                  onWstecz={() => ustawZakladke("szablon")}
                  onDalej={przejdzDoEksportu}
                />
              ) : null}

              {zakladka === "eksport" ? (
                <ZakladkaEksportGrafiki
                  elementId={ID_PODGLADU}
                  nazwaPliku={nazwaPliku}
                  szablon={szablon}
                  motyw={motyw}
                  motywId={motywId}
                  trybKreatora={tryb}
                  wartosci={wartosci}
                  logoDataUrl={logoDataUrl}
                  backgroundDataUrl={backgroundDataUrl}
                  backgroundOverlay={backgroundOverlay}
                  qrUrl={qrUrl}
                  villageId={villageId}
                  nazwaWsi={kontekst.wies ?? ""}
                  projekty={projekty}
                  ostatniZapisId={ostatniZapisId}
                  maDateWydarzenia={maDateWydarzenia}
                  trybSoltys={trybSoltys}
                  zapisDoBazy={zapisDoBazy}
                  trybPubliczny={trybPubliczny}
                  oczekuje={oczekuje}
                  liczbaSzablonow={dostepneSzablony.length}
                  nextSciezka={nextPoRejestracji}
                  onZapisz={zapiszSzkic}
                  onOpublikuj={opublikuj}
                  onWczytaj={wczytajProjekt}
                  onUsun={usunProjekt}
                  onResetTresci={() => {
                    const s = znajdzSzablon(szablonId);
                    if (s) ustawWartosci(domyslneWartosciPol(s, kontekst));
                  }}
                  onKomunikat={ustawKomunikat}
                  onBlad={ustawBlad}
                  onDuplikuj={duplikujSzkic}
                  onWstecz={() => ustawZakladke("edycja")}
                  linkedPostId={aktualnyProjekt?.linkedPostId}
                  linkedEventId={aktualnyProjekt?.linkedEventId}
                  featuredOnDigitalBoard={aktualnyProjekt?.featuredOnDigitalBoard}
                  onOdswiezProjekty={() => void wczytajProjekty()}
                  onOdswiezSzablonySpolecznosci={() =>
                    ustawKluczOdswiezeniaSzablonow((k) => k + 1)
                  }
                  tytulProjektu={tytulProjektu}
                />
              ) : null}

              {komunikat ? <p className="text-sm text-green-800">{komunikat}</p> : null}
              {blad ? <p className="text-sm text-red-700">{blad}</p> : null}
            </div>

            {tryb === "zaproszenie" ? (
              <section className="lg:sticky lg:top-24 lg:self-start">
                <p className="no-print mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  <span className="kreator-podglad-puls inline-block h-2 w-2 rounded-full bg-green-600" aria-hidden />
                  Podgląd na żywo
                  {zakladka === "szablon" ? (
                    <span className="normal-case font-normal text-stone-400">— najedź na szablon</span>
                  ) : null}
                </p>
                <div className="kreator-podglad-ramka overflow-x-auto rounded-2xl border border-stone-200 bg-stone-100/80 p-3 sm:p-4">
                  <PodgladSzablonuGrafiki
                    szablon={szablonPodgladu}
                    motyw={motywPodgladu}
                    wartosci={wartosciPodgladu}
                    logoDataUrl={logoDataUrl}
                    backgroundDataUrl={zakladka === "szablon" ? null : backgroundDataUrl}
                    backgroundOverlay={zakladka === "szablon" ? undefined : backgroundOverlay}
                    qrDataUrl={zakladka === "eksport" ? qrUrl : null}
                    elementId={ID_PODGLADU}
                  />
                </div>
                <p className="no-print mt-2 text-[11px] text-stone-500">
                  {szablonPodgladu.format.toUpperCase()} · {szablonPodgladu.orientacja === "pion" ? "pion" : "poziom"}
                  {szablonPodgladu.layout.includes("dyplom") ? " · układ premium" : ""}
                </p>
              </section>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
