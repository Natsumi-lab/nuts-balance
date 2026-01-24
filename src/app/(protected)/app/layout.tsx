import type { ReactNode } from "react";
import NavBar from "./_components/NavBar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      {/* ナビバーをページ上部に設置 */}
      <NavBar />
      {/* 元のchildren構造を維持 */}
      {children}
    </div>
  );
}
