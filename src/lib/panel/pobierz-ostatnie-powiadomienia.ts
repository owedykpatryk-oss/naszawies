import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

export type SkrotPowiadomienia = {
  id: string;
  title: string;
  body: string | null;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
};

export async function pobierzOstatniePowiadomienia(userId: string, limit = 5): Promise<SkrotPowiadomienia[]> {
  const supabase = utworzKlientaSupabaseSerwer();
  const { data } = await supabase
    .from("notifications")
    .select("id, title, body, link_url, is_read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as SkrotPowiadomienia[];
}
