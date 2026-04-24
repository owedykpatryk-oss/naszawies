"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const linki: { href: string; label: string }[] = [
  { href: "/panel", label: "Start" },
  { href: "/panel/profil", label: "Mój profil" },
  { href: "/panel/powiadomienia", label: "Powiadomienia" },
  { href: "/panel/mieszkaniec", label: "Mieszkaniec" },
  { href: "/panel/soltys", label: "Sołtys" },
  { href: "/panel/admin", label: "Admin" },
];

export function PanelNawigacja() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Panel"
      className="mb-10 flex flex-wrap gap-2 border-b border-stone-200 pb-4 text-sm"
    >
      {linki.map(({ href, label }) => {
        const aktywny =
          href === "/panel" ? pathname === "/panel" : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={
              aktywny
                ? "rounded-lg bg-green-900 px-3 py-2 font-medium text-white"
                : "rounded-lg px-3 py-2 text-stone-700 hover:bg-stone-100"
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
