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
      <div className="w-[72px] shrink-0 text-left text-sm font-semibold text-[#333]">
        {label}
      </div>
      <ScoreStars value={value} />
    </div>
  );
}

/**
 * 月次スコア表示カード
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
    <div className="rounded-2xl border border-[#E6E6E4] bg-white shadow-sm">
      <div className="p-5">
        <div className="text-center">
          <div className="text-xl font-semibold text-[#2F3A34]">
            今月の平均スコア
          </div>
        </div>

        {isEmpty ? (
          <div className="mt-4 rounded-xl bg-[#F6F7F6] px-3 py-3 text-sm text-[#2F3A34] text-center">
            記録がありません
          </div>
        ) : (
          <>
            <div className="mt-5 text-center">
              <div className="inline-block min-w-[240px] px-4 space-y-2">
                {order.map((key) => (
                  <ScoreRow key={key} label={LABELS[key]} value={scores[key]} />
                ))}
              </div>
            </div>

            {/* コメント */}
            {comment && (
              <div className="mt-4 rounded-xl bg-[#F6F7F6] px-3 py-2 text-sm text-[#2F3A34]">
                <div className="text-xs font-semibold text-[#6B7F75]">
                  今月のコメント
                </div>
                <div className="mt-1">{comment}</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
