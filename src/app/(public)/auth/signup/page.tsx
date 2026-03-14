import Link from "next/link";
import { signUp } from "./actions";

type PageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

const cardClassName = [
  "w-full max-w-sm",
  "rounded-2xl border border-[hsl(var(--border))]",
  "bg-[hsl(var(--card))] shadow-lg",
  "p-6 sm:p-8",
  "transition-all duration-200 ease-out",
  "hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(0,0,0,0.12)] hover:ring-1 hover:ring-black/5",
  "active:translate-y-0 active:shadow-[0_10px_18px_rgba(0,0,0,0.10)]",
].join(" ");

const inputClassName = [
  "w-full rounded-xl border px-4 py-2.5",
  "border-[hsl(var(--border))]",
  "bg-[hsl(var(--input))]",
  "text-[hsl(var(--card-foreground))]",
  "focus:outline-none focus:ring-2 focus:ring-[#9FBFAF]/60 focus:ring-offset-1",
  "transition-all duration-200 ease-out",
  "hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(0,0,0,0.08)] hover:ring-1 hover:ring-black/5",
].join(" ");

const submitButtonClassName = [
  "mt-4",
  "w-full rounded-xl px-4 py-2.5",
  "bg-gradient-to-b from-[#FBE38E] via-[#F4B24E] to-[#E98A3F]",
  "text-white font-semibold",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(0,0,0,0.08),0_10px_22px_rgba(233,138,63,0.32)]",
  "ring-1 ring-[#E98A3F]/30",
  "transition-all duration-200 ease-out",
  "hover:-translate-y-1 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_12px_24px_rgba(233,138,63,0.4)]",
  "active:translate-y-0 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_8px_rgba(233,138,63,0.3)]",
  "focus:outline-none focus-visible:ring-0",
].join(" ");

const errorMessageClassName = [
  "mt-5 rounded-xl border",
  "border-[hsl(var(--accent))]",
  "bg-[hsl(var(--accent)/0.1)]",
  "px-4 py-3",
].join(" ");

const loginLinkClassName = [
  "font-medium text-[#D08A3A]",
  "hover:underline hover:text-[#E98A3F]",
  "transition-colors duration-200",
].join(" ");

export default async function SignUpPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const errorMessage = params?.error;

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 py-8">
      <div className={cardClassName}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[hsl(var(--card-foreground))]">
            サインアップ
          </h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            新しいアカウントを作成してください
          </p>
        </div>

        {errorMessage && (
          <div className={errorMessageClassName} role="alert">
            <p className="text-sm font-medium text-[hsl(var(--accent-foreground))]">
              {errorMessage}
            </p>
          </div>
        )}

        <form action={signUp} className="mt-6 space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[hsl(var(--card-foreground))]"
            >
              メールアドレス
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className={inputClassName}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="flex items-center gap-3 text-sm font-medium text-[hsl(var(--card-foreground))]"
            >
              <span>パスワード</span>
              <span className="text-xs font-normal text-[hsl(var(--muted-foreground))]">
                8文字以上で入力してください
              </span>
            </label>

            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className={inputClassName}
            />
          </div>

          <button type="submit" className={submitButtonClassName}>
            アカウントを作成
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            すでにアカウントをお持ちの方は{" "}
            <Link href="/auth/login" className={loginLinkClassName}>
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
