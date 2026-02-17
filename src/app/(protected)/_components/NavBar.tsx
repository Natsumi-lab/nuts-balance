"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";

export default function NavBar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/app" && pathname === "/app") return true;
    if (path !== "/app" && pathname.startsWith(path)) return true;
    return false;
  };

  // 共通ベース
  const base =
    "min-w-[96px] px-4 py-2 rounded-2xl text-sm text-center font-medium whitespace-nowrap";

  // 共通スタイル
  const baseStyle =
    "transition-all duration-200 ease-out " +
    "bg-gradient-to-b from-[#FFF1B8] via-[#FFE08A] to-[#F7C948] text-[#6B4E00] " +
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_6px_14px_rgba(0,0,0,0.16)] " +
    "hover:-translate-y-1 " +
    "hover:bg-gradient-to-b hover:from-[#FBE38E] hover:via-[#F4B24E] hover:to-[#E98A3F] " +
    "hover:text-white " +
    "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_12px_24px_rgba(233,138,63,0.4)]";

  // 非アクティブ
  const inactive = baseStyle;

  // アクティブ
  const active = baseStyle + " font-semibold";

  return (
    <header className="sticky top-0 z-10 border-b border-[#F2E8C9] bg-white dark:border-border dark:bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* ロゴ */}
        <Link
          href="/app"
          className="group flex items-center gap-3 font-bold transition-all duration-200 ease-out hover:-translate-y-0.5"
        >
          <div
            className="
              h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white
              shadow-[0_10px_22px_rgba(0,0,0,0.32)]
              transition-all duration-200
              group-hover:shadow-[0_14px_28px_rgba(0,0,0,0.38)]
            "
          >
            <div className="flex h-full w-full items-center justify-center">
              <Image
                src="/nuts/logo.png"
                alt="Nuts Balance"
                width={44}
                height={44}
                className="scale-[1.08]"
                priority
              />
            </div>
          </div>

          {/* テキストロゴ */}
          <span
            className="
              text-2xl leading-none text-[#333] dark:text-foreground
              transition-all duration-200
              group-hover:-translate-y-0.5
              drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]
              group-hover:drop-shadow-[0_6px_12px_rgba(0,0,0,0.4)]
            "
          >
            Nuts Balance
          </span>
        </Link>

        {/* ナビ（横スクロール対応） */}
        <nav className="flex items-center">
          <div className="flex gap-3 overflow-x-auto overflow-y-visible py-3 pr-6 pb-6">
            <Link
              href="/app"
              className={`${base} ${isActive("/app") ? active : inactive}`}
            >
              記録
            </Link>

            <Link
              href="/report"
              className={`${base} ${isActive("/app/report") ? active : inactive}`}
            >
              レポート
            </Link>

            <Link
              href="/nuts"
              className={`${base} ${isActive("/app/nuts") ? active : inactive}`}
            >
              ナッツ知識
            </Link>

            <Link
              href="/settings"
              className={`${base} ${isActive("/app/settings") ? active : inactive}`}
            >
              設定
            </Link>

            {/* ログアウト */}
            <form action={logoutAction}>
              <button
                type="submit"
                className="
                    min-w-[96px] rounded-xl px-4 py-2 text-sm font-medium
                    bg-gradient-to-b from-[#EFF6FF] via-[#DBEAFE] to-[#BFDBFE]
                    text-[#1E40AF]
                    shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_4px_10px_rgba(30,64,175,0.18)]
                    ring-1 ring-blue-300/50
                    transition-all duration-200 ease-out
                    hover:-translate-y-0.5
                    hover:bg-gradient-to-b hover:from-[#DBEAFE] hover:to-[#93C5FD]
                    hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_18px_rgba(30,64,175,0.28)]
                    active:translate-y-0 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_3px_6px_rgba(30,64,175,0.22)] "
              >
                ログアウト
              </button>
            </form>
          </div>
        </nav>
      </div>
    </header>
  );
}
