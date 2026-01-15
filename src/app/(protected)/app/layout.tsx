import type { ReactNode } from 'react';

export default function AppLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh">{children}</div>;
}
