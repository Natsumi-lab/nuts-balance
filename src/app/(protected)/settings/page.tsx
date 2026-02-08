"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

// メールアドレス変更フォームのスキーマ
const emailChangeSchema = z
  .object({
    newEmail: z.string().email("有効なメールアドレスを入力してください"),
    confirmEmail: z.string().email("有効なメールアドレスを入力してください"),
  })
  .refine((data) => data.newEmail === data.confirmEmail, {
    message: "メールアドレスが一致しません",
    path: ["confirmEmail"],
  });

type EmailChangeFormData = z.infer<typeof emailChangeSchema>;

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmailChangeFormData>({
    resolver: zodResolver(emailChangeSchema),
  });

  // ハイドレーション完了後にマウント状態を更新
  useEffect(() => {
    setMounted(true);
  }, []);

  // 現在のユーザー情報を取得
  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      setCurrentEmail(user.email ?? null);
    }

    fetchUser();
  }, [router]);

  // メールアドレス変更処理
  const onSubmitEmailChange = async (data: EmailChangeFormData) => {
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        email: data.newEmail,
      });

      if (error) {
        // Supabaseエラーをユーザー向けに整形
        let message = "メールアドレスの変更に失敗しました";
        if (error.message.includes("already registered")) {
          message = "このメールアドレスは既に登録されています";
        } else if (error.message.includes("rate limit")) {
          message = "しばらく時間をおいてから再度お試しください";
        } else if (error.message.includes("invalid")) {
          message = "無効なメールアドレスです";
        }
        toast.error(message);
        return;
      }

      toast.success("確認メールを送信しました。メール内リンクで完了します。");
      reset();
    } catch {
      toast.error("予期せぬエラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  // アカウント削除処理
  const handleDeleteAccount = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "アカウントの削除に失敗しました");
        return;
      }

      // 成功時はログインページにリダイレクト
      router.push("/auth/login");
    } catch {
      toast.error("予期せぬエラーが発生しました");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // 共通スタイル
  const inputClass = [
    "w-full rounded-xl border px-4 py-2.5",
    "border-[hsl(var(--border))]",
    "bg-[hsl(var(--input))]",
    "text-[hsl(var(--card-foreground))]",
    "focus:outline-none focus:ring-2 focus:ring-[#9FBFAF]/60 focus:ring-offset-1",
    "transition-all duration-200 ease-out",
    "hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] hover:ring-1 hover:ring-black/5",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ].join(" ");

  const labelClass =
    "block text-sm font-medium text-[hsl(var(--card-foreground))]";

  const cardClass = [
    "rounded-2xl border border-[hsl(var(--border))]",
    "bg-[hsl(var(--card))] shadow-lg",
    "p-6",
  ].join(" ");

  const primaryButtonClass = [
    "w-full rounded-xl px-4 py-2.5",
    "bg-gradient-to-b from-[#FBE38E] via-[#F4B24E] to-[#E98A3F]",
    "text-white font-semibold",
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(0,0,0,0.08),0_10px_22px_rgba(233,138,63,0.32)]",
    "ring-1 ring-[#E98A3F]/30",
    "transition-all duration-200 ease-out",
    "hover:-translate-y-1 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_12px_24px_rgba(233,138,63,0.4)]",
    "active:translate-y-0 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_8px_rgba(233,138,63,0.3)]",
    "focus:outline-none focus-visible:ring-0",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
  ].join(" ");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">設定</h1>

      {/* メールアドレス変更セクション */}
      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-[hsl(var(--card-foreground))] mb-4">
          メールアドレスの変更
        </h2>

        {/* 現在のメールアドレス表示 */}
        <div className="mb-5">
          <label className={labelClass}>現在のメールアドレス</label>
          <p className="mt-1 text-[hsl(var(--muted-foreground))]">
            {currentEmail ?? "読み込み中..."}
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmitEmailChange)}
          className="space-y-4"
        >
          {/* 新しいメールアドレス */}
          <div className="space-y-2">
            <label htmlFor="newEmail" className={labelClass}>
              新しいメールアドレス
            </label>
            <input
              id="newEmail"
              type="email"
              autoComplete="email"
              disabled={isSubmitting}
              className={inputClass}
              {...register("newEmail")}
            />
            {errors.newEmail && (
              <p className="text-sm text-red-500">{errors.newEmail.message}</p>
            )}
          </div>

          {/* 確認用メールアドレス */}
          <div className="space-y-2">
            <label htmlFor="confirmEmail" className={labelClass}>
              新しいメールアドレス（確認）
            </label>
            <input
              id="confirmEmail"
              type="email"
              autoComplete="email"
              disabled={isSubmitting}
              className={inputClass}
              {...register("confirmEmail")}
            />
            {errors.confirmEmail && (
              <p className="text-sm text-red-500">
                {errors.confirmEmail.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={primaryButtonClass}
          >
            {isSubmitting ? "送信中..." : "変更する"}
          </button>
        </form>
      </section>

      {/* 表示モード切替セクション */}
      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-[hsl(var(--card-foreground))] mb-4">
          表示モード
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-[hsl(var(--card-foreground))]">
              ダークモード
            </p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              画面の表示を暗いテーマに切り替えます
            </p>
          </div>

          {/* カスタムスイッチ */}
          {mounted && (
            <button
              type="button"
              role="switch"
              aria-checked={theme === "dark"}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={[
                "relative inline-flex h-6 w-11 items-center rounded-full",
                "transition-colors duration-200 ease-in-out",
                "focus:outline-none focus:ring-2 focus:ring-[#9FBFAF]/60 focus:ring-offset-2",
                theme === "dark"
                  ? "bg-[hsl(var(--primary))]"
                  : "bg-[hsl(var(--muted))]",
              ].join(" ")}
            >
              <span
                className={[
                  "inline-block h-4 w-4 transform rounded-full bg-white shadow-lg",
                  "transition-transform duration-200 ease-in-out",
                  theme === "dark" ? "translate-x-6" : "translate-x-1",
                ].join(" ")}
              />
            </button>
          )}
        </div>
      </section>

      {/* アカウント削除セクション */}
      <section
        className={[cardClass, "border-red-200 dark:border-red-900"].join(" ")}
      >
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
          アカウントの削除
        </h2>

        <p className="text-sm text-center text-[hsl(var(--muted-foreground))] mb-6">
          アカウントを削除すると、すべてのデータが完全に消去されます。
          <br />
          この操作は取り消すことができません。
        </p>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            className={[
              "rounded-xl px-4 py-2.5",
              "bg-red-500 hover:bg-red-600",
              "text-white font-semibold",
              "shadow-md",
              "transition-all duration-200 ease-out",
              "hover:-translate-y-0.5 hover:shadow-lg",
              "active:translate-y-0",
              "focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2",
            ].join(" ")}
          >
            アカウントを削除する
          </button>
        </div>
      </section>

      {/* 削除確認ダイアログ */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* オーバーレイ */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !isDeleting && setShowDeleteDialog(false)}
          />

          {/* ダイアログ */}
          <div
            className={[
              "relative z-10 w-full max-w-md mx-4",
              "rounded-2xl border border-[hsl(var(--border))]",
              "bg-[hsl(var(--card))] shadow-xl",
              "p-6",
            ].join(" ")}
          >
            <h3 className="text-lg font-semibold text-[hsl(var(--card-foreground))] mb-2">
              本当に削除しますか？
            </h3>

            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
              アカウントを削除すると、以下のデータがすべて削除されます：
            </p>

            <ul className="text-sm text-[hsl(var(--muted-foreground))] mb-6 list-disc list-inside space-y-1">
              <li>すべてのナッツ記録</li>
              <li>ストリーク履歴</li>
              <li>アカウント情報</li>
            </ul>

            <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-6">
              この操作は元に戻すことができません。また、同じメールアドレスでの再登録はできない場合があります。
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
                className={[
                  "flex-1 rounded-xl px-4 py-2.5",
                  "border border-[hsl(var(--border))]",
                  "bg-[hsl(var(--card))]",
                  "text-[hsl(var(--card-foreground))] font-medium",
                  "transition-all duration-200 ease-out",
                  "hover:bg-[hsl(var(--muted))]",
                  "focus:outline-none focus:ring-2 focus:ring-[#9FBFAF]/60 focus:ring-offset-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                ].join(" ")}
              >
                キャンセル
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className={[
                  "flex-1 rounded-xl px-4 py-2.5",
                  "bg-red-500 hover:bg-red-600",
                  "text-white font-semibold",
                  "transition-all duration-200 ease-out",
                  "focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                ].join(" ")}
              >
                {isDeleting ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
