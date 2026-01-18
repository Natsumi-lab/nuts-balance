import type { ReactNode } from 'react';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning enables smooth dark mode toggle without hydration mismatch
    <html lang="ja" suppressHydrationWarning>
      {/* Base styles for the entire app with Tailwind utility classes */}
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
