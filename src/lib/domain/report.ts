import { computeDailyScores, type DailyScores, type ScoreKey, type ScoreResult } from "./score";
import type { Nut } from "@/lib/types";

/**
 * 月次スコア集計結果の型
 */
export type MonthlyScoreResult = {
  /** 月平均スコア（5軸） */
  averageScores: DailyScores;
  /** 記録日数 */
  recordDays: number;
  /** バランスが取れているか（max-min <= 1） */
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

/**
 * 月内の最大連続日数を計算
 * streaksテーブルは使わず、log_dateから算出
 *
 * @param dates - 対象月の記録日付（昇順でソート済み）
 * @returns 月内最大連続日数
 */
export function calculateMaxStreakInMonth(dates: string[]): number {
  if (dates.length === 0) return 0;
  if (dates.length === 1) return 1;

  // 日付を昇順でソート
  const sortedDates = [...dates].sort();

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);

    // 日付差を計算（ミリ秒→日）
    const diffDays = Math.round(
      (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      // 連続している
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      // 連続が途切れた
      currentStreak = 1;
    }
  }

  return maxStreak;
}

/**
 * ナッツ別の消費日数を集計
 *
 * @param nuts - ナッツマスターデータ
 * @param dailyRecords - 日次記録データ
 * @returns ナッツ別消費日数（全ナッツ、0日含む）
 */
export function aggregateNutConsumption(
  nuts: Nut[],
  dailyRecords: DailyRecord[]
): NutConsumptionData[] {
  // ナッツごとにユニーク日数をカウント
  const nutDaysMap = new Map<number, Set<string>>();

  // 初期化（全ナッツを0日で開始）
  for (const nut of nuts) {
    nutDaysMap.set(nut.id, new Set());
  }

  // 各日の記録を集計
  for (const record of dailyRecords) {
    for (const nutId of record.nutIds) {
      const daysSet = nutDaysMap.get(nutId);
      if (daysSet) {
        daysSet.add(record.logDate);
      }
    }
  }

  // 結果を配列に変換
  return nuts.map((nut) => ({
    nutId: nut.id,
    name: nut.name,
    days: nutDaysMap.get(nut.id)?.size ?? 0,
  }));
}

/**
 * 月次スコアを計算
 * 日次スコアの平均を5軸すべてで算出
 *
 * @param nuts - ナッツマスターデータ
 * @param dailyRecords - 日次記録データ
 * @returns 月次スコア結果
 */
export function calculateMonthlyScore(
  nuts: Nut[],
  dailyRecords: DailyRecord[]
): MonthlyScoreResult {
  const recordDays = dailyRecords.length;

  // 記録なしの場合
  if (recordDays === 0) {
    return {
      averageScores: {
        antioxidant: 0,
        mineral: 0,
        fiber: 0,
        vitamin: 0,
        variety: 0,
      },
      recordDays: 0,
      isBalanced: true,
      strongestKey: "variety",
    };
  }

  // 各日のスコアを計算して集計
  const scoreKeys: ScoreKey[] = ["antioxidant", "mineral", "fiber", "vitamin", "variety"];
  const scoreSums: Record<ScoreKey, number> = {
    antioxidant: 0,
    mineral: 0,
    fiber: 0,
    vitamin: 0,
    variety: 0,
  };

  for (const record of dailyRecords) {
    const dailyResult: ScoreResult = computeDailyScores(nuts, record.nutIds);
    for (const key of scoreKeys) {
      scoreSums[key] += dailyResult.scores[key];
    }
  }

  // 平均を計算（小数点1位で四捨五入）
  const averageScores: DailyScores = {
    antioxidant: Math.round((scoreSums.antioxidant / recordDays) * 10) / 10,
    mineral: Math.round((scoreSums.mineral / recordDays) * 10) / 10,
    fiber: Math.round((scoreSums.fiber / recordDays) * 10) / 10,
    vitamin: Math.round((scoreSums.vitamin / recordDays) * 10) / 10,
    variety: Math.round((scoreSums.variety / recordDays) * 10) / 10,
  };

  // バランス判定（max - min <= 1）
  const values = Object.values(averageScores);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const isBalanced = max - min <= 1;

  // 最も高いスコアのキーを決定
  const order: ScoreKey[] = ["antioxidant", "mineral", "fiber", "vitamin", "variety"];
  let strongestKey: ScoreKey = "variety";
  let best = -1;
  for (const k of order) {
    const v = averageScores[k];
    if (v > best) {
      best = v;
      strongestKey = k;
    }
  }

  return {
    averageScores,
    recordDays,
    isBalanced,
    strongestKey,
  };
}

/**
 * 月次レポートデータを一括で集計
 *
 * @param yearMonth - 対象年月（YYYY-MM）
 * @param nuts - ナッツマスターデータ
 * @param dailyRecords - 日次記録データ
 * @returns 月次レポートデータ
 */
export function aggregateMonthlyReport(
  yearMonth: string,
  nuts: Nut[],
  dailyRecords: DailyRecord[]
): MonthlyReportData {
  const recordedDates = dailyRecords.map((r) => r.logDate).sort();

  return {
    yearMonth,
    monthlyScore: calculateMonthlyScore(nuts, dailyRecords),
    nutConsumption: aggregateNutConsumption(nuts, dailyRecords),
    maxStreak: calculateMaxStreakInMonth(recordedDates),
    recordedDates,
  };
}