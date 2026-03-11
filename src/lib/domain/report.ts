import {
  computeDailyScores,
  getStrongestScoreKey,
  isBalancedScore,
  type DailyScores,
  type ScoreKey,
} from "./score";
import type { Nut } from "@/lib/types";

/**
 * 月次スコア集計結果
 */
export type MonthlyScoreResult = {
  /** 月平均スコア（5軸） */
  averageScores: DailyScores;
  /** 記録日数 */
  recordDays: number;
  /** バランスが取れているか（max - min <= 1） */
  isBalanced: boolean;
  /** 最も高いスコアのキー */
  strongestKey: ScoreKey;
};

/**
 * ナッツ別の食べた日数
 */
export type NutConsumptionData = {
  nutId: number;
  name: string;
  days: number;
};

/**
 * 日次の記録データ（集計用）
 */
export type DailyRecord = {
  logDate: string;
  nutIds: number[];
};

/**
 * 月次レポートの集計データ
 */
export type MonthlyReportData = {
  /** 対象年月 YYYY-MM */
  yearMonth: string;
  /** 月次スコア */
  monthlyScore: MonthlyScoreResult;
  /** ナッツ別消費日数 */
  nutConsumption: NutConsumptionData[];
  /** 月内最大ストリーク */
  maxStreak: number;
  /** 記録がある日付一覧（昇順） */
  recordedDates: string[];
};

const SCORE_KEYS: ScoreKey[] = [
  "antioxidant",
  "mineral",
  "fiber",
  "vitamin",
  "variety",
];

const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * 小数第1位で四捨五入する
 */
function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * 0点の5軸スコアを返す
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
 * 2つの日付文字列の差を日数で返す
 *
 * 前提:
 * - どちらも YYYY-MM-DD 形式
 * - currDate が prevDate と同日または未来日であることを想定
 */
function getDayDifference(prevDate: string, currDate: string): number {
  const previous = new Date(prevDate);
  const current = new Date(currDate);

  return Math.round(
    (current.getTime() - previous.getTime()) / MILLISECONDS_PER_DAY
  );
}

/**
 * 月平均スコア計算用の合計値を初期化する
 */
function createInitialScoreSums(): Record<ScoreKey, number> {
  return {
    antioxidant: 0,
    mineral: 0,
    fiber: 0,
    vitamin: 0,
    variety: 0,
  };
}

/**
 * 各日の日次スコアを合計し、月平均スコアを作る
 */
function calculateAverageScores(
  nuts: Nut[],
  dailyRecords: DailyRecord[]
): DailyScores {
  const scoreSums = createInitialScoreSums();

  for (const record of dailyRecords) {
    const dailyScores = computeDailyScores(nuts, record.nutIds).scores;

    for (const key of SCORE_KEYS) {
      scoreSums[key] += dailyScores[key];
    }
  }

  const recordDays = dailyRecords.length;

  return {
    antioxidant: roundToOneDecimal(scoreSums.antioxidant / recordDays),
    mineral: roundToOneDecimal(scoreSums.mineral / recordDays),
    fiber: roundToOneDecimal(scoreSums.fiber / recordDays),
    vitamin: roundToOneDecimal(scoreSums.vitamin / recordDays),
    variety: roundToOneDecimal(scoreSums.variety / recordDays),
  };
}

/**
 * 月内の最大連続記録日数を計算する
 *
 * streaks テーブルは使わず、対象月の logDate から算出する。
 * 同一日付が重複していても、連続日数には1日として扱う。
 */
export function calculateMaxStreakInMonth(dates: string[]): number {
  if (dates.length === 0) {
    return 0;
  }

  const sortedUniqueDates = Array.from(new Set(dates)).sort();

  if (sortedUniqueDates.length === 1) {
    return 1;
  }

  let maxStreak = 1;
  let currentStreak = 1;

  for (let index = 1; index < sortedUniqueDates.length; index++) {
    const previousDate = sortedUniqueDates[index - 1];
    const currentDate = sortedUniqueDates[index];
    const dayDifference = getDayDifference(previousDate, currentDate);

    if (dayDifference === 1) {
      currentStreak += 1;
      maxStreak = Math.max(maxStreak, currentStreak);
      continue;
    }

    currentStreak = 1;
  }

  return maxStreak;
}

/**
 * ナッツごとの「食べた日数」を集計する
 *
 * 同じ日に同じナッツIDが複数回含まれていても、1日として数える。
 * 戻り値は全ナッツを含み、未記録のナッツも 0 日で返す。
 */
export function aggregateNutConsumption(
  nuts: Nut[],
  dailyRecords: DailyRecord[]
): NutConsumptionData[] {
  const consumedDatesByNutId = new Map<number, Set<string>>();

  for (const nut of nuts) {
    consumedDatesByNutId.set(nut.id, new Set());
  }

  for (const record of dailyRecords) {
    const uniqueNutIds = Array.from(new Set(record.nutIds));

    for (const nutId of uniqueNutIds) {
      const consumedDates = consumedDatesByNutId.get(nutId);

      if (!consumedDates) {
        continue;
      }

      consumedDates.add(record.logDate);
    }
  }

  return nuts.map((nut) => ({
    nutId: nut.id,
    name: nut.name,
    days: consumedDatesByNutId.get(nut.id)?.size ?? 0,
  }));
}

/**
 * 月次スコアを計算する
 *
 * - 各日の5軸スコアを算出し、その平均を月次スコアとする
 * - averageScores は小数第1位で四捨五入する
 */
export function calculateMonthlyScore(
  nuts: Nut[],
  dailyRecords: DailyRecord[]
): MonthlyScoreResult {
  const recordDays = dailyRecords.length;

  if (recordDays === 0) {
    return {
      averageScores: createEmptyScores(),
      recordDays: 0,
      isBalanced: true,
      strongestKey: "variety",
    };
  }

  const averageScores = calculateAverageScores(nuts, dailyRecords);

  return {
    averageScores,
    recordDays,
    isBalanced: isBalancedScore(averageScores),
    strongestKey: getStrongestScoreKey(averageScores),
  };
}

/**
 * 月次レポート表示に必要なデータを一括で集計する
 */
export function aggregateMonthlyReport(
  yearMonth: string,
  nuts: Nut[],
  dailyRecords: DailyRecord[]
): MonthlyReportData {
  const recordedDates = Array.from(
    new Set(dailyRecords.map((record) => record.logDate))
  ).sort();

  return {
    yearMonth,
    monthlyScore: calculateMonthlyScore(nuts, dailyRecords),
    nutConsumption: aggregateNutConsumption(nuts, dailyRecords),
    maxStreak: calculateMaxStreakInMonth(recordedDates),
    recordedDates,
  };
}