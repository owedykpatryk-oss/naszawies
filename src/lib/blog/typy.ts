export type StatusArtykulu = "draft" | "published";

export type BlogAutor = {
  id: string;
  name: string;
  avatar?: string | null;
  bio?: string | null;
};

export type BlogKategoria = {
  slug: string;
  name: string;
  description: string;
};

export type BlogFaq = {
  question: string;
  answer: string;
};

export type BlogLinkWewnetrzny = {
  href: string;
  label: string;
};

export type BlogArtykul = {
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  gallery: string[];
  content: string;
  authorId: string;
  categorySlug: string;
  tags: string[];
  faq: BlogFaq[];
  relatedSlugs: string[];
  featured: boolean;
  status: StatusArtykulu;
  publishedAt: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImage?: string | null;
  readingTime?: number | null;
  internalLinks: BlogLinkWewnetrzny[];
  generatedImages?: string[];
};

export type BlogArtykulPelny = BlogArtykul & {
  author: BlogAutor;
  category: BlogKategoria;
  readingTime: number;
};
