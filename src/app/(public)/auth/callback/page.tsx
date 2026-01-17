import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Next.js 側の生成型（PageProps）に合わせて searchParams は Promise として受け取る。
 */
type CallbackPageProps = {
  searchParams?: Promise<{
    code?: string;
    next?: string;
  }>;
};

export default async function CallbackPage({
  searchParams,
}: CallbackPageProps) {
  // searchParams を await してから使う
  const params = await searchParams;
  const code = params?.code;
  const next = params?.next ?? "/app";

  // code が無い場合はログインへ
  if (!code) {
    redirect("/auth/login");
  }

  const supabase = await createClient();

  // Supabase OAuth / PKCE の code を session に交換
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  // 失敗したらログインへ戻す（必要ならエラー表示ページへ）
  if (error) {
    console.error("exchangeCodeForSession error:", error);
    redirect("/auth/login");
  }

  redirect(next);
}
