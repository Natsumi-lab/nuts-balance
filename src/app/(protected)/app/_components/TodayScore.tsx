"use client";

import { useEffect, useState } from "react";

export type TodayScoreProps = {
  show: boolean;
  stars: number; // 0〜5
};

/**
 * 今日のスコア（★0〜5）
 * - show=false のときは非表示（高さ0で畳む）
 * - show=true のとき「ふわっと出現」
 */
export default function TodayScore({ show, stars }: TodayScoreProps) {
  // show=true になった瞬間のアニメ用（mount直後に少しだけ遅らせる）
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!show) {
      setMounted(false);
      return;
    }
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, [show]);

  const clamped = Math.max(0, Math.min(5, stars));

  return (
    <div
      className={[
        "overflow-hidden rounded-2xl border border-[#E6E6E4] bg-[#FAFAF8] shadow-sm",
        "transition-all duration-300 ease-out",
        show && mounted
          ? "max-h-40 opacity-100 translate-y-0"
          : "max-h-0 opacity-0 -translate-y-1",
      ].join(" ")}
      aria-hidden={!show}
    >
      <div className="p-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-sm font-semibold text-[#333]">
              今日のスコア
            </div>
            <div className="mt-1 text-xs text-[#6B7F75]">
              保存済みの場合のみ表示
            </div>
          </div>
          <div className="text-xs text-[#6B7F75]">総合</div>
        </div>

        <div className="mt-3 flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={[
                "text-base leading-none",
                i < clamped ? "text-[#F2B705]" : "text-[#D8D8D8]",
              ].join(" ")}
              aria-hidden="true"
            >
              ★
            </span>
          ))}
          <span className="ml-2 text-sm font-medium text-[#555]">
            {clamped} / 5
          </span>
        </div>
      </div>
    </div>
  );
}
