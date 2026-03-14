"use server";

import { createClient } from "@/lib/supabase/server";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const LOCAL_SITE_URL = "http://localhost:3000";
const AUTH_CALLBACK_PATH = "/auth/callback";

/**
 * アプリのベースURLを返す
 */
function getSiteUrl(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  const explicitSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicitSiteUrl && explicitSiteUrl.trim().length > 0) {
    return explicitSiteUrl.replace(/\/$/, "");
  }

  return LOCAL_SITE_URL;
}

/**
 * メール変更後のリダイレクト先URLを返す
 */
function getEmailRedirectUrl(): string {
  return `${getSiteUrl()}${AUTH_CALLBACK_PATH}`;
}

/**
 * Supabaseエラーをユーザー向けメッセージに変換する
 */
function getEmailUpdateErrorMessage(errorMessage: string): string {
  const normalizedMessage = errorMessage.toLowerCase();

  if (normalizedMessage.includes("already registered")) {
    return "このメールアドレスは既に登録されています";
  }

  if (normalizedMessage.includes("rate limit")) {
    return "しばらく時間をおいてから再度お試しください";
  }

  if (normalizedMessage.includes("invalid")) {
    return "無効なメールアドレスです";
  }

  return "メールアドレスの変更に失敗しました";
}

/**
 * メールアドレス変更
 */
export async function updateUserEmailAction(
  newEmail: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "認証エラーが発生しました" };
  }

  const { error: updateError } = await supabase.auth.updateUser(
    { email: newEmail },
    { emailRedirectTo: getEmailRedirectUrl() },
  );

  if (updateError) {
    return {
      success: false,
      error: getEmailUpdateErrorMessage(updateError.message),
    };
  }

  return { success: true, data: undefined };
}