"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  GROWTH_ICONS,
  getCharacterIdByMonth,
  getCharacterImageSrc,
  getGrowthProgress,
  type GrowthStage,
} from "@/lib/domain/growth";

type CharacterStreakProps = {
  /** 今月の連続記録日数 */
  streak: number;
  /** 今月の記録日数 */
  recordDays: number;
  /** YYYY-MM-DD */
  baseDate: string;
};

type EvolutionPhase = "idle" | "holdOld" | "fade" | "settle";

const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

const CARD_MAX_WIDTH_CLASS = "max-w-[280px]";

const HOLD_OLD_DURATION_MS = 260;
const FLASH_START_DURATION_MS = 520;
const SETTLE_START_DURATION_MS = 900;
const FLASH_END_DURATION_MS = 980;
const EVOLUTION_END_DURATION_MS = 1500;

const STAGE_BACKGROUND_CLASS: Record<GrowthStage, string> = {
  1: "from-[#F8F7F5] via-[#F5F4F2] to-[#EFEEEC]",
  2: "from-[#F5F9F7] via-[#EFF5F2] to-[#E8F0EB]",
  3: "from-[#F2F8F5] via-[#E8F3ED] to-[#DEF0E6]",
  4: "from-[#EEF7F3] via-[#E2F2E9] to-[#D4ECDF]",
  5: "from-[#E8F5EF] via-[#D8EDE3] to-[#C8E6D6]",
};

const STAGE_FLASH_CLASS: Record<GrowthStage, string> = {
  1: "bg-amber-200/60",
  2: "bg-emerald-200/60",
  3: "bg-teal-200/60",
  4: "bg-cyan-200/60",
  5: "bg-yellow-300/70",
};

