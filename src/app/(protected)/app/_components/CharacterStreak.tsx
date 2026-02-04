"use client";

import Image from "next/image";
import {
  GROWTH_ICONS,
  getGrowthProgress,
  getCharacterIdByMonth,
  getCharacterImageSrc,
} from "@/lib/domain/growth";

/**
 * CharacterStreakコンポーネントのプロパティ型
 * - streak: 「連続で記録できた日数」
 * - recordDays: 「累計で記録した日数」
 */
interface CharacterStreakProps {
  streak: number; // 連続記録日数
  recordDays: number; // 累計記録日数（= 記録した回数）
}

export default function CharacterStreak({
  streak,
  recordDays,
}: CharacterStreakProps) {
  // -----------------------------
  // 1) 成長ステージ判定（累計記録日数が増えるほど成長）
  // -----------------------------
  const { stage, isMaxStage, remainingDays, progressPct, nextThreshold } =
    getGrowthProgress(recordDays);

  // -----------------------------
  // 2) キャラ切り替え（奇数/偶数月で固定）
  // -----------------------------
  const month = new Date().getMonth() + 1;
  const characterId = getCharacterIdByMonth(month);

  // -----------------------------
  // 3) キャラ画像パス
  // -----------------------------
  const imageSrc = getCharacterImageSrc(characterId, stage);

  return (
    <div className="px-4 py-4">
      {/* 全体 */}
      <div className="flex flex-col items-center gap-4">
        {/* =========================
            キャラクター画像エリア
        ========================= */}
        <div className="relative w-full max-w-[280px] aspect-[3/4] bg-gradient-to-b from-[#FDFDFB] to-[#F8F8F6] rounded-2xl shadow-sm border border-[#E8E8E6] overflow-hidden">
          <div className="absolute inset-0 p-4">
            <div className="relative w-full h-full animate-float">
              <Image
                src={imageSrc}
                alt="ナッツキャラクター"
                fill
                sizes="(max-width: 768px) 70vw, 280px"
                className="object-contain drop-shadow-sm"
                priority
              />
            </div>
          </div>
        </div>

        {/* =========================
            成長メーター + 育成の説明文
        ========================= */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-0.5 text-lg">
            {GROWTH_ICONS.map((icon, index) => {
              const filled = index < stage;
              return (
                <span
                  key={index}
                  className={`transition-all duration-300 ${
                    filled
                      ? "opacity-100 scale-100"
                      : "opacity-25 scale-90 grayscale"
                  }`}
                >
                  {icon}
                </span>
              );
            })}
          </div>

          <div className="mt-1 text-center leading-tight">
            <div className="text-xs font-medium text-[#555]">
              記録を増やして、キャラを育てよう
            </div>
            <div className="mt-1 text-[11px] text-[#777]">
              今月の成長カウント（記録）：
              <span className="ml-1 font-semibold text-[#333]">
                {recordDays}
              </span>
              日
            </div>
          </div>
        </div>

        {/* =========================
            次の成長まで
            - 進捗バー
        ========================= */}
        <div className="w-full max-w-[280px] rounded-2xl bg-white/80 border border-[#EDEDED] shadow-sm p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-center text-sm font-semibold text-[#333]">
                {isMaxStage ? "最大まで成長しました" : "次の成長まで"}
              </div>

              <div className="mt-2 text-center text-xs text-[#666] leading-relaxed">
                {isMaxStage ? (
                  <p className="mx-auto max-w-[24ch]">
                    すごい！ここが最終形です。記録を続けて、習慣をキープしましょう。
                  </p>
                ) : (
                  <p className="mx-auto max-w-[24ch]">
                    あと{" "}
                    <span className="font-semibold text-[#333]">
                      {remainingDays}
                    </span>{" "}
                    回の記録で成長します
                  </p>
                )}
              </div>
            </div>

            <div className="shrink-0 text-xs font-semibold text-[#4B5563] bg-[#F7F7F5] border border-[#EEEDE9] rounded-full px-2 py-1">
              {progressPct}%
            </div>
          </div>

          <div className="mt-3 h-3 w-full rounded-full bg-[#F2F2EF] border border-[#ECEBE6] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7DD3FC] to-[#60A5FA] shadow-[inset_0_-1px_0_rgba(255,255,255,0.35)]"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {!isMaxStage && (
            <div className="mt-2 text-center text-[11px] text-[#777]">
              現在{" "}
              <span className="font-semibold text-[#333]">{recordDays}</span> /{" "}
              <span className="font-semibold text-[#333]">{nextThreshold}</span>{" "}
              日（累計）
            </div>
          )}
        </div>

        {/* =========================
            連続記録（ストリーク）
        ========================= */}
        <div className="w-full max-w-[280px] bg-white/80 rounded-2xl shadow-sm border border-[#F0E8E6] px-4 py-3">
          <div className="flex flex-col items-center text-center gap-1">
            <div className="text-xs text-[#666] flex items-center gap-2">
              <span className="text-[#E05A4A] animate-pulse-slow">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span>連続で記録できた最大日数</span>
            </div>

            <div className="text-sm font-medium text-[#333]">
              継続
              <span className="ml-2 text-lg font-bold text-[#E05A4A]">
                {streak}
              </span>
              <span className="ml-1 text-sm font-semibold text-[#E05A4A]">
                日
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
