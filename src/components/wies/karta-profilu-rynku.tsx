import Link from "next/link";
import { OdznakaZweryfikowany } from "@/components/wies/rynek-ui";
import { etykietaRodzajuProfilu } from "@/lib/marketplace/rodzaj-profilu-rynku";

export type ProfilRynekPubliczny = {
  id: string;
  business_name: string;
  short_description: string | null;
  categories: string[] | null;
  phone: string | null;
  is_verified: boolean;
  profile_kind?: string | null;
};

export function KartaProfiluRynku({ profil, sciezkaWsi }: { profil: ProfilRynekPubliczny; sciezkaWsi: string }) {
  const kategorie = (profil.categories ?? []).slice(0, 4);

  return (
    <Link
      href={`${sciezkaWsi}/rynek/firmy/${profil.id}`}
      className="group flex h-full flex-col rounded-2xl border border-orange-200/80 bg-gradient-to-br from-orange-50/70 via-white to-amber-50/30 p-4 shadow-sm transition hover:border-orange-400 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-orange-900">
          {etykietaRodzajuProfilu(profil.profile_kind)}
        </p>
        {profil.is_verified ? <OdznakaZweryfikowany /> : null}
      </div>
      <h3 className="mt-2 font-serif text-lg text-green-950 group-hover:text-green-900">{profil.business_name}</h3>
      <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-stone-600">
        {profil.short_description ?? "Profil usług i ofert lokalnych."}
      </p>
      {kategorie.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1">
          {kategorie.map((k) => (
            <li key={k} className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] text-stone-600 ring-1 ring-orange-100">
              {k}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
        <span>{profil.phone ? `tel. ${profil.phone}` : "Profil lokalny"}</span>
        <span className="font-medium text-orange-900 group-hover:underline">Strona firmy →</span>
      </p>
    </Link>
  );
}
