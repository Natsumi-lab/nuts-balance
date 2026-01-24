import type { ReactNode } from "react";
import NavBar from "./app/_components/NavBar";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <NavBar />
      <main className="mx-auto w-full max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
