"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import {
  GROWTH_ICONS,
  getGrowthProgress,
  getCharacterIdByMonth,
  getCharacterImageSrc,
  type GrowthStage,
} from "@/lib/domain/growth";

interface CharacterStreakProps {
  streak: number; // 今月の連続記録日数
  recordDays: number; // 今月の記録日数
  baseDate: string; // YYYY-MM-DD（表示中の日付）
}

function parseYmd(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * ステージに応じた背景グラデーションを返す
 */
function getStageBackground(stage: GrowthStage): string {
  const backgrounds: Record<GrowthStage, string> = {
    1: "from-[#F8F7F5] via-[#F5F4F2] to-[#EFEEEC]", // 淡いベージュ
    2: "from-[#F5F9F7] via-[#EFF5F2] to-[#E8F0EB]", // うすいミントグリーン
    3: "from-[#F2F8F5] via-[#E8F3ED] to-[#DEF0E6]", // ライトグリーン
    4: "from-[#EEF7F3] via-[#E2F2E9] to-[#D4ECDF]", // グリーン
    5: "from-[#E8F5EF] via-[#D8EDE3] to-[#C8E6D6]", // 深いグリーン
  };
  return backgrounds[stage];
}

/**
 * 進化フラッシュの色を返す
 */
function getFlashColor(stage: GrowthStage): string {
  const colors: Record<GrowthStage, string> = {
    1: "bg-amber-200/60",
    2: "bg-emerald-200/60",
    3: "bg-teal-200/60",
    4: "bg-cyan-200/60",
    5: "bg-yellow-300/70",
  };
  return colors[stage];
}

type EvoPhase = "idle" | "holdOld" | "fade" | "settle";

export default function CharacterStreak({
  streak,
  recordDays,
  baseDate,
}: CharacterStreakProps) {
  // 成長ステージ計算
  const { stage, isMaxStage, remainingDays, progressPct, nextThreshold } =
    getGrowthProgress(recordDays);

  // 表示中の月でキャラ切替
  const month = parseYmd(baseDate).getMonth() + 1;
  const characterId = getCharacterIdByMonth(month);

  // 前回値を保持（進化検知用）
  const prevStageRef = useRef<GrowthStage | null>(null);
  const prevRecordDaysRef = useRef<number | null>(null);
  const isInitialMount = useRef(true);

  // 演出状態
  const [phase, setPhase] = useState<EvoPhase>("idle");
  const [fromStage, setFromStage] = useState<GrowthStage>(stage);
  const [toStage, setToStage] = useState<GrowthStage>(stage);
  const [showFlash, setShowFlash] = useState(false);
  const [iconSparkle, setIconSparkle] = useState(false);

  const isEvolving = phase !== "idle";

  useEffect(() => {
    // 初回マウント時：演出なし
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevStageRef.current = stage;
      prevRecordDaysRef.current = recordDays;
      setFromStage(stage);
      setToStage(stage);
      setPhase("idle");
      return;
    }

    const prevStage = prevStageRef.current;
    const prevRecordDays = prevRecordDaysRef.current;

    const recordDaysIncreased =
      prevRecordDays === null ? true : recordDays > prevRecordDays;

    if (prevStage !== null && stage > prevStage && recordDaysIncreased) {
      // 演出：旧ステージを見せて → フラッシュ → クロスフェード → 余韻
      setFromStage(prevStage);
      setToStage(stage);
      setIconSparkle(false);

      setPhase("holdOld");
      const t1 = window.setTimeout(() => {
        setShowFlash(true);
        setPhase("fade");
      }, 260);

      const t2 = window.setTimeout(() => {
        setIconSparkle(true);
      }, 520);

      const t3 = window.setTimeout(() => {
        setShowFlash(false);
      }, 980);

      const t4 = window.setTimeout(() => {
        setPhase("settle");
      }, 900);

      const t5 = window.setTimeout(() => {
        setPhase("idle");
        setIconSparkle(false);
      }, 1500);

      prevStageRef.current = stage;
      prevRecordDaysRef.current = recordDays;

      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
        window.clearTimeout(t3);
        window.clearTimeout(t4);
        window.clearTimeout(t5);
      };
    }

    // ステージが下がった・変わらない/recordDaysが増えてない：通常更新
    prevStageRef.current = stage;
    prevRecordDaysRef.current = recordDays;

    setFromStage(stage);
    setToStage(stage);
    setPhase("idle");
    setShowFlash(false);
    setIconSparkle(false);
  }, [stage, recordDays]);

  const stageForBackground = phase === "holdOld" ? fromStage : toStage;

  const bgGradient = getStageBackground(stageForBackground);
  const flashColor = getFlashColor(stage);

  const fromSrc = getCharacterImageSrc(characterId, fromStage);
  const toSrc = getCharacterImageSrc(characterId, toStage);

  // A) 2枚重ねのクロスフェード
  const fromOpacity = phase === "holdOld" ? 1 : 0;
  const toOpacity = phase === "holdOld" ? 0 : 1;

  const iconStage = isEvolving ? toStage : stage;

  return (
    <div className="px-4 py-4">
      <div className="flex flex-col items-center gap-4">
        {/* キャラクター表示エリア */}
        <div
          className={`
            relative w-full max-w-[280px] aspect-[3/4]
            bg-gradient-to-b ${bgGradient}
            rounded-2xl shadow-sm border border-[#E8E8E6] overflow-hidden
            transition-all duration-500
          `}
        >
          {/* ビネット（四隅を落として中央に視線誘導） */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(120% 95% at 50% 40%, rgba(255,255,255,0.0) 0%, rgba(0,0,0,0.05) 62%, rgba(0,0,0,0.12) 100%)",
            }}
          />

          {/* 進化フラッシュエフェクト */}
          {showFlash && (
            <div
              className={`
                absolute inset-0 z-20 rounded-2xl
                ${flashColor}
                animate-evolution-flash
              `}
            />
          )}

          {/* キャラクター画像（2枚重ね：旧→新をクロスフェード） */}
          <div className="absolute inset-0 p-4">
            <div className="relative w-full h-full">
              <div
                className={`
                  absolute left-1/2 bottom-[14%] -translate-x-1/2
                  w-[62%] h-[10%]
                  rounded-full
                  blur-[14px]
                  bg-black/15
                  opacity-60
                  transition-all duration-500
                  ${phase === "fade" || phase === "settle" ? "scale-105 opacity-70" : "scale-100 opacity-60"}
                `}
              />

              {/* 旧ステージ */}
              <div
                className={`
                  absolute inset-0
                  transition-opacity duration-700
                  ${!isEvolving ? "animate-character-breathe" : ""}
                `}
                style={{ opacity: fromOpacity }}
              >
                <Image
                  src={fromSrc}
                  alt="ナッツキャラクター（前）"
                  fill
                  sizes="(max-width: 768px) 70vw, 280px"
                  className="object-contain drop-shadow-md"
                  priority
                />
              </div>

              {/* 新ステージ */}
              <div
                className={`
                  absolute inset-0
                  transition-opacity duration-700
                  ${!isEvolving ? "animate-character-breathe" : ""}
                  ${phase === "settle" ? "animate-evolution-pop" : ""}
                `}
                style={{ opacity: toOpacity }}
              >
                <Image
                  src={toSrc}
                  alt="ナッツキャラクター（後）"
                  fill
                  sizes="(max-width: 768px) 70vw, 280px"
                  className="object-contain drop-shadow-md"
                  priority
                />
              </div>
            </div>
          </div>

          {/* ステージ背景のノイズ */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* 成長アイコン */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-0.5 text-lg">
            {GROWTH_ICONS.map((icon, index) => {
              const filled = index < iconStage;
              const isNewlyFilled = iconSparkle && index === iconStage - 1;

              return (
                <span
                  key={index}
                  className={`
                    transition-all duration-300
                    ${filled ? "opacity-100 scale-100" : "opacity-25 scale-90 grayscale"}
                    ${isNewlyFilled ? "animate-icon-sparkle" : ""}
                  `}
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

        {/* 次の成長までカード */}
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

            <div
              className={`
                shrink-0 text-xs font-semibold text-[#4B5563]
                bg-[#F7F7F5] border border-[#EEEDE9] rounded-full px-2 py-1
                transition-all duration-300
                ${isEvolving ? "bg-emerald-100 text-emerald-700 border-emerald-200" : ""}
              `}
            >
              {progressPct}%
            </div>
          </div>

          <div className="mt-3 h-3 w-full rounded-full bg-[#F2F2EF] border border-[#ECEBE6] overflow-hidden">
            <div
              className={`
                h-full rounded-full shadow-[inset_0_-1px_0_rgba(255,255,255,0.35)]
                transition-all duration-500
                ${
                  isMaxStage
                    ? "bg-gradient-to-r from-[#34D399] to-[#10B981]"
                    : "bg-gradient-to-r from-[#7DD3FC] to-[#60A5FA]"
                }
              `}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {!isMaxStage && (
            <div className="mt-2 text-center text-[11px] text-[#777]">
              現在{" "}
              <span className="font-semibold text-[#333]">{recordDays}</span> /{" "}
              <span className="font-semibold text-[#333]">{nextThreshold}</span>{" "}
              日（今月）
            </div>
          )}
        </div>

        {/* 連続記録カード */}
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
              <span>現在の連続記録日数（今月）</span>
            </div>

            <div className="text-sm font-medium text-[#333]">
              継続
              <span className="ml-2 text-lg font-bold text-[#E05A4A]">
                {streak}
              </span>
              <span className="ml-1 text-sm font-semibold text-[#E05A4A]">
                日目
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
