import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { wyslijWebPushDlaUzytkownika } from "@/lib/pwa/wyslij-web-push";

export async function powiadomONowejWiadomosciCzat(input: {
  odbiorcyIds: string[];
  conversationId: string;
  tytulKonwersacji: string;
  fragment: string;
  nadawcaNazwa: string;
}): Promise<void> {
  if (input.odbiorcyIds.length === 0) return;

  const admin = createAdminSupabaseClient();
  if (!admin) return;

  const link = `/panel/czat/${input.conversationId}`;
  const tytul = `Wiadomość: ${input.tytulKonwersacji}`;
  const body = `${input.nadawcaNazwa}: ${input.fragment.slice(0, 120)}`;

  const wstaw = input.odbiorcyIds.map((userId) => ({
    user_id: userId,
    type: "chat_message",
    title: tytul,
    body,
    link_url: link,
    related_id: input.conversationId,
    related_type: "chat_conversation",
    channel: "in_app",
  }));

  const { error } = await admin.from("notifications").insert(wstaw);
  if (error) {
    console.warn("[powiadomONowejWiadomosciCzat]", error.message);
  }

  for (const userId of input.odbiorcyIds) {
    void wyslijWebPushDlaUzytkownika(admin, {
      userId,
      title: tytul,
      body,
      linkUrl: link,
      tag: `chat-${input.conversationId}`,
    }).catch(() => {});
  }
}
