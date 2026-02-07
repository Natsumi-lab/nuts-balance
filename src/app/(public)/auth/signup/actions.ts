'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * サインアップ用 Server Action
 * - Supabase Auth で新規ユーザー登録
 * - Confirm Email ON 前提
 * - 成功時: /auth/login?info=... へリダイレクト
 * - エラー時: /auth/signup?error=... へリダイレクト
 */
export async function signUp(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  // パスワード最小文字数チェック（8文字）
  if (password.length < 8) {
    redirect(`/auth/signup?error=${encodeURIComponent('パスワードは8文字以上で入力してください')}`);
  }

  const supabase = await createClient();

  // リクエストヘッダーからオリジンを取得
  const headersList = await headers();
  const origin = headersList.get('origin') ?? '';

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // メール確認後のリダイレクト先
      emailRedirectTo: `${origin}/auth/callback?next=/auth/login`,
    },
  });

  if (error) {
    redirect(`/auth/signup?error=${encodeURIComponent(error.message)}`);
  }

  // 成功時: ログインページへリダイレクト（info メッセージ付き）
  redirect(`/auth/login?info=${encodeURIComponent('確認メールを送信しました。メール内のリンクを開いてください')}`);
}
