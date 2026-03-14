'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const LOGIN_PATH = '/auth/login';
const APP_PATH = '/app';

export async function signInWithPassword(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // ログイン画面でメッセージ表示できるように、エラー内容を query param に渡す
    const errorMessage = encodeURIComponent(error.message);
    redirect(`${LOGIN_PATH}?error=${errorMessage}`);
  }

  redirect(APP_PATH);
}