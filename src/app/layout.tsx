import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";

const TOAST_DURATION_MS = 4000;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // ダークモード切替時の表示ずれを防ぐための設定
    <html lang="ja" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>
          {children}

          <Toaster
            position="top-center"
            richColors
            closeButton
            toastOptions={{
              duration: TOAST_DURATION_MS,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
