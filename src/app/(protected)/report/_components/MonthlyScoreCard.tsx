"use client";

import type { DailyScores, ScoreKey } from "@/lib/domain/score";
import ScoreStars from "@/app/(protected)/_components/ScoreStars";

type MonthlyScoreCardProps = {
  scores: DailyScores;
  comment?: string;
  isEmpty?: boolean;
};

type ScoreRowProps = {
  label: string;
  value: number;
};

const SCORE_ORDER: ScoreKey[] = [
  "antioxidant",
  "mineral",
  "fiber",
  "vitamin",
  "variety",
];

const LABELS: Record<ScoreKey, string> = {
  antioxidant: "抗酸化",
  mineral: "ミネラル",
  fiber: "食物繊維",
  vitamin: "ビタミン",
  variety: "バラエティ",
};

/**
 * スコア行
 */
function ScoreRow({ label, value }: ScoreRowProps) {
  return (
    <div className="flex items-center gap-2 text-left">
      <div className="w-[72px] shrink-0 text-left text-sm font-semibold text-card-foreground">
        {label}
      </div>
      <ScoreStars value={value} />
    </div>
  );
}

/**
 * 月次スコアカード
 * - スコア + コメント表示
 * - モバイル: 縦積み
 * - md以上: 横並び
 */
export default function MonthlyScoreCard({
  scores,
  comment,
  isEmpty = false,
}: MonthlyScoreCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="p-4 md:p-5">
        {/* タイトル */}
        <div className="mb-4 text-center">
          <div className="text-xl font-semibold text-card-foreground">
            今月の平均スコア
          </div>
        </div>

        {isEmpty ? (
          <div className="rounded-xl bg-muted px-3 py-3 text-center text-sm text-card-foreground">
            記録がありません
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-start md:gap-5">
            {/* スコア */}
            <div className="md:w-fit md:shrink-0">
              <div className="space-y-1.5">
                {SCORE_ORDER.map((key) => (
                  <ScoreRow key={key} label={LABELS[key]} value={scores[key]} />
                ))}
              </div>
            </div>

            {/* コメント */}
            {comment && (
              <div className="mt-4 rounded-xl bg-muted px-3 py-2 text-sm text-card-foreground md:mt-0 md:flex-1">
                <div className="text-xs font-semibold text-muted-foreground">
                  今月のコメント
                </div>
                <div className="mt-1">{comment}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
