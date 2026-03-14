type ScoreStarsProps = {
  /** 0〜5 のスコア（小数可） */
  value: number;
  /** 数値表示をするか */
  showValue?: boolean;
  /** 数値の小数桁数（デフォルト 1） */
  precision?: number;
};

const MAX_STARS = 5;

const FULL_STAR_COLOR = "text-[#F2B705]";
const EMPTY_STAR_COLOR = "text-[#D8D8D8]";

const STAR_BASE = "text-xl leading-none";

/**
 * スコアを ★（半星対応）で表示するコンポーネント
 * - 0〜5 の数値を想定
 * - 0.5 以上で半星表示
 */
export default function ScoreStars({
  value,
  showValue = true,
  precision = 1,
}: ScoreStarsProps) {
  // 0〜5 にクランプ
  const clampedScore = Math.max(0, Math.min(MAX_STARS, value));

  const fullStarCount = Math.floor(clampedScore);
  const hasHalfStar = clampedScore - fullStarCount >= 0.5;
  const emptyStarCount = MAX_STARS - fullStarCount - (hasHalfStar ? 1 : 0);

  function renderStars(count: number, className: string, keyPrefix: string) {
    return Array.from({ length: count }).map((_, i) => (
      <span key={`${keyPrefix}-${i}`} className={`${STAR_BASE} ${className}`}>
        ★
      </span>
    ));
  }

  function formatScore() {
    if (Number.isInteger(clampedScore)) {
      return clampedScore;
    }
    return clampedScore.toFixed(precision);
  }

  return (
    <div className="flex items-center gap-0.5">
      {/* フルスター */}
      {renderStars(fullStarCount, FULL_STAR_COLOR, "full")}

      {/* 半スター */}
      {hasHalfStar && (
        <span className={`${STAR_BASE} ${FULL_STAR_COLOR} opacity-50`}>★</span>
      )}

      {/* 空スター */}
      {renderStars(emptyStarCount, EMPTY_STAR_COLOR, "empty")}

      {/* 数値表示 */}
      {showValue && (
        <span className="ml-1 w-[40px] text-right text-xs font-semibold text-[#555]">
          {formatScore()}
        </span>
      )}
    </div>
  );
}
