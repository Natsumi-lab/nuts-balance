import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type CallbackPageProps = {
  searchParams?: {
    code?: string;
    next?: string;
  };
};

export default async function CallbackPage({
  searchParams,
}: CallbackPageProps) {
  const code = searchParams?.code;
  const next = searchParams?.next ?? "/app";

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
