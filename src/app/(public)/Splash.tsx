"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type SplashProps = {
  nextPath: string;
};

const SPLASH_DELAY_MS = 800;

export default function Splash({ nextPath }: SplashProps) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace(nextPath);
    }, SPLASH_DELAY_MS);

    return () => clearTimeout(timer);
  }, [router, nextPath]);

  return (
    <main className="flex min-h-[100dvh] items-center justify-center">
      <div className="flex flex-col items-center opacity-0 animate-[fadeIn_0.9s_ease-out_forwards]">
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
