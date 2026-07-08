import type { Metadata } from "next";
import { BlogTrybCiemny } from "@/components/blog/blog-tryb-ciemny";

export const metadata: Metadata = {
  alternates: {
    types: {
      "application/rss+xml": [{ url: "/blog/rss.xml", title: "RSS — blog naszawies.pl" }],
    },
  },
};

export default function LayoutBlog({ children }: { children: React.ReactNode }) {
  return (
    <div className="blog-obszar min-h-full min-w-0 overflow-x-hidden bg-stone-50/50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <div className="flex justify-end px-4 pt-3 sm:px-6">
        <BlogTrybCiemny />
      </div>
      {children}
    </div>
  );
}
