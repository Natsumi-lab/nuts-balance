"use client";

import Image from "next/image";
import { getGrowthStage, type GrowthStage } from "@/lib/domain/growth";

/**
 * CharacterStreakコンポーネントのプロパティ型
 */
interface CharacterStreakProps {
  streak: number; // 連続日数（ストリーク）
  recordDays: number; // 累計記録日数
}

/**
 * 成長メーター用アイコン定義
 */
const GROWTH_ICONS = ["🌱", "🌿", "🌳", "🌳✨", "🌳🌰"];

/**
 * キャラクター＆ストリーク表示コンポーネント
 */
export default function CharacterStreak({
  streak,
  recordDays,
}: CharacterStreakProps) {
  // --- 成長ステージ判定 ---
  const stage: GrowthStage = getGrowthStage(recordDays);

  // --- キャラID（奇数 / 偶数月） ---
  const month = new Date().getMonth() + 1;
  const characterId = month % 2 === 0 ? "wl" : "al";

  // --- キャラ画像パス ---
  const imageSrc = `/nuts/${characterId}-stage${stage}.png`;

  return (
    <div className="px-5 py-6">
      {/* キャラクターエリア */}
      <div className="flex flex-col items-center">
        <div
          className="relative w-full max-w-sm mx-auto aspect-[3/4] 
          bg-[#FAFAF8] rounded-2xl shadow-sm border border-[#E6E6E4]/80 mb-3"
        >
          <div className="relative w-full h-full rounded-xl overflow-hidden">
            <Image
              src={imageSrc}
              alt="ナッツキャラクター"
              fill
              sizes="(max-width: 768px) 90vw, 320px"
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* 成長メーター */}
        <div className="mt-2 flex items-center gap-1 text-xl">
          {GROWTH_ICONS.map((icon, index) => {
            const filled = index < stage;
            return (
              <span
                key={index}
                className={filled ? "opacity-100" : "opacity-30"}
              >
                {icon}
              </span>
            );
          })}
        </div>

        <div className="mt-1 text-xs text-[#666]">
          記録 {recordDays} 日で成長中
        </div>
      </div>

      {/* ストリーク表示 */}
      <div className="mt-6 bg-white rounded-xl p-4 shadow-sm border border-[#E6E6E4]">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-[#333]">継続記録</h3>
          <div className="flex items-center gap-1">
            <span className="text-[#D84A3A]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
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
            <div className="ml-1 text-2xl font-bold text-[#D84A3A]">
              {streak} 日
            </div>
          </div>
        </div>
        <div className="mt-1 text-sm text-[#555]">
          毎日継続して健康的な習慣を育てましょう！
        </div>
      </div>
    </div>
  );
}
