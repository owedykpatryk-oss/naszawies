import type { SupabaseClient } from "@supabase/supabase-js";

export function pobierzIpIUserAgentZRequestu(request: Request): {
  source_ip: string | null;
  user_agent: string | null;
} {
  const xff = request.headers.get("x-forwarded-for");
  const raw = xff?.split(",")[0]?.trim() ?? null;
  const source_ip = raw && raw.length <= 128 ? raw : null;
  const ua = request.headers.get("user-agent");
  const user_agent = ua && ua.length <= 4000 ? ua : null;
  return { source_ip, user_agent };
}

/**
 * Jednorazowy zapis wiersza po zakończeniu zadania cron (service role omija RLS).
 */
export async function zapiszCronRun(
  admin: SupabaseClient,
  dane: {
    endpoint: string;
    started_at: string;
    status: "success" | "error";
    affected_rows?: unknown;
    error_message?: string | null;
    source_ip?: string | null;
    user_agent?: string | null;
  },
): Promise<void> {
  const finished_at = new Date().toISOString();
  const { error } = await admin.from("cron_runs").insert({
    endpoint: dane.endpoint,
    started_at: dane.started_at,
    finished_at,
    status: dane.status,
    affected_rows: dane.affected_rows ?? null,
    error_message: dane.error_message ?? null,
    source_ip: dane.source_ip ?? null,
    user_agent: dane.user_agent ?? null,
  });
  if (error) {
    console.error("[zapiszCronRun]", error.message);
  }
}
