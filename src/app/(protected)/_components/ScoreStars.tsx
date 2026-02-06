"use client";

type ScoreStarsProps = {
  /** 0〜5 のスコア（小数可） */
  value: number;
  /** 数値表示をするか */
  showValue?: boolean;
  /** 数値の小数桁数（デフォルト 1） */
  precision?: number;
};

/**
 * スコアを ★（半星対応）で表示する共通コンポーネント
 * - 0〜5 の数値を想定
 * - 0.5 以上で半星表示
 */
export default function ScoreStars({
  value,
  showValue = true,
  precision = 1,
}: ScoreStarsProps) {
  // 0〜5 にクランプ
  const clamped = Math.max(0, Math.min(5, value));

  const fullStars = Math.floor(clamped);
  const hasHalfStar = clamped - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {/* フルスター */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <span key={`full-${i}`} className="text-xl leading-none text-[#F2B705]">
          ★
        </span>
      ))}

      {/* 半スター */}
      {hasHalfStar && (
        <span className="text-xl leading-none text-[#F2B705] opacity-50">
          ★
        </span>
      )}

      {/* 空スター */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <span
          key={`empty-${i}`}
          className="text-xl leading-none text-[#D8D8D8]"
        >
          ★
        </span>
      ))}

      {/* 数値表示 */}
      {showValue && (
        <span className="ml-1 w-[40px] text-right text-xs font-semibold text-[#555]">
          {Number.isInteger(clamped) ? clamped : clamped.toFixed(precision)}
        </span>
      )}
    </div>
  );
}
