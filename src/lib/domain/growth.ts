/**
 * 成長ステージ
 */
export type GrowthStage = 1 | 2 | 3 | 4 | 5;

/**
 * キャラクターID
 */
export type CharacterId = "wl" | "al";

/**
 * 成長進捗の表示用データ
 */
export type GrowthProgress = {
  stage: GrowthStage;
  isMaxStage: boolean;
  currentThreshold: number;
  nextThreshold: number;
  remainingDays: number;
  progressPct: number;
};

const MIN_STAGE: GrowthStage = 1;
const MAX_STAGE: GrowthStage = 5;
const PERCENT_SCALE = 100;

/**
 * 成長ステージ到達に必要な累計記録日数
 *
 * key: stage
 * value: その stage に到達するための最小記録日数
 */
export const GROWTH_THRESHOLDS: Record<GrowthStage, number> = {
  1: 0,
  2: 5,
  3: 10,
  4: 15,
  5: 21,
};

/**
 * 成長メーター表示用アイコン
 * index 0 が stage 1 に対応する
 */
export const GROWTH_ICONS = ["🌱", "🌿", "🌳", "🌳✨", "🌳🌰"] as const;

/**
 * 記録日数を 0 以上に補正する
 */
function normalizeRecordDays(recordDays: number): number {
  return Math.max(0, recordDays);
}

/**
 * 指定した stage の次ステージを返す
 * 最大 stage の場合はそのまま返す
 */
function getNextGrowthStage(stage: GrowthStage): GrowthStage {
  return Math.min(MAX_STAGE, stage + 1) as GrowthStage;
}

/**
 * 値を 0〜1 の範囲に収める
 */
function clampRatio(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * 記録日数から成長ステージを判定する
 */
export function getGrowthStage(recordDays: number): GrowthStage {
  const safeRecordDays = normalizeRecordDays(recordDays);

  if (safeRecordDays >= GROWTH_THRESHOLDS[5]) return 5;
  if (safeRecordDays >= GROWTH_THRESHOLDS[4]) return 4;
  if (safeRecordDays >= GROWTH_THRESHOLDS[3]) return 3;
  if (safeRecordDays >= GROWTH_THRESHOLDS[2]) return 2;

  return MIN_STAGE;
}

/**
 * 記録日数から、次の成長ステージまでの進捗情報を返す
 *
 * - 最大ステージ到達後は progressPct を 100 とする
 * - remainingDays は 0 を下回らない
 */
export function getGrowthProgress(recordDays: number): GrowthProgress {
  const safeRecordDays = normalizeRecordDays(recordDays);
  const stage = getGrowthStage(safeRecordDays);
  const isMaxStage = stage === MAX_STAGE;

  const currentThreshold = GROWTH_THRESHOLDS[stage];
  const nextStage = getNextGrowthStage(stage);
  const nextThreshold = GROWTH_THRESHOLDS[nextStage];

  const requiredDaysForNextStage = Math.max(
    1,
    nextThreshold - currentThreshold
  );

  const rawProgressRatio = isMaxStage
    ? 1
    : (safeRecordDays - currentThreshold) / requiredDaysForNextStage;

  const progressRatio = clampRatio(rawProgressRatio);

  return {
    stage,
    isMaxStage,
    currentThreshold,
    nextThreshold,
    remainingDays: isMaxStage
      ? 0
      : Math.max(0, nextThreshold - safeRecordDays),
    progressPct: Math.round(progressRatio * PERCENT_SCALE),
  };
}

/**
 * 月番号から表示キャラクターIDを決定する
 *
 * - 偶数月 → wl
 * - 奇数月 → al
 */
export function getCharacterIdByMonth(month: number): CharacterId {
  return month % 2 === 0 ? "wl" : "al";
}

/**
 * キャラクター画像パスを生成する
 */
export function getCharacterImageSrc(
  characterId: CharacterId,
  stage: GrowthStage
): string {
  return `/nuts/${characterId}-stage${stage}.png`;
}