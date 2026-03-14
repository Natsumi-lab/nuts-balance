'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const SIGNUP_PATH = '/auth/signup';
const LOGIN_PATH = '/auth/login';
const MIN_PASSWORD_LENGTH = 8;

export async function signUp(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  if (password.length < MIN_PASSWORD_LENGTH) {
    const errorMessage = encodeURIComponent(
      'パスワードは8文字以上で入力してください'
    );
    redirect(`${SIGNUP_PATH}?error=${errorMessage}`);
  }

  const headersList = await headers();
  const origin = headersList.get('origin') ?? '';
  const emailRedirectPath = '/auth/callback?next=/auth/login';

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // メール確認後にアプリへ戻せるよう、確認リンクの遷移先を指定する
      emailRedirectTo: `${origin}${emailRedirectPath}`,
    },
  });

  if (error) {
    // サインアップ画面でメッセージ表示できるように、エラー内容を query param に渡す
    const errorMessage = encodeURIComponent(error.message);
    redirect(`${SIGNUP_PATH}?error=${errorMessage}`);
  }

  const infoMessage = encodeURIComponent(
    '確認メールを送信しました。メール内のリンクを開いてください'
  );

  redirect(`${LOGIN_PATH}?info=${infoMessage}`);
}