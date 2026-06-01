import Link from "next/link";
import type { ProfilSzkolyJson } from "@/lib/wies/profil-organizacji";

export type DaneSzkolyPubliczne = {
  id: string;
  name: string;
  short_description: string | null;
  meeting_place: string | null;
  schedule_text: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  profil: ProfilSzkolyJson | null;
};

function linkZTekstu(url: string | null | undefined): string | null {
  const www = url?.trim();
  if (!www) return null;
  return /^https?:\/\//i.test(www) ? www : `https://${www.replace(/^\/\//, "")}`;
}

function Blok({ tytul, children, ikona }: { tytul: string; children: React.ReactNode; ikona?: string }) {
  return (
    <div className="relative rounded-xl border border-sky-200/80 bg-white/95 p-4 shadow-sm ring-1 ring-sky-100/80">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-sky-950">
        {ikona ? <span aria-hidden>{ikona}</span> : null}
        {tytul}
      </h4>
      <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{children}</div>
    </div>
  );
}

export function KartaSzkolyPubliczna({
  szkola,
  linkNaMapie,
}: {
  szkola: DaneSzkolyPubliczne;
  linkNaMapie?: string | null;
}) {
  const p = szkola.profil;
  const wwwHref = linkZTekstu(p?.strona_www);
  const fbHref = linkZTekstu(p?.facebook);

  return (
    <div className="wies-karta-szkoly">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-800/85">Placówka oświatowa</p>
          <h3 className="mt-1 font-serif text-xl text-sky-950">{szkola.name}</h3>
          {szkola.short_description ? (
            <p className="mt-2 max-w-prose text-sm text-stone-600">{szkola.short_description}</p>
          ) : null}
        </div>
        {linkNaMapie ? (
          <Link href={linkNaMapie} className="text-sm font-medium text-sky-800 underline">
            Na mapie wsi
          </Link>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {p?.dyrektor ? <Blok tytul="Dyrektor" ikona="👤">{p.dyrektor}</Blok> : null}
        {p?.wicedyrektor ? <Blok tytul="Wicedyrektor" ikona="👤">{p.wicedyrektor}</Blok> : null}
        {p?.adres_szkoly || szkola.meeting_place ? (
          <Blok tytul="Adres" ikona="📍">
            {p?.adres_szkoly || szkola.meeting_place}
          </Blok>
        ) : null}
        {p?.sekretariat || szkola.schedule_text ? (
          <Blok tytul="Sekretariat" ikona="🕐">
            {p?.sekretariat || szkola.schedule_text}
          </Blok>
        ) : null}
        {p?.godziny_przyjec ? <Blok tytul="Godziny przyjęć" ikona="🕐">{p.godziny_przyjec}</Blok> : null}
        {p?.dyzury_nauczycieli ? <Blok tytul="Dyżury" ikona="📋">{p.dyzury_nauczycieli}</Blok> : null}
        {p?.zajecia_pozalekcyjne ? <Blok tytul="Zajęcia pozalekcyjne" ikona="⚽">{p.zajecia_pozalekcyjne}</Blok> : null}
        {p?.stołówka ? <Blok tytul="Stołówka" ikona="🍽">{p.stołówka}</Blok> : null}
        {p?.biblioteka_szkolna ? <Blok tytul="Biblioteka" ikona="📚">{p.biblioteka_szkolna}</Blok> : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        {szkola.contact_phone ? (
          <a href={`tel:${szkola.contact_phone.replace(/\s/g, "")}`} className="font-medium text-sky-800 underline">
            {szkola.contact_phone}
          </a>
        ) : null}
        {szkola.contact_email ? (
          <a href={`mailto:${szkola.contact_email}`} className="font-medium text-sky-800 underline">
            {szkola.contact_email}
          </a>
        ) : null}
        {wwwHref ? (
          <a href={wwwHref} target="_blank" rel="noopener noreferrer" className="font-medium text-sky-800 underline">
            Strona szkoły
          </a>
        ) : null}
        {fbHref ? (
          <a href={fbHref} target="_blank" rel="noopener noreferrer" className="font-medium text-sky-800 underline">
            Facebook
          </a>
        ) : null}
      </div>

      {p?.uwagi ? (
        <p className="mt-4 whitespace-pre-wrap text-sm text-stone-600">{p.uwagi}</p>
      ) : null}
    </div>
  );
}
