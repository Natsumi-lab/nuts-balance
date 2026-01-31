import type { Nut } from "@/lib/types";

export type ScoreKey = "antioxidant" | "mineral" | "fiber" | "vitamin" | "variety";

export type DailyScores = Record<ScoreKey, number>;

export type ScoreResult = {
  scores: DailyScores;        // 各軸 0〜5
  varietyCount: number;       // 0〜6（選択種類数）
  isBalanced: boolean;        // max-min <= 1
  strongestKey: Exclude<ScoreKey, "variety"> | "variety";
};

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

/**
 * 0〜3（nutsのスコア）を平均 → 0〜5へスケールして四捨五入
 */
function scale0to3_to_0to5(avg0to3: number): number {
  return clampInt((avg0to3 / 3) * 5, 0, 5);
}

/**
 * 種類数 0〜6 を 0〜5 にスケールして四捨五入
 */
function scale0to6_to_0to5(count0to6: number): number {
  const c = Math.max(0, Math.min(6, count0to6));
  return clampInt((c / 6) * 5, 0, 5);
}

/**
 * 指定日の選択ナッツから「5軸の★(0〜5)」を算出
 * - nuts側の各スコアは 1〜3 を想定（型は number だがDBはsmallint）
 * - スコア自体は保存せず、毎回算出
 */
export function computeDailyScores(nuts: Nut[], selectedNutIds: number[]): ScoreResult {
  // 種類数（重複排除）
  const uniqueIds = Array.from(new Set(selectedNutIds)).filter((v) => Number.isFinite(v));
  const varietyCount = Math.min(6, uniqueIds.length);

  // 未選択なら全部0
  if (uniqueIds.length === 0) {
    const scores: DailyScores = {
      antioxidant: 0,
      mineral: 0,
      fiber: 0,
      vitamin: 0,
      variety: 0,
    };
    return {
      scores,
      varietyCount: 0,
      isBalanced: true,
      strongestKey: "variety",
    };
  }

  const byId = new Map<number, Nut>(nuts.map((n) => [n.id, n]));

  let sumA = 0;
  let sumM = 0;
  let sumF = 0;
  let sumV = 0;
  let count = 0;

  for (const id of uniqueIds) {
    const nut = byId.get(id);
    if (!nut) continue;

    sumA += nut.score_antioxidant ?? 0;
    sumM += nut.score_mineral ?? 0;
    sumF += nut.score_fiber ?? 0;
    sumV += nut.score_vitamin ?? 0;
    count += 1;
  }

  // あり得ないが安全に
  if (count === 0) {
    const scores: DailyScores = {
      antioxidant: 0,
      mineral: 0,
      fiber: 0,
      vitamin: 0,
      variety: scale0to6_to_0to5(varietyCount),
    };
    return {
      scores,
      varietyCount,
      isBalanced: true,
      strongestKey: "variety",
    };
  }

  const avgA = sumA / count; // 0〜3
  const avgM = sumM / count;
  const avgF = sumF / count;
  const avgV = sumV / count;

  const scores: DailyScores = {
    antioxidant: scale0to3_to_0to5(avgA),
    mineral: scale0to3_to_0to5(avgM),
    fiber: scale0to3_to_0to5(avgF),
    vitamin: scale0to3_to_0to5(avgV),
    variety: scale0to6_to_0to5(varietyCount),
  };

  // バランス判定（5軸のmax-min）
  const values = Object.values(scores);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const isBalanced = max - min <= 1;

  // strongest（同点なら優先順で決める）
  const order: ScoreKey[] = ["antioxidant", "mineral", "fiber", "vitamin", "variety"];
  let strongestKey: ScoreKey = "variety";
  let best = -1;
  for (const k of order) {
    const v = scores[k];
    if (v > best) {
      best = v;
      strongestKey = k;
    }
  }

  return { scores, varietyCount, isBalanced, strongestKey };
}
