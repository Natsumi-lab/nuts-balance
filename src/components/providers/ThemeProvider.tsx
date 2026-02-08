'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

/**
 * next-themes の ThemeProvider ラッパー
 * - attribute="class" で .dark クラスを html に付与
 * - defaultTheme="light" でライトモードをデフォルトに
 * - enableSystem=false でシステム追従を無効化
 */
export function ThemeProvider({ children }: Props) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
