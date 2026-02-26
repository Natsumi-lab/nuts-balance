"use server";

import { createClient } from "@/lib/supabase/server";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function updateUserEmailAction(
  newEmail: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "認証エラーが発生しました" };
  }

  const { error } = await supabase.auth.updateUser({ email: newEmail });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already registered")) {
      return { success: false, error: "このメールアドレスは既に登録されています" };
    }
    if (msg.includes("rate limit")) {
      return { success: false, error: "しばらく時間をおいてから再度お試しください" };
    }
    if (msg.includes("invalid")) {
      return { success: false, error: "無効なメールアドレスです" };
    }
    return { success: false, error: "メールアドレスの変更に失敗しました" };
  }

  return { success: true, data: undefined };
}