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

  const base = "px-3 py-2 rounded-lg text-sm transition-all whitespace-nowrap";
  const active = "bg-[#9FE3A0] shadow-sm";
  const inactive = "bg-[#EAF6F0] hover:bg-[#CFEBDD]";

  return (
    <header className="sticky top-0 z-10 border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
        {/* ロゴ */}
        <Link href="/app" className="flex items-center gap-2 font-bold">
          <Image
            src="/nuts/logo.png"
            alt="Nuts Balance"
            width={32}
            height={32}
          />
          <span className="text-[#2A7A4B]">Nuts Balance</span>
        </Link>

        {/* ナビ（横スクロール） */}
        <nav className="flex gap-2 overflow-x-auto">
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
          <button className="px-3 py-2 text-sm text-[#D84A3A] hover:underline">
            ログアウト
          </button>
        </nav>
      </div>
    </header>
  );
}
