'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function signInWithPassword(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // エラーを出したい場合は searchParams などで扱えるようにリダイレクト
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
  }

  // 成功したら /app へ
  redirect('/app');
}
