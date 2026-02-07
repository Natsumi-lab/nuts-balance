"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function PublicHomePage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/auth/login");
    }, 1800);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="flex min-h-[100dvh] items-center justify-center">
      <div
        className={[
          "flex flex-col items-center opacity-0",
          "animate-[fadeIn_0.9s_ease-out_forwards]",
        ].join(" ")}
      >
        <Image
          src="/nuts/logo.png"
          alt="Nuts Balance"
          width={240}
          height={240}
          priority
          className="drop-shadow-[0_14px_28px_rgba(0,0,0,0.14)]"
        />
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(1);
          }
          to {
            opacity: 1;
            transform: scale(1.04);
          }
        }
      `}</style>
    </main>
  );
}
