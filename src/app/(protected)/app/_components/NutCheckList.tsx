"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ActionResult, Nut } from "@/lib/types";
import { skipToday, upsertDailyLog } from "../actions";

type NutCheckListProps = {
  nuts: Nut[];
  selectedNutIds: Array<number | string>;
  date: string;
  isSkipped: boolean;
};

type NutScoreKey =
  | "score_antioxidant"
  | "score_mineral"
  | "score_fiber"
  | "score_vitamin";

type NutTagDefinition = {
  key: NutScoreKey;
  label: string;
};

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DEFAULT_SUCCESS_MESSAGE_DURATION_MS = 2000;
const DEFAULT_ERROR_MESSAGE_DURATION_MS = 2500;

const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

const SAVE_UNEXPECTED_ERROR_MESSAGE = "予期せぬエラーが発生しました";
const SKIP_UNEXPECTED_ERROR_MESSAGE = "スキップ処理中にエラーが発生しました";
const SKIP_ONLY_TODAY_MESSAGE = "スキップは今日のみ可能です";

const MINI_NUT_IMAGE_MAP: Record<string, string> = {
  アーモンド: "/nuts/mini-almond.png",
  くるみ: "/nuts/mini-walnuts.png",
  カシューナッツ: "/nuts/mini-cashew.png",
  ピスタチオ: "/nuts/mini-pistachio.png",
  マカダミアナッツ: "/nuts/mini-macadamia.png",
  ヘーゼルナッツ: "/nuts/mini-hazel.png",
};

const NUT_TAG_DEFINITIONS: NutTagDefinition[] = [
  { key: "score_antioxidant", label: "抗酸化が強い" },
  { key: "score_vitamin", label: "ビタミン豊富" },
  { key: "score_fiber", label: "食物繊維" },
  { key: "score_mineral", label: "ミネラル" },
];

function normalizeNutName(name: string): string {
  return name.replace(/\s+/g, "").trim();
}

function getTopTag(nut: Nut): string {
  let bestTag = NUT_TAG_DEFINITIONS[0];
  let highestScore = nut[bestTag.key] ?? 0;

  for (const tagDefinition of NUT_TAG_DEFINITIONS) {
    const score = nut[tagDefinition.key] ?? 0;

    if (score > highestScore) {
      bestTag = tagDefinition;
      highestScore = score;
    }
  }

  return highestScore <= 0 ? "バランス" : bestTag.label;
}

function getJstTodayYmd(): string {
  const jstNow = new Date(Date.now() + JST_OFFSET_MS);
  return jstNow.toISOString().slice(0, 10);
}

