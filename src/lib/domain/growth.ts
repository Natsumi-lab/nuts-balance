// src/lib/domain/growth.ts

/**
 * 成長ステージ型
 */
export type GrowthStage = 1 | 2 | 3 | 4 | 5;

/**
 * 成長ステージ判定用の閾値定義
 * key: stage
 * value: その stage に到達するための最小記録日数
 */
const GROWTH_THRESHOLDS: Record<GrowthStage, number> = {
  1: 0,   // デフォルト
  2: 5,
  3: 10,
  4: 15,
  5: 21,
};

/**
 * 記録日数から成長ステージを判定する
 *
 * @param recordDays 累計記録日数
 * @returns 成長ステージ (1〜5)
 */
export function getGrowthStage(recordDays: number): GrowthStage {
  if (recordDays >= GROWTH_THRESHOLDS[5]) return 5;
  if (recordDays >= GROWTH_THRESHOLDS[4]) return 4;
  if (recordDays >= GROWTH_THRESHOLDS[3]) return 3;
  if (recordDays >= GROWTH_THRESHOLDS[2]) return 2;
  return 1;
}
