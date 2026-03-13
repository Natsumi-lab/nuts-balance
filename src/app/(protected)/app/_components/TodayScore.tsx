"use client";

import { useEffect, useMemo, useState } from "react";
import ScoreStars from "@/app/(protected)/_components/ScoreStars";
import type { DailyScores, ScoreKey } from "@/lib/domain/score";

export type TodayScoreProps = {
  isSaved: boolean;
  /** 例: M/D（W） */
  dateLabel?: string;
  /** 保存済みの場合に表示する5軸スコア */
  scores?: DailyScores;
  /** 保存済みの場合に表示するコメント */
  comment?: string;
  emptyMessage?: string;
};

type ScoreRow = {
  key: ScoreKey;
  label: string;
  value: number;
};

const SCORE_LABELS: Record<ScoreKey, string> = {
  antioxidant: "抗酸化",
  mineral: "ミネラル",
  fiber: "食物繊維",
  vitamin: "ビタミン",
  variety: "バラエティ",
};

const SCORE_DISPLAY_ORDER: ScoreKey[] = [
  "antioxidant",
  "mineral",
  "fiber",
  "vitamin",
  "variety",
];

const SCORE_APPEAR_ANIMATION_MS = 450;
const DEFAULT_EMPTY_MESSAGE = "保存するとスコアが表示されます";

function buildScoreRows(scores?: DailyScores): ScoreRow[] {
  return SCORE_DISPLAY_ORDER.map((scoreKey) => ({
    key: scoreKey,
    label: SCORE_LABELS[scoreKey],
    value: scores?.[scoreKey] ?? 0,
  }));
}

function getScoreTitle(dateLabel?: string): string {
  return dateLabel ? `${dateLabel} のスコア` : "今日のスコア";
}

export default function TodayScore({
  isSaved,
  dateLabel,
  scores,
  comment,
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
}: TodayScoreProps) {
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

  useEffect(() => {
    if (!isSaved) {
      setIsAnimatingIn(false);
      return;
    }

    setIsAnimatingIn(true);

    const timerId = window.setTimeout(() => {
      setIsAnimatingIn(false);
    }, SCORE_APPEAR_ANIMATION_MS);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [isSaved, dateLabel]);

  const scoreRows = useMemo(() => buildScoreRows(scores), [scores]);

  const containerClassName = [
    "rounded-2xl border border-border bg-card shadow-sm",
    "transition-all duration-300 ease-out",
    isSaved && isAnimatingIn
      ? "translate-y-2 opacity-0"
      : "translate-y-0 opacity-100",
  ].join(" ");

  return (
    <div className={containerClassName}>
      <div className="p-5">
        <div className="text-center">
          <div className="text-xl font-semibold text-card-foreground">
            {getScoreTitle(dateLabel)}
          </div>
        </div>

        {!isSaved ? (
          <div className="mt-4 rounded-xl bg-muted px-3 py-3 text-center text-sm text-card-foreground">
            {emptyMessage}
          </div>
        ) : (
          <>
            <div className="mt-5 text-center">
              <div className="inline-block min-w-[240px] space-y-2 px-4">
                {scoreRows.map((scoreRow) => (
                  <div
                    key={scoreRow.key}
                    className="flex items-center gap-2 text-left"
                  >
                    <div className="w-[72px] shrink-0 text-left text-sm font-semibold text-card-foreground">
                      {scoreRow.label}
                    </div>
                    <ScoreStars value={scoreRow.value} />
                  </div>
                ))}
              </div>
            </div>

            {comment ? (
              <div className="mt-4 rounded-xl bg-muted px-3 py-2 text-sm text-card-foreground">
                <div className="text-xs font-semibold text-muted-foreground">
                  コメント
                </div>
                <div className="mt-1">{comment}</div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
