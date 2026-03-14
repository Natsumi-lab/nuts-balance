"use client";

import Image from "next/image";
import {
  GROWTH_ICONS,
  getGrowthProgress,
  getCharacterIdByMonth,
  getCharacterImageSrc,
  type GrowthStage,
} from "@/lib/domain/growth";

type MonthlyCharacterProps = {
  /** その月の記録日数（累計ではない） */
  recordDays: number;
  /** 対象月（1-12） */
  month: number;
  /** 月内最大ストリーク */
  maxStreak: number;
};

const STAGE_BACKGROUNDS: Record<GrowthStage, string> = {
  1: "from-[#F8F7F5] via-[#F5F4F2] to-[#EFEEEC]",
  2: "from-[#F5F9F7] via-[#EFF5F2] to-[#E8F0EB]",
  3: "from-[#F2F8F5] via-[#E8F3ED] to-[#DEF0E6]",
  4: "from-[#EEF7F3] via-[#E2F2E9] to-[#D4ECDF]",
  5: "from-[#E8F5EF] via-[#D8EDE3] to-[#C8E6D6]",
};

/**
 * ステージ背景グラデーション
 */
function getStageBackground(stage: GrowthStage) {
  return STAGE_BACKGROUNDS[stage];
}

export default function MonthlyCharacter({
  recordDays,
  month,
  maxStreak,
}: MonthlyCharacterProps) {
  const { stage, isMaxStage, remainingDays, progressPct, nextThreshold } =
    getGrowthProgress(recordDays);

  const characterId = getCharacterIdByMonth(month);
  const imageSrc = getCharacterImageSrc(characterId, stage);
  const bgGradient = getStageBackground(stage);

  return (
    <div className="px-4 py-4">
      <div className="flex flex-col items-center gap-4">
        {/* キャラクター */}
        <div
          className={`
            relative aspect-[3/4] w-full max-w-[280px]
            overflow-hidden rounded-2xl border border-[#E8E8E6]
            bg-gradient-to-b ${bgGradient}
            shadow-sm transition-all duration-500
          `}
        >
          {/* ビネット */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 95% at 50% 40%, rgba(255,255,255,0.0) 0%, rgba(0,0,0,0.05) 62%, rgba(0,0,0,0.12) 100%)",
            }}
          />

          <div className="absolute inset-0 p-4">
            <div className="relative h-full w-full">
              {/* 接地影 */}
              <div
                className="
                  absolute left-1/2 bottom-[14%] -translate-x-1/2
                  h-[10%] w-[62%]
                  rounded-full bg-black/15
                  blur-[14px] opacity-60
                "
              />

              {/* キャラクター画像 */}
              <div className="absolute inset-0 animate-character-breathe">
                <Image
                  src={imageSrc}
                  alt="ナッツキャラクター"
                  fill
                  sizes="(max-width: 768px) 70vw, 280px"
                  className="object-contain drop-shadow-md"
                  priority
                />
              </div>
            </div>
          </div>

          {/* ノイズ */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* 成長アイコン */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-0.5 text-lg">
            {GROWTH_ICONS.map((icon, iconIndex) => {
              const filled = iconIndex < stage;

              return (
                <span
                  key={iconIndex}
                  className={`
                    transition-all duration-300
                    ${
                      filled
                        ? "opacity-100 scale-100"
                        : "opacity-25 scale-90 grayscale"
                    }
                  `}
                >
                  {icon}
                </span>
              );
            })}
          </div>

          <div className="mt-1 text-center leading-tight">
            <div className="text-xs font-medium text-[#555]">今月の成長度</div>
            <div className="mt-1 text-[11px] text-[#777]">
              記録日数：
              <span className="ml-1 font-semibold text-[#333]">
                {recordDays}
              </span>
              日
            </div>
          </div>
        </div>

        {/* 進捗 */}
        <div className="w-full max-w-[280px] rounded-2xl border border-[#EDEDED] bg-white/80 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 text-center">
              <div className="text-sm font-semibold text-[#333]">
                {isMaxStage ? "最大成長達成！" : "次の成長まで"}
              </div>

              <div className="mt-2 text-xs leading-relaxed text-[#666]">
                {isMaxStage ? (
                  <p className="mx-auto max-w-[20ch]">
                    素晴らしい！今月は最大まで成長しました。
                  </p>
                ) : (
                  <p className="mx-auto max-w-[20ch]">
                    あと{" "}
                    <span className="font-semibold text-[#333]">
                      {remainingDays}
                    </span>{" "}
                    日の記録で成長
                  </p>
                )}
              </div>
            </div>

            <div className="shrink-0 rounded-full border border-[#EEEDE9] bg-[#F7F7F5] px-2 py-1 text-xs font-semibold text-[#4B5563]">
              {progressPct}%
            </div>
          </div>

          {/* プログレスバー */}
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full border border-[#ECEBE6] bg-[#F2F2EF]">
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
              日
            </div>
          )}
        </div>

        {/* 最大ストリーク */}
        <div className="w-full max-w-[280px] rounded-2xl border border-[#F0E8E6] bg-white/80 px-4 py-3 shadow-sm">
          <div className="flex flex-col items-center gap-1 text-center">
            <div className="flex items-center gap-2 text-xs text-[#666]">
              <span className="animate-pulse-slow text-[#E05A4A]">
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

              <span>今月の最大連続記録</span>
            </div>

            <div className="text-sm font-medium text-[#333]">
              継続
              <span className="ml-2 text-lg font-bold text-[#E05A4A]">
                {maxStreak}
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
