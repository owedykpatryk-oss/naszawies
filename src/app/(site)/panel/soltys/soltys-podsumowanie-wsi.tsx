import type { LicznikiPerWies } from "@/lib/panel/liczniki-oczekujacych-soltysa";
import { lacznaLiczbaOczekujacych } from "@/lib/panel/liczniki-oczekujacych-soltysa";

export function SoltysPodsumowanieWsi({
  wiersze,
  nazwyWsi,
}: {
  wiersze: LicznikiPerWies[];
  nazwyWsi: Record<string, string>;
}) {
  if (wiersze.length === 0) return null;

  return (
    <section className="mt-6 rounded-xl border border-stone-200 bg-stone-50/80 p-4">
      <h3 className="text-sm font-semibold text-green-950">Oczekujące wg wsi</h3>
      <p className="mt-1 text-xs text-stone-600">Masz kilka miejscowości — tu widać, gdzie jest najwięcej pracy.</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[320px] text-left text-xs">
          <thead>
            <tr className="border-b border-stone-200 text-stone-500">
              <th className="py-1 pr-2 font-medium">Wieś</th>
              <th className="py-1 px-1 font-medium">Razem</th>
              <th className="py-1 px-1 font-medium">Wnioski</th>
              <th className="py-1 px-1 font-medium">Posty</th>
              <th className="py-1 px-1 font-medium">Zgłoszenia</th>
              <th className="py-1 px-1 font-medium">Rezerw.</th>
            </tr>
          </thead>
          <tbody>
            {wiersze.map((w) => (
              <tr key={w.villageId} className="border-b border-stone-100">
                <td className="py-1.5 pr-2 font-medium text-stone-800">{nazwyWsi[w.villageId] ?? "—"}</td>
                <td className="py-1.5 px-1 font-semibold text-green-900">{lacznaLiczbaOczekujacych(w)}</td>
                <td className="py-1.5 px-1">{w.wnioski || "—"}</td>
                <td className="py-1.5 px-1">{w.posty || "—"}</td>
                <td className="py-1.5 px-1">{w.zgloszenia || "—"}</td>
                <td className="py-1.5 px-1">{w.rezerwacje || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
