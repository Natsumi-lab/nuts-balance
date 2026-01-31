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
    <div className="px-4 py-4">
      {/* メインエリア：キャラ中心のコンパクトなレイアウト */}
      <div className="flex flex-col items-center gap-3">
        {/* キャラクター画像 - ゆっくり浮遊するアニメーション */}
        <div className="relative w-full max-w-[280px] aspect-[3/4] bg-gradient-to-b from-[#FDFDFB] to-[#F8F8F6] rounded-2xl shadow-sm border border-[#E8E8E6]">
          <div className="absolute inset-0 flex items-center justify-center p-4">
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

        {/* 成長ステータス - キャラ直下にコンパクト配置 */}
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
          <span className="text-xs text-[#888]">
            {recordDays}日目
          </span>
        </div>

        {/* ストリーク表示 - インラインでシンプルに */}
        <div className="flex items-center gap-2 px-4 py-2 bg-white/80 rounded-full shadow-sm border border-[#F0E8E6]">
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
          <span className="text-sm font-medium text-[#333]">
            継続 <span className="text-lg font-bold text-[#E05A4A]">{streak}</span> 日
          </span>
        </div>
      </div>
    </div>
  );
}
