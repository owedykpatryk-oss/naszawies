import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { czyAdminPlatformy } from "@/lib/admin/czy-admin-platformy";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { AdminSugestieKlient, type WierszOpiniiAdmin } from "./admin-sugestie-klient";

export const metadata: Metadata = {
  title: "Opinie użytkowników",
  robots: { index: false, follow: false },
};

export default async function AdminSugestiePage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) redirect("/logowanie?next=/panel/admin/sugestie");
  if (!(await czyAdminPlatformy(supabase))) redirect("/panel");

  const { data: opinie, error } = await supabase
    .from("platform_user_feedback")
    .select(
      "id, created_at, survey_kind, rating_overall, rating_ease, what_works, what_improve, free_notes, user_role_snapshot, admin_status, admin_notes, user_id, village_id",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return (
      <main>
        <p className="text-sm text-red-800">Nie udało się wczytać opinii: {error.message}</p>
        <p className="mt-2 text-sm text-stone-600">Upewnij się, że migracja platform_user_feedback jest wdrożona.</p>
      </main>
    );
  }

  const userIds = Array.from(new Set((opinie ?? []).map((o) => o.user_id as string)));
  const villageIds = Array.from(
    new Set((opinie ?? []).map((o) => o.village_id as string).filter(Boolean)),
  );

  const [{ data: users }, { data: villages }] = await Promise.all([
    userIds.length
      ? supabase.from("users").select("id, display_name").in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; display_name: string | null }[] }),
    villageIds.length
      ? supabase.from("villages").select("id, name").in("id", villageIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const mapaUser = new Map((users ?? []).map((u) => [u.id, u.display_name]));
  const mapaWies = new Map((villages ?? []).map((v) => [v.id, v.name]));

  const wiersze: WierszOpiniiAdmin[] = (opinie ?? []).map((o) => ({
    id: o.id as string,
    created_at: o.created_at as string,
    survey_kind: o.survey_kind as string,
    rating_overall: o.rating_overall as number | null,
    rating_ease: o.rating_ease as number | null,
    what_works: o.what_works as string | null,
    what_improve: o.what_improve as string | null,
    free_notes: o.free_notes as string | null,
    user_role_snapshot: o.user_role_snapshot as string | null,
    admin_status: o.admin_status as string,
    admin_notes: o.admin_notes as string | null,
    user_display_name: mapaUser.get(o.user_id as string) ?? null,
    user_email: null,
    village_name: o.village_id ? (mapaWies.get(o.village_id as string) ?? null) : null,
  }));

  return (
    <main>
      <p className="mb-4 text-sm">
        <Link href="/panel/admin" className="text-green-800 underline">
          ← Admin
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-green-950">Opinie i sugestie użytkowników</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone-600">
        Zgłoszenia z ankiety po 14 dniach i ze strony{" "}
        <Link href="/panel/sugestie" className="underline">
          /panel/sugestie
        </Link>
        . Poniżej możesz oznaczyć status i zapisać <strong>notatki wewnętrzne</strong> — co warto ulepszyć w produkcie.
        Nowe opinie mogą też trafiać na e-mail (FEEDBACK_EMAIL_DOCELOWY).
      </p>
      <AdminSugestieKlient wiersze={wiersze} />
    </main>
  );
}
