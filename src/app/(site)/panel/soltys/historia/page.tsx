import { redirect } from "next/navigation";

/** Stary adres — kronika jest w module treści społeczności, nie obok zgłoszeń. */
export default function PanelHistoriaPrzekierowanie() {
  redirect("/panel/soltys/spolecznosc/historia");
}
