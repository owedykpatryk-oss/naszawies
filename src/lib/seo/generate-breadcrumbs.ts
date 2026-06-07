export type Okruszek = {
  nazwa: string;
  href: string;
};

export function generateBreadcrumbsBlog(
  segmenty: { nazwa: string; href?: string }[],
): Okruszek[] {
  const baza: Okruszek[] = [
    { nazwa: "Strona główna", href: "/" },
    { nazwa: "Blog", href: "/blog" },
  ];
  for (const s of segmenty) {
    if (s.href) {
      baza.push({ nazwa: s.nazwa, href: s.href });
    } else {
      baza.push({ nazwa: s.nazwa, href: "" });
    }
  }
  return baza;
}
