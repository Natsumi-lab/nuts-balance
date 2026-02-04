"use client";

import { useEffect, useMemo, useState } from "react";
import ScoreStars from "@/app/(protected)/_components/ScoreStars";
import type { DailyScores, ScoreKey } from "@/lib/domain/score";

export type TodayScoreProps = {
  isSaved: boolean;
  dateLabel?: string; // 例：M/D（W）
  scores?: DailyScores; // 保存済みのみ必須
  comment?: string; // 保存済みのみ必須
  emptyMessage?: string;
};

const LABELS: Record<ScoreKey, string> = {
  antioxidant: "抗酸化",
  mineral: "ミネラル",
  fiber: "食物繊維",
  vitamin: "ビタミン",
  variety: "バラエティ",
};

export default function TodayScore({
  isSaved,
  dateLabel,
  scores,
  comment,
  emptyMessage = "保存するとスコアが表示されます",
}: TodayScoreProps) {
  // 保存済みになったタイミングでアニメ演出
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (!isSaved) {
      setAnimateIn(false);
      return;
    }
    setAnimateIn(true);
    const t = setTimeout(() => setAnimateIn(false), 450);
    return () => clearTimeout(t);
  }, [isSaved, dateLabel]);

  const rows = useMemo(() => {
    const order: ScoreKey[] = [
      "antioxidant",
      "mineral",
      "fiber",
      "vitamin",
      "variety",
    ];
    return order.map((k) => ({
      key: k,
      label: LABELS[k],
      value: scores?.[k] ?? 0,
    }));
  }, [scores]);

  return (
    <div
      className={[
        "rounded-2xl border border-[#E6E6E4] bg-white shadow-sm",
        "transition-all duration-300 ease-out",
        isSaved
          ? animateIn
            ? "opacity-0 translate-y-2"
            : "opacity-100 translate-y-0"
          : "opacity-100 translate-y-0",
      ].join(" ")}
    >
      <div className="p-5">
        {/* 見出し「M/D（W）のスコア」 */}
        <div className="text-center">
          <div className="text-xl font-semibold text-[#2F3A34]">
            {dateLabel ? `${dateLabel} のスコア` : "今日のスコア"}
          </div>
        </div>

        {!isSaved ? (
          <div className="mt-4 rounded-xl bg-[#F6F7F6] px-3 py-3 text-sm text-[#2F3A34] text-center">
            {emptyMessage}
          </div>
        ) : (
          <>
            <div className="mt-5 text-center">
              <div className="inline-block min-w-[240px] px-4 space-y-2">
                {rows.map((r) => (
                  <div
                    key={r.key}
                    className="flex items-center gap-2 text-left"
                  >
                    <div className="w-[72px] shrink-0 text-left text-sm font-semibold text-[#333]">
                      {r.label}
                    </div>
                    <ScoreStars value={r.value} />
                  </div>
                ))}
              </div>
            </div>

            {/* コメント */}
            {comment ? (
              <div className="mt-4 rounded-xl bg-[#F6F7F6] px-3 py-2 text-sm text-[#2F3A34]">
                <div className="text-xs font-semibold text-[#6B7F75]">
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
