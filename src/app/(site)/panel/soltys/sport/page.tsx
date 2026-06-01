import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sport — terminarz klubu",
  description: "Zarządzanie klubem sportowym, treningami i meczami na profilu wsi.",
};

/** Skrót do panelu społeczności w trybie sportu. */
export default function PanelSportPage() {
  redirect("/panel/soltys/spolecznosc?tryb=sport");
}
