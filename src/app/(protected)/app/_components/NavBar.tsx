"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/app" && pathname === "/app") return true;
    if (path !== "/app" && pathname.startsWith(path)) return true;
    return false;
  };

  // 共通ベース（幅を揃える）
  const base =
    "min-w-[96px] px-4 py-2 rounded-xl text-sm text-center font-medium whitespace-nowrap transition-all duration-200";

  // 非アクティブ（淡いハーベストイエロー）
  const inactive =
    "bg-gradient-to-b from-[#FFF3C4] to-[#F7D978] text-[#6B4E00] hover:from-[#FFE08A] hover:to-[#F2B705]";

  // アクティブ（最も濃い）
  const active =
    "bg-gradient-to-b from-[#F7C948] to-[#F2B705] text-[#5A3E00] shadow-md";

  return (
    <header className="sticky top-0 z-10 border-b border-[#F2E8C9] bg-white">
      {/* ナビ高さ */}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* ロゴ */}
        <Link href="/app" className="flex items-center gap-3 font-bold">
          <div className="h-12 w-12 rounded-full bg-white overflow-hidden shrink-0">
            <div className="h-full w-full flex items-center justify-center">
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
          <span className="text-2xl leading-none text-[#333]">
            Nuts Balance
          </span>
        </Link>

        {/* ナビ（横スクロール対応） */}
        <nav className="flex gap-3 overflow-x-auto">
          <Link
            href="/app"
            className={`${base} ${isActive("/app") ? active : inactive}`}
          >
            記録
          </Link>
          <Link
            href="/app/report"
            className={`${base} ${isActive("/app/report") ? active : inactive}`}
          >
            レポート
          </Link>
          <Link
            href="/app/nuts"
            className={`${base} ${isActive("/app/nuts") ? active : inactive}`}
          >
            ナッツ図鑑
          </Link>
          <Link
            href="/app/settings"
            className={`${base} ${isActive("/app/settings") ? active : inactive}`}
          >
            設定
          </Link>

          {/* ログアウト：カレンダー選択日のブルー */}
          <button className="min-w-[96px] px-4 py-2 rounded-xl text-sm font-medium text-[#2563EB] hover:bg-blue-50 transition">
            ログアウト
          </button>
        </nav>
      </div>
    </header>
  );
}
