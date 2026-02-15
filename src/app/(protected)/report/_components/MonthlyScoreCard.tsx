"use client";

import type { DailyScores, ScoreKey } from "@/lib/domain/score";
import ScoreStars from "@/app/(protected)/_components/ScoreStars";

type MonthlyScoreCardProps = {
  scores: DailyScores;
  comment?: string;
  isEmpty?: boolean;
};

const LABELS: Record<ScoreKey, string> = {
  antioxidant: "抗酸化",
  mineral: "ミネラル",
  fiber: "食物繊維",
  vitamin: "ビタミン",
  variety: "バラエティ",
};

/**
 * スコア行コンポーネント
 */
function ScoreRow({ label, value }: { label: string; value: number }) {
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
 * 月次スコア表示カード
 * - スコアとコメントを横並び（デスクトップ）
 * - モバイルでは縦積み
 */
export default function MonthlyScoreCard({
  scores,
  comment,
  isEmpty = false,
}: MonthlyScoreCardProps) {
  const order: ScoreKey[] = [
    "antioxidant",
    "mineral",
    "fiber",
    "vitamin",
    "variety",
  ];

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="p-4 md:p-5">
        <div className="text-center mb-4">
          <div className="text-xl font-semibold text-card-foreground">
            今月の平均スコア
          </div>
        </div>

        {isEmpty ? (
          <div className="rounded-xl bg-muted px-3 py-3 text-sm text-card-foreground text-center">
            記録がありません
          </div>
        ) : (
          /* スコアとコメントを横並び（md以上）、モバイルでは縦積み */
          <div className="flex flex-col md:flex-row md:items-start md:gap-5">
            {/* スコア：内容幅にして、右側に余白を溜めない */}
            <div className="md:w-fit md:shrink-0">
              <div className="space-y-1.5">
                {order.map((key) => (
                  <ScoreRow key={key} label={LABELS[key]} value={scores[key]} />
                ))}
              </div>
            </div>

            {/* コメント：残り幅を使用 */}
            {comment && (
              <div className="mt-4 md:mt-0 md:flex-1 rounded-xl bg-muted px-3 py-2 text-sm text-card-foreground">
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
