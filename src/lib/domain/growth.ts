/**
 * 成長ステージ型
 */
export type GrowthStage = 1 | 2 | 3 | 4 | 5;

/**
 * 成長ステージ判定用の閾値定義
 * key: stage
 * value: その stage に到達するための最小記録日数
 */
export const GROWTH_THRESHOLDS: Record<GrowthStage, number> = {
  1: 0,   // デフォルト
  2: 5,
  3: 10,
  4: 15,
  5: 21,
};

/**
 * 成長メーター用アイコン定義（stage 1〜5に対応）
 */
export const GROWTH_ICONS = ["🌱", "🌿", "🌳", "🌳✨", "🌳🌰"] as const;

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

/**
 * 記録日数から「次の成長まで」表示用の進捗情報をまとめて取得する
 */
export function getGrowthProgress(recordDays: number) {
  const stage = getGrowthStage(recordDays);
  const isMaxStage = stage === 5;

  const currentThreshold = GROWTH_THRESHOLDS[stage];
  const nextStage = (Math.min(5, stage + 1) as GrowthStage);
  const nextThreshold = GROWTH_THRESHOLDS[nextStage];

  const denom = Math.max(1, nextThreshold - currentThreshold);
  const ratio = isMaxStage
    ? 1
    : (recordDays - currentThreshold) / denom;
  const clamped = Math.min(1, Math.max(0, ratio));

  return {
    stage,
    isMaxStage,
    currentThreshold,
    nextThreshold,
    remainingDays: isMaxStage ? 0 : Math.max(0, nextThreshold - recordDays),
    progressPct: Math.round(clamped * 100),
  };
}

/**
 * 月(1-12)からキャラクターIDを決定する
 * - 偶数月 → wl
 * - 奇数月 → al
 */
export function getCharacterIdByMonth(month: number) {
  return month % 2 === 0 ? "wl" : "al";
}

/**
 * キャラクター画像パスを生成する
 */
export function getCharacterImageSrc(characterId: string, stage: GrowthStage) {
  return `/nuts/${characterId}-stage${stage}.png`;
}