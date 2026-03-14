"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { updateUserEmailAction } from "./actions";

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

type SettingsClientProps = {
  initialEmail: string | null;
};

const INPUT_CLASS = [
  "w-full rounded-xl border px-4 py-2.5",
  "border-[hsl(var(--border))]",
  "bg-[hsl(var(--input))]",
  "text-[hsl(var(--card-foreground))]",
  "focus:outline-none focus:ring-2 focus:ring-[#9FBFAF]/60 focus:ring-offset-1",
  "transition-all duration-200 ease-out",
  "hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] hover:ring-1 hover:ring-black/5",
  "disabled:cursor-not-allowed disabled:opacity-50",
].join(" ");

const LABEL_CLASS =
  "block text-sm font-medium text-[hsl(var(--card-foreground))]";

const CARD_CLASS = [
  "rounded-2xl border border-[hsl(var(--border))]",
  "bg-[hsl(var(--card))] p-6 shadow-lg",
].join(" ");

const PRIMARY_BUTTON_CLASS = [
  "w-full rounded-xl px-4 py-2.5",
  "bg-gradient-to-b from-[#FBE38E] via-[#F4B24E] to-[#E98A3F]",
  "font-semibold text-white",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(0,0,0,0.08),0_10px_22px_rgba(233,138,63,0.32)]",
  "ring-1 ring-[#E98A3F]/30",
  "transition-all duration-200 ease-out",
  "hover:-translate-y-1 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_12px_24px_rgba(233,138,63,0.4)]",
  "active:translate-y-0 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_8px_rgba(233,138,63,0.3)]",
  "focus:outline-none focus-visible:ring-0",
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0",
].join(" ");

const DELETE_BUTTON_CLASS = [
  "rounded-xl px-4 py-2.5",
  "bg-red-500 text-white font-semibold shadow-md",
  "transition-all duration-200 ease-out",
  "hover:-translate-y-0.5 hover:bg-red-600 hover:shadow-lg",
  "active:translate-y-0",
  "focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2",
].join(" ");

const SECONDARY_BUTTON_CLASS = [
  "flex-1 rounded-xl px-4 py-2.5",
  "border border-[hsl(var(--border))]",
  "bg-[hsl(var(--card))]",
  "font-medium text-[hsl(var(--card-foreground))]",
  "transition-all duration-200 ease-out",
  "hover:bg-[hsl(var(--muted))]",
  "focus:outline-none focus:ring-2 focus:ring-[#9FBFAF]/60 focus:ring-offset-2",
  "disabled:cursor-not-allowed disabled:opacity-50",
].join(" ");

const DANGER_BUTTON_CLASS = [
  "flex-1 rounded-xl px-4 py-2.5",
  "bg-red-500 text-white font-semibold",
  "transition-all duration-200 ease-out",
  "focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2",
  "hover:bg-red-600",
  "disabled:cursor-not-allowed disabled:opacity-50",
].join(" ");

export default function SettingsClient({ initialEmail }: SettingsClientProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
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

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleEmailChange(data: EmailChangeFormData) {
    setIsSubmitting(true);

    try {
      const result = await updateUserEmailAction(data.newEmail);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("確認メールを送信しました。メール内リンクで完了します。");
      reset();
    } catch {
      toast.error("予期せぬエラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);

    try {
      const response = await fetch("/api/account/delete", { method: "POST" });
      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "アカウントの削除に失敗しました");
        return;
      }

      router.push("/auth/login");
    } catch {
      toast.error("予期せぬエラーが発生しました");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  }

  function handleThemeToggle() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">設定</h1>

      <section className={CARD_CLASS}>
        <h2 className="mb-4 text-lg font-semibold text-[hsl(var(--card-foreground))]">
          メールアドレスの変更
        </h2>

        <div className="mb-5">
          <label className={LABEL_CLASS}>現在のメールアドレス</label>
          <p className="mt-1 text-[hsl(var(--muted-foreground))]">
            {initialEmail ?? "読み込み中..."}
          </p>
        </div>

        <form onSubmit={handleSubmit(handleEmailChange)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="newEmail" className={LABEL_CLASS}>
              新しいメールアドレス
            </label>
            <input
              id="newEmail"
              type="email"
              autoComplete="email"
              disabled={isSubmitting}
              className={INPUT_CLASS}
              {...register("newEmail")}
            />
            {errors.newEmail && (
              <p className="text-sm text-red-500">{errors.newEmail.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmEmail" className={LABEL_CLASS}>
              新しいメールアドレス（確認）
            </label>
            <input
              id="confirmEmail"
              type="email"
              autoComplete="email"
              disabled={isSubmitting}
              className={INPUT_CLASS}
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
            className={PRIMARY_BUTTON_CLASS}
          >
            {isSubmitting ? "送信中..." : "変更する"}
          </button>
        </form>
      </section>

      <section className={CARD_CLASS}>
        <h2 className="mb-4 text-lg font-semibold text-[hsl(var(--card-foreground))]">
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

          {mounted && (
            <button
              type="button"
              role="switch"
              aria-checked={theme === "dark"}
              onClick={handleThemeToggle}
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
                  "inline-block h-4 w-4 rounded-full bg-white shadow-lg",
                  "transform transition-transform duration-200 ease-in-out",
                  theme === "dark" ? "translate-x-6" : "translate-x-1",
                ].join(" ")}
              />
            </button>
          )}
        </div>
      </section>

      <section
        className={[CARD_CLASS, "border-red-200 dark:border-red-900"].join(" ")}
      >
        <h2 className="mb-4 text-lg font-semibold text-red-600 dark:text-red-400">
          アカウントの削除
        </h2>

        <p className="mb-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
          アカウントを削除すると、すべてのデータが完全に消去されます。
          <br />
          この操作は取り消すことができません。
        </p>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            className={DELETE_BUTTON_CLASS}
          >
            アカウントを削除する
          </button>
        </div>
      </section>

      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !isDeleting && setShowDeleteDialog(false)}
          />

          <div
            className={[
              "relative z-10 mx-4 w-full max-w-md rounded-2xl",
              "border border-[hsl(var(--border))]",
              "bg-[hsl(var(--card))] p-6 shadow-xl",
            ].join(" ")}
          >
            <h3 className="mb-2 text-lg font-semibold text-[hsl(var(--card-foreground))]">
              本当に削除しますか？
            </h3>

            <p className="mb-6 text-sm text-[hsl(var(--muted-foreground))]">
              アカウントを削除すると、以下のデータがすべて削除されます：
            </p>

            <ul className="mb-6 list-inside list-disc space-y-1 text-sm text-[hsl(var(--muted-foreground))]">
              <li>すべてのナッツ記録</li>
              <li>ストリーク履歴</li>
              <li>アカウント情報</li>
            </ul>

            <p className="mb-6 text-sm font-medium text-red-600 dark:text-red-400">
              この操作は元に戻すことができません。また、同じメールアドレスでの再登録はできない場合があります。
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
                className={SECONDARY_BUTTON_CLASS}
              >
                キャンセル
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className={DANGER_BUTTON_CLASS}
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
