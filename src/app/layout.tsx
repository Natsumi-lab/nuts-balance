import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // ダークモード切替時のハイドレーション不整合を防ぎ、
    // 表示のちらつきを抑えるための設定
    <html lang="ja" suppressHydrationWarning>
      {/* アプリ全体に適用される基本スタイル（Tailwindのユーティリティクラス） */}
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>
          {children}
          <Toaster
            position="top-center"
            richColors
            closeButton
            toastOptions={{
              duration: 4000,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
