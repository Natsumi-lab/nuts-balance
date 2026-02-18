import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Nut } from "@/lib/types";
import { aggregateMonthlyReport, type DailyRecord } from "@/lib/domain/report";
import { generateMonthlyComment } from "@/lib/domain/comment";
import MonthSelector from "./_components/MonthSelector";
import MonthlyScoreCard from "./_components/MonthlyScoreCard";
import NutConsumptionChart from "./_components/NutConsumptionChart";
import MonthlyCharacter from "./_components/MonthlyCharacter";

/**
 * ページプロパティの型
 */
interface PageProps {
  searchParams: Promise<{
    month?: string; // YYYY-MM形式
  }>;
}

/**
 * ローディングプレースホルダ
 */
function LoadingPlaceholder() {
  return (
    <div className="bg-card border border-border rounded-2xl shadow-md">
      <div className="flex items-center justify-center h-64 p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-secondary border-t-accent"></div>
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    </div>
  );
}

/**
 * エラーメッセージコンポーネント
 */
function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="border rounded-2xl shadow-lg p-5 border-border bg-card">
      <div className="pb-3 border-b border-border">
        <h3 className="text-lg font-semibold text-accent">
          エラーが発生しました
        </h3>
      </div>
      <div className="pt-4">
        <p className="text-muted-foreground">{message}</p>
        <div className="mt-5">
          <a
            href="/report"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-border text-sm bg-card hover:bg-muted text-foreground shadow-md transition-all"
          >
            再読み込み
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * 今月のYYYY-MMを取得
 */
function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * 対象月の日数を取得
 */
function getDaysInMonth(yearMonth: string): number {
  const [year, month] = yearMonth.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

/**
 * 月次レポートデータを取得
 */
async function fetchMonthlyReportData(yearMonth: string) {
  const supabase = await createClient();

  // 月の開始日・終了日を計算
  const [, month] = yearMonth.split("-").map(Number);
  const startDate = `${yearMonth}-01`;
  const endDate = `${yearMonth}-${String(getDaysInMonth(yearMonth)).padStart(2, "0")}`;

  // ナッツマスターデータを取得
  const { data: nuts, error: nutsError } = await supabase
    .from("nuts")
    .select("*")
    .order("id");

  if (nutsError) {
    throw new Error("ナッツデータの取得に失敗しました");
  }

  // 対象月の日誌を取得
  const { data: dailyLogs, error: logsError } = await supabase
    .from("daily_logs")
    .select("id, log_date")
    .gte("log_date", startDate)
    .lte("log_date", endDate)
    .order("log_date", { ascending: true });

  if (logsError) {
    throw new Error("日誌データの取得に失敗しました");
  }

  // 日誌がない場合は空データを返す
  if (!dailyLogs || dailyLogs.length === 0) {
    return {
      nuts: nuts as Nut[],
      dailyRecords: [] as DailyRecord[],
      yearMonth,
      month,
    };
  }

  // 日誌IDのリスト
  const logIds = dailyLogs.map((log) => log.id);

  // 日誌アイテム（選択されたナッツ）を取得
  const { data: logItems, error: itemsError } = await supabase
    .from("daily_log_items")
    .select("daily_log_id, nut_id")
    .in("daily_log_id", logIds);

  if (itemsError) {
    throw new Error("日誌アイテムの取得に失敗しました");
  }

  // 日誌ごとのナッツIDをまとめる
  const logItemsMap = new Map<string, number[]>();
  for (const item of logItems ?? []) {
    const existing = logItemsMap.get(item.daily_log_id) ?? [];
    existing.push(Number(item.nut_id));
    logItemsMap.set(item.daily_log_id, existing);
  }

  // DailyRecord形式に変換
  const dailyRecords: DailyRecord[] = dailyLogs.map((log) => ({
    logDate: log.log_date,
    nutIds: logItemsMap.get(log.id) ?? [],
  }));

  return {
    nuts: nuts as Nut[],
    dailyRecords,
    yearMonth,
    month,
  };
}

/**
 * 月次レポートページ
 */
export default async function ReportPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const yearMonth = params.month ?? getCurrentYearMonth();

  // YYYY-MM形式のバリデーション
  if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
    return (
      <div className="max-w-lg mx-auto">
        <ErrorMessage message="月の形式が不正です。" />
      </div>
    );
  }

  try {
    const { nuts, dailyRecords, month } =
      await fetchMonthlyReportData(yearMonth);
    const daysInMonth = getDaysInMonth(yearMonth);

    // 月次レポートデータを集計
    const reportData = aggregateMonthlyReport(yearMonth, nuts, dailyRecords);
    const isEmpty = reportData.monthlyScore.recordDays === 0;

    // コメント生成
    const comment = generateMonthlyComment({
      yearMonth,
      monthlyScore: reportData.monthlyScore,
    });

    return (
      <div className="space-y-6">
        {/* 月切り替えUI */}
        <div className="bg-card border border-border rounded-2xl shadow-lg p-5">
          <Suspense fallback={<div className="h-10" />}>
            <MonthSelector currentYearMonth={yearMonth} />
          </Suspense>
        </div>

        {/* メインコンテンツ: /appと同様に右カラム360px */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px] lg:gap-6">
          {/* 左エリア：スコアとグラフ */}
          <section className="grid grid-cols-1 gap-5 lg:gap-6">
            {/* 月次スコア */}
            <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
              <div className="p-5">
                <Suspense fallback={<LoadingPlaceholder />}>
                  <MonthlyScoreCard
                    scores={reportData.monthlyScore.averageScores}
                    comment={comment}
                    isEmpty={isEmpty}
                  />
                </Suspense>
              </div>
            </div>

            {/* ナッツ別棒グラフ */}
            <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
              <div className="p-5">
                <Suspense fallback={<LoadingPlaceholder />}>
                  <NutConsumptionChart
                    data={reportData.nutConsumption}
                    maxDays={daysInMonth}
                  />
                </Suspense>
              </div>
            </div>
          </section>

          {/* 右エリア：キャラクター */}
          <aside className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
            <div className="p-5">
              <Suspense fallback={<LoadingPlaceholder />}>
                <MonthlyCharacter
                  recordDays={reportData.monthlyScore.recordDays}
                  month={month}
                  maxStreak={reportData.maxStreak}
                />
              </Suspense>
            </div>
          </aside>
        </div>
      </div>
    );
  } catch {
    return (
      <div className="space-y-6">
        <div className="max-w-lg mx-auto">
          <ErrorMessage message="レポートデータの読み込み中にエラーが発生しました。" />
        </div>
      </div>
    );
  }
}
