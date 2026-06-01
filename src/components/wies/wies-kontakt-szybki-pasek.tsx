"use client";

type Kontakt = {
  role_label: string;
  person_name: string;
  contact_phone: string | null;
  office_key: string;
};

/** Sticky „Zadzwoń” — widoczny głównie w trybie uproszczonym (CSS). */
export function WiesKontaktSzybkiPasek({ kontakty }: { kontakty: Kontakt[] }) {
  const soltys =
    kontakty.find((k) => k.office_key === "soltys" || /sołtys/i.test(k.role_label)) ?? kontakty[0];
  if (!soltys?.contact_phone) return null;

  const tel = soltys.contact_phone.replace(/\s/g, "");

  return (
    <div className="kontakt-szybki-pasek fixed left-4 right-4 z-40 mx-auto flex max-w-lg justify-center md:hidden">
      <a
        href={`tel:${tel}`}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-green-900 px-5 py-3.5 text-base font-semibold text-white shadow-lg ring-2 ring-white/80"
      >
        Zadzwoń: {soltys.person_name || "sołtys"}
      </a>
    </div>
  );
}
