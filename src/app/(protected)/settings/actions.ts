"use server";

import { createClient } from "@/lib/supabase/server";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

function getSiteUrl(): string {
  // Vercel 環境では自動で VERCEL_URL が注入される
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 任意で手動指定（将来本番ドメインを設定する場合）
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit && explicit.trim().length > 0) {
    return explicit.replace(/\/$/, "");
  }

  // ローカル開発時のフォールバック
  return "http://localhost:3000";
}

// メールアドレス変更 Server Action

export async function updateUserEmailAction(
  newEmail: string
): Promise<ActionResult> {
  const supabase = await createClient();

  // 認証チェック（サーバー側で実施）
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "認証エラーが発生しました" };
  }

  // メール変更リクエストを実行（確認メールは /auth/callback へリダイレクト）
  const { error } = await supabase.auth.updateUser(
    { email: newEmail },
    { emailRedirectTo: `${getSiteUrl()}/auth/callback` }
  );

  if (error) {
    // Supabase のエラーメッセージをユーザー向けに整形
    const msg = error.message.toLowerCase();

    if (msg.includes("already registered")) {
      return {
        success: false,
        error: "このメールアドレスは既に登録されています",
      };
    }

    if (msg.includes("rate limit")) {
      return {
        success: false,
        error: "しばらく時間をおいてから再度お試しください",
      };
    }

    if (msg.includes("invalid")) {
      return {
        success: false,
        error: "無効なメールアドレスです",
      };
    }

    return {
      success: false,
      error: "メールアドレスの変更に失敗しました",
    };
  }

  return { success: true, data: undefined };
}