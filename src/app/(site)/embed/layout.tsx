import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Widget wsi",
};

export default function LayoutEmbed({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-stone-50 p-3 sm:p-4">
      {children}
      <p className="mt-4 text-center text-[11px] text-stone-500">
        <a href="https://naszawies.pl" target="_blank" rel="noopener noreferrer" className="underline hover:text-green-800">
          naszawies.pl
        </a>
      </p>
    </div>
  );
}
