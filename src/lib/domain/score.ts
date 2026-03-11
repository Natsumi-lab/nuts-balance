import type { Nut } from "@/lib/types";

export type ScoreKey =
  | "antioxidant"
  | "mineral"
  | "fiber"
  | "vitamin"
  | "variety";

export type DailyScores = Record<ScoreKey, number>;

export type ScoreResult = {
  scores: DailyScores;
  varietyCount: number;
  isBalanced: boolean;
  strongestKey: ScoreKey;
};

/**
 * ドメイン定数
 */
const MAX_VARIETY_COUNT = 6;
const MAX_STAR_SCORE = 5;
const MAX_NUTRIENT_SCORE = 3;
const BALANCED_SCORE_DIFF_THRESHOLD = 1;

/**
 * 値を四捨五入し、指定範囲に収める
 */
function roundAndClamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

/**
 * 栄養4軸の平均スコア（0〜3）を
 * 表示用の5段階スコア（0〜5）に変換する
 */
function convertNutrientAverageToStarScore(value: number): number {
  return roundAndClamp(
    (value / MAX_NUTRIENT_SCORE) * MAX_STAR_SCORE,
    0,
    MAX_STAR_SCORE
  );
}

/**
 * ナッツ種類数（0〜6）を
 * 表示用の5段階スコア（0〜5）に変換する
 */
function convertVarietyCountToStarScore(count: number): number {
  const safeCount = Math.max(0, Math.min(MAX_VARIETY_COUNT, count));

  return roundAndClamp(
    (safeCount / MAX_VARIETY_COUNT) * MAX_STAR_SCORE,
    0,
    MAX_STAR_SCORE
  );
}

/**
 * 空のスコア（未選択時）
 */
function createEmptyScores(): DailyScores {
  return {
    antioxidant: 0,
    mineral: 0,
    fiber: 0,
    vitamin: 0,
    variety: 0,
  };
}

/**
 * strongestKey を決定
 * 同点の場合は優先順で決める
 */
export function getStrongestScoreKey(scores: DailyScores): ScoreKey {
  const priorityOrder: ScoreKey[] = [
    "antioxidant",
    "mineral",
    "fiber",
    "vitamin",
    "variety",
  ];

  let strongestKey: ScoreKey = "variety";
  let bestScore = -1;

  for (const key of priorityOrder) {
    const score = scores[key];

    if (score > bestScore) {
      bestScore = score;
      strongestKey = key;
    }
  }

  return strongestKey;
}

/**
 * 5軸スコアのバランス判定
 * max - min <= 1 をバランス良しとする
 */
export function isBalancedScore(scores: DailyScores): boolean {
  const values = Object.values(scores);

  const maxScore = Math.max(...values);
  const minScore = Math.min(...values);

  return maxScore - minScore <= BALANCED_SCORE_DIFF_THRESHOLD;
}

/**
 * 選択されたナッツ一覧から日次スコアを算出する
 *
 * - 栄養4軸は選択ナッツの平均値から算出
 * - variety は選択された種類数から算出
 * - スコアはDBに保存せず表示時に毎回計算する
 */
export function computeDailyScores(
  nuts: Nut[],
  selectedNutIds: number[]
): ScoreResult {
  /**
   * variety は「種類数」で評価するため
   * 重複IDは除外する
   */
  const uniqueNutIds = Array.from(new Set(selectedNutIds)).filter(Number.isFinite);

  const varietyCount = Math.min(MAX_VARIETY_COUNT, uniqueNutIds.length);

  /**
   * ナッツ未選択の場合
   */
  if (uniqueNutIds.length === 0) {
    const scores = createEmptyScores();

    return {
      scores,
      varietyCount: 0,
      isBalanced: true,
      strongestKey: "variety",
    };
  }

  /**
   * id -> Nut 参照用Map
   */
  const nutsById = new Map<number, Nut>(nuts.map((nut) => [nut.id, nut]));

  let antioxidantTotal = 0;
  let mineralTotal = 0;
  let fiberTotal = 0;
  let vitaminTotal = 0;
  let validNutCount = 0;

  for (const nutId of uniqueNutIds) {
    const nut = nutsById.get(nutId);

    if (!nut) continue;

    antioxidantTotal += nut.score_antioxidant ?? 0;
    mineralTotal += nut.score_mineral ?? 0;
    fiberTotal += nut.score_fiber ?? 0;
    vitaminTotal += nut.score_vitamin ?? 0;

    validNutCount += 1;
  }

  /**
   * selectedNutIds に存在しても
   * nutsマスタに存在しないIDしかなかった場合
   */
  if (validNutCount === 0) {
    const scores: DailyScores = {
      ...createEmptyScores(),
      variety: convertVarietyCountToStarScore(varietyCount),
    };

    return {
      scores,
      varietyCount,
      isBalanced: true,
      strongestKey: "variety",
    };
  }

  const scores: DailyScores = {
    antioxidant: convertNutrientAverageToStarScore(
      antioxidantTotal / validNutCount
    ),
    mineral: convertNutrientAverageToStarScore(mineralTotal / validNutCount),
    fiber: convertNutrientAverageToStarScore(fiberTotal / validNutCount),
    vitamin: convertNutrientAverageToStarScore(vitaminTotal / validNutCount),
    variety: convertVarietyCountToStarScore(varietyCount),
  };

  return {
    scores,
    varietyCount,
    isBalanced: isBalancedScore(scores),
    strongestKey: getStrongestScoreKey(scores),
  };
}