function parseYmd(ymd: string): Date {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatJaLabel(ymd: string): string {
  const date = parseYmd(ymd);

  return `${date.getMonth() + 1}/${date.getDate()}（${WEEKDAYS_JA[date.getDay()]}）`;
}

function toNumericNutIds(nutIds: Array<number | string>): number[] {
  return nutIds
    .map((value) => (typeof value === "string" ? Number(value) : value))
    .filter(Number.isFinite);
}

function buildDateQueryPath(ymd: string): string {
  return `/app?date=${ymd}`;
}

function getPreviousDayYmd(baseYmd: string): string {
  const previousDate = parseYmd(baseYmd);
  previousDate.setDate(previousDate.getDate() - 1);
  return formatYmd(previousDate);
}

function getNextDayYmd(baseYmd: string): string {
  const nextDate = parseYmd(baseYmd);
  nextDate.setDate(nextDate.getDate() + 1);
  return formatYmd(nextDate);
}

export default function NutCheckList({
  nuts,
  selectedNutIds,
  date,
  isSkipped,
}: NutCheckListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initialSelectedNutIds = useMemo(
    () => toNumericNutIds(selectedNutIds),
    [selectedNutIds],
  );

  const [selected, setSelected] = useState<number[]>(initialSelectedNutIds);

  useEffect(() => {
    setSelected(initialSelectedNutIds);
  }, [initialSelectedNutIds, date]);

  useEffect(() => {
    setResult(null);

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, [date]);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  function showResultTemporarily(
    actionResult: ActionResult,
    durationMs: number,
  ): void {
    setResult(actionResult);

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }

    hideTimerRef.current = setTimeout(() => {
      setResult(null);
    }, durationMs);
  }

  function toggleSelection(nutId: number): void {
    setSelected((previousSelected) =>
      previousSelected.includes(nutId)
        ? previousSelected.filter((id) => id !== nutId)
        : [...previousSelected, nutId],
    );
  }

  function moveToPreviousDay(): void {
    router.push(buildDateQueryPath(getPreviousDayYmd(date)));
  }

  function moveToNextDay(): void {
    router.push(buildDateQueryPath(getNextDayYmd(date)));
  }

  async function runActionWithFeedback(
    action: () => Promise<ActionResult>,
    unexpectedErrorMessage: string,
  ): Promise<void> {
    setResult(null);

    startTransition(async () => {
      try {
        const actionResult = await action();

        if (actionResult.success) {
          showResultTemporarily(
            actionResult,
            DEFAULT_SUCCESS_MESSAGE_DURATION_MS,
          );
          router.refresh();
          return;
        }

        showResultTemporarily(actionResult, DEFAULT_ERROR_MESSAGE_DURATION_MS);
      } catch (error) {
        console.error("NutCheckList action failed:", error);
        showResultTemporarily(
          { success: false, message: unexpectedErrorMessage },
          DEFAULT_ERROR_MESSAGE_DURATION_MS,
        );
      }
    });
  }

  function handleSaveSelection(): void {
    void runActionWithFeedback(
      () => upsertDailyLog(date, selected),
      SAVE_UNEXPECTED_ERROR_MESSAGE,
    );
  }

  function handleSkipToday(): void {
    if (!isToday) {
      showResultTemporarily(
        { success: false, message: SKIP_ONLY_TODAY_MESSAGE },
        DEFAULT_ERROR_MESSAGE_DURATION_MS,
      );
      return;
    }

    void runActionWithFeedback(
      () => skipToday(date),
      SKIP_UNEXPECTED_ERROR_MESSAGE,
    );
  }

  const todayYmd = getJstTodayYmd();
  const isToday = date === todayYmd;
  const isNextDisabled = date >= todayYmd;
  const isSkipDisabled = isPending || !isToday;
  const showSkipHighlighted = isSkipped && selected.length === 0;

  return (
    <div className="rounded-xl bg-card p-5 shadow-sm">
      <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex justify-start">
          <button
            type="button"
            onClick={moveToPreviousDay}
            disabled={isPending}
            className={[
              "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold",
              "border border-border bg-[#FAFAF8] text-[#2F5D4A] shadow-sm",
              "transition-all hover:bg-white hover:shadow-md",
              "dark:bg-muted dark:text-card-foreground dark:hover:bg-card",
              isPending ? "cursor-not-allowed opacity-60" : "",
            ].join(" ")}
            aria-label="前日へ"
          >
            ← 前日
          </button>
        </div>

        <div className="text-center">
          <div className="text-xl font-bold leading-tight text-card-foreground">
            {formatJaLabel(date)}の記録
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={moveToNextDay}
            disabled={isPending || isNextDisabled}
            className={[
              "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold",
              "border border-border bg-[#FAFAF8] text-[#2F5D4A] shadow-sm",
              "transition-all hover:bg-white hover:shadow-md",
              "dark:bg-muted dark:text-card-foreground dark:hover:bg-card",
              isPending || isNextDisabled
                ? "cursor-not-allowed opacity-60"
                : "",
            ].join(" ")}
            aria-label="翌日へ"
          >
            翌日 →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {nuts.map((nut) => {
          const nutId = nut.id;
          const isChecked = selected.includes(nutId);
          const normalizedNutName = normalizeNutName(nut.name);
          const miniImageSrc = MINI_NUT_IMAGE_MAP[normalizedNutName];

          return (
            <label
              key={nutId}
              className={[
                "cursor-pointer rounded-2xl border p-3",
                "will-change-transform transition-all duration-200 ease-out",
                "active:translate-y-0 active:shadow-[0_10px_18px_rgba(0,0,0,0.10)]",
                "hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(0,0,0,0.12)]",
                "hover:ring-1 hover:ring-black/5 dark:hover:ring-white/10",
                isChecked
                  ? [
                      "border-secondary/50 bg-secondary/40",
                      "shadow-[0_10px_18px_rgba(0,0,0,0.08)]",
                      "hover:shadow-[0_20px_44px_rgba(0,0,0,0.14)]",
                    ].join(" ")
                  : "border-border/70 bg-card hover:bg-muted",
                isPending
                  ? "pointer-events-none cursor-not-allowed opacity-70"
                  : "",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <div className="relative mt-1">
                  <input
                    id={`nut-${nutId}`}
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSelection(nutId)}
                    disabled={isPending}
                    className="peer sr-only"
                  />

                  <div
                    className={[
                      "h-6 w-6 rounded-md border-2",
                      "bg-card border-secondary ring-1 ring-card/60",
                      "transition-all duration-200",
                      "shadow-[0_2px_0_rgba(0,0,0,0.12)]",
                      "hover:-translate-y-0.5 hover:scale-110 hover:shadow-[0_6px_12px_rgba(0,0,0,0.14)]",
                      "peer-checked:border-accent peer-checked:bg-accent",
                      "peer-checked:shadow-[inset_0_2px_0_rgba(255,255,255,0.35),0_2px_0_rgba(0,0,0,0.12)]",
                      "peer-focus-visible:ring-2 peer-focus-visible:ring-ring/70 peer-focus-visible:ring-offset-2",
                    ].join(" ")}
                  />

                  {isChecked && (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {miniImageSrc ? (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
                    <Image
                      src={miniImageSrc}
                      alt={nut.name}
                      fill
                      sizes="56px"
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border/80 bg-muted">
                    <span className="text-[10px] text-muted-foreground">
                      no img
                    </span>
                  </div>
                )}

                <div className="min-w-0">
                  <h3 className="text-sm font-semibold leading-5 text-card-foreground">
                    {nut.name}
                  </h3>

                  <div className="mt-1">
                    <span
                      className={[
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        isChecked
                          ? "border-secondary/40 bg-secondary/40 text-[#2F5D4A] dark:text-card-foreground"
                          : "border-border bg-[#FAFAF8] text-[#2F5D4A] dark:bg-muted dark:text-card-foreground",
                      ].join(" ")}
                    >
                      {getTopTag(nut)}
                    </span>
                  </div>
                </div>
              </div>
            </label>
          );
        })}
      </div>

      <div className="mt-6 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleSkipToday}
            disabled={isSkipDisabled}
            title={!isToday ? SKIP_ONLY_TODAY_MESSAGE : undefined}
            className={[
              "rounded-2xl px-4 py-3 font-semibold",
              "transition-all duration-200 ease-out",
              "hover:-translate-y-1 active:translate-y-0",
              "disabled:cursor-not-allowed disabled:opacity-60",
              showSkipHighlighted
                ? [
                    "border border-[#E6D9A8]",
                    "bg-gradient-to-b from-[#FFF1B8] via-[#FFE08A] to-[#F7C948]",
                    "text-[#6B4E00]",
                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_6px_14px_rgba(0,0,0,0.12)]",
                    "hover:bg-gradient-to-b hover:from-[#FFE7A0] hover:via-[#FFD36A] hover:to-[#F0B83C]",
                    "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_10px_18px_rgba(0,0,0,0.14)]",
                  ].join(" ")
                : [
                    "border border-border bg-card text-card-foreground",
                    "shadow-sm hover:shadow-md",
                  ].join(" "),
            ].join(" ")}
          >
            今日は食べなかった
          </button>

          <button
            type="button"
            onClick={handleSaveSelection}
            disabled={isPending || selected.length === 0}
            className={[
              "rounded-2xl px-4 py-3 font-semibold text-white",
              "bg-gradient-to-b from-[#FBE38E] via-[#F4B24E] to-[#E98A3F]",
              "ring-1 ring-white/35",
              "transition-all duration-200 ease-out",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_8px_0_rgba(0,0,0,0.08),0_14px_24px_rgba(0,0,0,0.10)]",
              "hover:-translate-y-1 hover:scale-[1.02]",
              "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_12px_0_rgba(0,0,0,0.12),0_24px_40px_rgba(0,0,0,0.14)]",
              "active:translate-y-1 active:scale-[0.99]",
              "active:shadow-[inset_0_2px_6px_rgba(0,0,0,0.18),0_4px_0_rgba(0,0,0,0.18),0_10px_18px_rgba(0,0,0,0.14)]",
              "disabled:from-[#B9B9B9] disabled:via-[#AFAFAF] disabled:to-[#9B9B9B]",
              "disabled:cursor-not-allowed disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:scale-100",
            ].join(" ")}
          >
            {isPending ? "保存中..." : "保存する"}
          </button>
        </div>

        {result && (
          <div
            className={[
              "rounded-xl border p-3 text-center text-sm shadow-sm",
              result.success
                ? "border-secondary/40 bg-secondary/30 text-primary"
                : "border-red-200/80 bg-red-100/40 text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400",
            ].join(" ")}
          >
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
}