function parseYmd(ymd: string): Date {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getStageBackgroundClass(stage: GrowthStage): string {
  return STAGE_BACKGROUND_CLASS[stage];
}

function getStageFlashClass(stage: GrowthStage): string {
  return STAGE_FLASH_CLASS[stage];
}

function shouldPlayEvolution(
  previousStage: GrowthStage | null,
  currentStage: GrowthStage,
  previousRecordDays: number | null,
  currentRecordDays: number,
): boolean {
  if (previousStage === null) {
    return false;
  }

  const hasStageIncreased = currentStage > previousStage;
  const hasRecordDaysIncreased =
    previousRecordDays === null ? true : currentRecordDays > previousRecordDays;

  return hasStageIncreased && hasRecordDaysIncreased;
}

export default function CharacterStreak({
  streak,
  recordDays,
  baseDate,
}: CharacterStreakProps) {
  const { stage, isMaxStage, remainingDays, progressPct, nextThreshold } =
    getGrowthProgress(recordDays);

  const displayMonth = parseYmd(baseDate).getMonth() + 1;
  const characterId = getCharacterIdByMonth(displayMonth);

  const previousStageRef = useRef<GrowthStage | null>(null);
  const previousRecordDaysRef = useRef<number | null>(null);
  const isInitialMountRef = useRef(true);

  const [phase, setPhase] = useState<EvolutionPhase>("idle");
  const [fromStage, setFromStage] = useState<GrowthStage>(stage);
  const [toStage, setToStage] = useState<GrowthStage>(stage);
  const [showFlash, setShowFlash] = useState(false);
  const [showIconSparkle, setShowIconSparkle] = useState(false);

  const isEvolving = phase !== "idle";

  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      previousStageRef.current = stage;
      previousRecordDaysRef.current = recordDays;
      setFromStage(stage);
      setToStage(stage);
      setPhase("idle");
      return;
    }

    const previousStage = previousStageRef.current;
    const previousRecordDays = previousRecordDaysRef.current;

    if (
      shouldPlayEvolution(previousStage, stage, previousRecordDays, recordDays)
    ) {
      setFromStage(previousStage as GrowthStage);
      setToStage(stage);
      setShowIconSparkle(false);
      setPhase("holdOld");

      const holdOldTimer = window.setTimeout(() => {
        setShowFlash(true);
        setPhase("fade");
      }, HOLD_OLD_DURATION_MS);

      const sparkleTimer = window.setTimeout(() => {
        setShowIconSparkle(true);
      }, FLASH_START_DURATION_MS);

      const settleTimer = window.setTimeout(() => {
        setPhase("settle");
      }, SETTLE_START_DURATION_MS);

      const hideFlashTimer = window.setTimeout(() => {
        setShowFlash(false);
      }, FLASH_END_DURATION_MS);

      const finishEvolutionTimer = window.setTimeout(() => {
        setPhase("idle");
        setShowIconSparkle(false);
      }, EVOLUTION_END_DURATION_MS);

      previousStageRef.current = stage;
      previousRecordDaysRef.current = recordDays;

      return () => {
        window.clearTimeout(holdOldTimer);
        window.clearTimeout(sparkleTimer);
        window.clearTimeout(settleTimer);
        window.clearTimeout(hideFlashTimer);
        window.clearTimeout(finishEvolutionTimer);
      };
    }

    previousStageRef.current = stage;
    previousRecordDaysRef.current = recordDays;
    setFromStage(stage);
    setToStage(stage);
    setPhase("idle");
    setShowFlash(false);
    setShowIconSparkle(false);
  }, [recordDays, stage]);

  const backgroundStage = phase === "holdOld" ? fromStage : toStage;
  const backgroundGradientClass = getStageBackgroundClass(backgroundStage);
  const flashClass = getStageFlashClass(stage);

  const previousCharacterImageSrc = getCharacterImageSrc(
    characterId,
    fromStage,
  );
  const currentCharacterImageSrc = getCharacterImageSrc(characterId, toStage);

  const previousImageOpacity = phase === "holdOld" ? 1 : 0;
  const currentImageOpacity = phase === "holdOld" ? 0 : 1;

  const iconStage = isEvolving ? toStage : stage;

  return (
    <div className="px-4 py-4">
      <div className="flex flex-col items-center gap-4">
        <div
          className={`
            relative aspect-[3/4] w-full ${CARD_MAX_WIDTH_CLASS}
            overflow-hidden rounded-2xl border border-border
            bg-gradient-to-b ${backgroundGradientClass}
            shadow-sm transition-all duration-500
          `}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 95% at 50% 40%, rgba(255,255,255,0.0) 0%, rgba(0,0,0,0.05) 62%, rgba(0,0,0,0.12) 100%)",
            }}
          />

          {showFlash && (
            <div
              className={`
                absolute inset-0 z-20 rounded-2xl
                ${flashClass}
                animate-evolution-flash
              `}
            />
          )}

          <div className="absolute inset-0 p-4">
            <div className="relative h-full w-full">
              <div
                className={`
                  absolute bottom-[14%] left-1/2 h-[10%] w-[62%] -translate-x-1/2
                  rounded-full bg-black/15 blur-[14px]
                  transition-all duration-500
                  ${
                    phase === "fade" || phase === "settle"
                      ? "scale-105 opacity-70"
                      : "scale-100 opacity-60"
                  }
                `}
              />

              <div
                className={`
                  absolute inset-0 transition-opacity duration-700
                  ${!isEvolving ? "animate-character-breathe" : ""}
                `}
                style={{ opacity: previousImageOpacity }}
              >
                <Image
                  src={previousCharacterImageSrc}
                  alt="ナッツキャラクター（前のステージ）"
                  fill
                  sizes="(max-width: 768px) 70vw, 280px"
                  className="object-contain drop-shadow-md"
                  priority
                />
              </div>

              <div
                className={`
                  absolute inset-0 transition-opacity duration-700
                  ${!isEvolving ? "animate-character-breathe" : ""}
                  ${phase === "settle" ? "animate-evolution-pop" : ""}
                `}
                style={{ opacity: currentImageOpacity }}
              >
                <Image
                  src={currentCharacterImageSrc}
                  alt="ナッツキャラクター（現在のステージ）"
                  fill
                  sizes="(max-width: 768px) 70vw, 280px"
                  className="object-contain drop-shadow-md"
                  priority
                />
              </div>
            </div>
          </div>

          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
            }}
          />
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-0.5 text-lg">
            {GROWTH_ICONS.map((icon, index) => {
              const isFilled = index < iconStage;
              const isNewlyFilled = showIconSparkle && index === iconStage - 1;

              return (
                <span
                  key={`${icon}-${index}`}
                  className={`
            transition-all duration-300
            ${
              isFilled
                ? "scale-100 opacity-100"
                : "scale-90 opacity-25 grayscale"
            }
            ${isNewlyFilled ? "animate-icon-sparkle" : ""}
          `}
                >
                  {icon}
                </span>
              );
            })}
          </div>

          <div className="mt-1 space-y-1 text-center leading-tight">
            <div className="text-xs font-medium text-muted-foreground">
              記録を増やして、キャラを育てよう
            </div>

            <div className="text-[11px] text-muted-foreground">
              今月の成長カウント（記録）：
              <span className="ml-1 font-semibold text-card-foreground">
                {recordDays}
              </span>
              日
            </div>
          </div>
        </div>

        <div
          className={`w-full ${CARD_MAX_WIDTH_CLASS} rounded-2xl border border-[#EDEDED] bg-white/80 p-4 shadow-sm`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-center text-sm font-semibold text-[#333]">
                {isMaxStage ? "最大まで成長しました" : "次の成長まで"}
              </div>

              <div className="mt-2 text-center text-xs leading-relaxed text-[#666]">
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
                shrink-0 rounded-full border px-2 py-1 text-xs font-semibold
                transition-all duration-300
                ${
                  isEvolving
                    ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                    : "border-[#EEEDE9] bg-[#F7F7F5] text-[#4B5563]"
                }
              `}
            >
              {progressPct}%
            </div>
          </div>

          <div className="mt-3 h-3 w-full overflow-hidden rounded-full border border-[#ECEBE6] bg-[#F2F2EF]">
            <div
              className={`
                h-full rounded-full
                shadow-[inset_0_-1px_0_rgba(255,255,255,0.35)]
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

        <div
          className={`w-full ${CARD_MAX_WIDTH_CLASS} rounded-2xl border border-[#F0E8E6] bg-white/80 px-4 py-3 shadow-sm`}
        >
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
                    clipRule="evenodd"
                    d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
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
