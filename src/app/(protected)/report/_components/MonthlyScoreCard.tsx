"use client";

import type { DailyScores, ScoreKey } from "@/lib/domain/score";

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
 * 小数点表示に対応
 */
function ScoreRow({ label, value }: { label: string; value: number }) {
  // 0-5にクランプ
  const clamped = Math.max(0, Math.min(5, value));
  // 星の数（整数部分）
  const fullStars = Math.floor(clamped);
  // 半星判定（0.5以上なら半星）
  const hasHalfStar = clamped - fullStars >= 0.5;

  return (
    <div className="flex items-center gap-2 text-left">
      <div className="w-[72px] shrink-0 text-left text-sm font-semibold text-[#333]">
        {label}
      </div>

      <div className="flex items-center gap-0.5">
        {/* フル★ */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <span key={`full-${i}`} className="text-xl leading-none text-[#F2B705]">
            ★
          </span>
        ))}
        {/* 半★ */}
        {hasHalfStar && (
          <span className="text-xl leading-none text-[#F2B705] opacity-50">★</span>
        )}
        {/* 空★ */}
        {Array.from({ length: 5 - fullStars - (hasHalfStar ? 1 : 0) }).map((_, i) => (
          <span key={`empty-${i}`} className="text-xl leading-none text-[#D8D8D8]">
            ★
          </span>
        ))}
        <span className="ml-1 w-[40px] text-right text-xs font-semibold text-[#555]">
          {clamped.toFixed(1)}
        </span>
      </div>
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
  const order: ScoreKey[] = ["antioxidant", "mineral", "fiber", "vitamin", "variety"];

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
                  <ScoreRow
                    key={key}
                    label={LABELS[key]}
                    value={scores[key]}
                  />
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
