import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import type { DailyLogData, Nut } from "@/lib/types";
import NutCheckList from "./_components/NutCheckList";
import CharacterStreak from "./_components/CharacterStreak";
import DateInitializer from "./_components/DateInitializer";
import CalendarPicker from "./_components/CalendarPicker";
import TodayScore from "./_components/TodayScore";
import { computeDailyScores } from "@/lib/domain/score";
import {
  generateDailyComment,
  SCORE_EMPTY_MESSAGE,
} from "@/lib/domain/comment";

type PageProps = {
  searchParams: Promise<{
    date?: string;
  }>;
};

type DailyPageData = {
  nuts: Nut[];
  dailyLogData: DailyLogData;
  monthStreak: number;
  monthRecordDays: number;
  recordedDates: string[];
  skippedDates: string[];
};

const CARD_CLASS_NAME =
  "bg-card border border-border rounded-2xl shadow-lg overflow-hidden";

const DAYS_OF_WEEK_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;
const MONTH_FIRST_DAY = "01";

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
            href=""
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-border text-sm bg-card hover:bg-muted text-foreground shadow-md transition-all"
          >
            再読み込み
          </a>
        </div>
      </div>
    </div>
  );
}

function LoadingPlaceholder() {
  return (
    <div className="bg-card border border-border rounded-2xl shadow-md">
      <div className="flex items-center justify-center h-64 p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-secondary border-t-accent" />
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    </div>
  );
}

/**
 * YYYY-MM-DD をローカルの Date に変換する
 */
function parseYmd(ymd: string): Date {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Date を YYYY-MM-DD に変換する
 */
function formatYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * 指定日が属する月の範囲を返す
 *
 * - startYmd: 月初
 * - nextStartYmd: 翌月初
 */
function getMonthRangeYmd(baseYmd: string): {
  startYmd: string;
  nextStartYmd: string;
} {
  const [year, month] = baseYmd.split("-").map(Number);

  const startYmd = `${year}-${String(month).padStart(2, "0")}-${MONTH_FIRST_DAY}`;

  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextStartYmd = `${nextYear}-${String(nextMonth).padStart(2, "0")}-${MONTH_FIRST_DAY}`;

  return { startYmd, nextStartYmd };
}

/**
 * 基準日から月初までさかのぼり、当月内の連続記録日数を数える
 *
 * 仕様:
 * - 基準日が未記録なら 0
 * - 月初より前は数えない
 */
function calculateMonthlyStreak(
  logDatesYmd: string[],
  baseYmd: string,
): number {
  const recordedDateSet = new Set(logDatesYmd);

  if (!recordedDateSet.has(baseYmd)) {
    return 0;
  }

  const baseDate = parseYmd(baseYmd);
  const monthStartDate = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    1,
  );

  const currentDate = new Date(baseDate);
  let streak = 0;

  while (currentDate.getTime() >= monthStartDate.getTime()) {
    const currentYmd = formatYmd(currentDate);

    if (!recordedDateSet.has(currentYmd)) {
      break;
    }

    streak += 1;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

/**
 * DB から取得した nut_id 一覧を、フォームやドメインで使う string[] に変換する
 */
function toSelectedNutIds(nutIds: Array<{ nut_id: number }>): string[] {
  return nutIds.map((item) => String(item.nut_id));
}

/**
 * 保存済み selectedNutIds を score 計算用の number[] に変換する
 */
function toNumericNutIds(selectedNutIds: string[]): number[] {
  return selectedNutIds.map((value) => Number(value)).filter(Number.isFinite);
}

async function fetchNuts(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data, error } = await supabase.from("nuts").select("*").order("id");

  if (error) {
    throw new Error("ナッツの取得に失敗しました");
  }

  return (data ?? []) as Nut[];
}

async function fetchDailyLog(
  supabase: Awaited<ReturnType<typeof createClient>>,
  date: string,
) {
  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("log_date", date)
    .maybeSingle();

  if (error) {
    throw new Error("日誌の取得に失敗しました");
  }

  return data;
}

async function fetchDailyLogData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  date: string,
): Promise<DailyLogData> {
  const dailyLog = await fetchDailyLog(supabase, date);

  if (!dailyLog) {
    return {
      dailyLog: null,
      selectedNutIds: [],
    };
  }

  const { data, error } = await supabase
    .from("daily_log_items")
    .select("nut_id")
    .eq("daily_log_id", dailyLog.id);

  if (error) {
    throw new Error("日誌アイテムの取得に失敗しました");
  }

  return {
    dailyLog,
    selectedNutIds: toSelectedNutIds(data ?? []),
  };
}

async function fetchMonthlyLogDates(
  supabase: Awaited<ReturnType<typeof createClient>>,
  date: string,
): Promise<string[]> {
  const { startYmd, nextStartYmd } = getMonthRangeYmd(date);

  const { data, error } = await supabase
    .from("daily_logs")
    .select("log_date")
    .gte("log_date", startYmd)
    .lt("log_date", nextStartYmd)
    .order("log_date", { ascending: true });

  if (error) {
    throw new Error("今月の記録日数の取得に失敗しました");
  }

  return (data ?? []).map((row) => row.log_date);
}

async function fetchRecordedDates(
  supabase: Awaited<ReturnType<typeof createClient>>,
  date: string,
): Promise<string[]> {
  const { startYmd, nextStartYmd } = getMonthRangeYmd(date);

  const { data, error } = await supabase
    .from("daily_logs")
    .select("log_date")
    .gte("log_date", startYmd)
    .lt("log_date", nextStartYmd);

  if (error) {
    throw new Error("記録日付一覧の取得に失敗しました");
  }

  return (data ?? []).map((row) => row.log_date);
}

async function fetchSkippedDates(
  supabase: Awaited<ReturnType<typeof createClient>>,
  date: string,
): Promise<string[]> {
  const { startYmd, nextStartYmd } = getMonthRangeYmd(date);

  const { data, error } = await supabase
    .from("daily_skips")
    .select("log_date")
    .gte("log_date", startYmd)
    .lt("log_date", nextStartYmd);

  if (error) {
    throw new Error("スキップ日付一覧の取得に失敗しました");
  }

  return (data ?? []).map((row) => row.log_date);
}

async function fetchDailyPageData(date: string): Promise<DailyPageData> {
  const supabase = await createClient();

  const [nuts, dailyLogData, monthLogDates, recordedDates, skippedDates] =
    await Promise.all([
      fetchNuts(supabase),
      fetchDailyLogData(supabase, date),
      fetchMonthlyLogDates(supabase, date),
      fetchRecordedDates(supabase, date),
      fetchSkippedDates(supabase, date),
    ]);

  return {
    nuts,
    dailyLogData,
    monthStreak: calculateMonthlyStreak(monthLogDates, date),
    monthRecordDays: monthLogDates.length,
    recordedDates,
    skippedDates,
  };
}

function formatJaLabel(date: string): string {
  const parsedDate = parseYmd(date);

  return `${parsedDate.getMonth() + 1}/${parsedDate.getDate()}（${DAYS_OF_WEEK_JA[parsedDate.getDay()]}）`;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const date = params.date;

  if (!date) {
    return <DateInitializer />;
  }

  try {
    const {
      nuts,
      dailyLogData,
      monthStreak,
      monthRecordDays,
      recordedDates,
      skippedDates,
    } = await fetchDailyPageData(date);

    const selectedNutIds = toNumericNutIds(dailyLogData.selectedNutIds);
    const hasSelectedNuts = selectedNutIds.length > 0;
    const isSaved = dailyLogData.dailyLog !== null && hasSelectedNuts;
    const scoreResult = computeDailyScores(nuts, selectedNutIds);
    const comment = isSaved
      ? generateDailyComment({ date, scoreResult })
      : undefined;
    const dateLabel = formatJaLabel(date);
    const isSkipped = skippedDates.includes(date);

    return (
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px] lg:gap-6">
        <section className="grid grid-cols-1 gap-5 lg:gap-6">
          <div className={CARD_CLASS_NAME}>
            <div className="p-5">
              <Suspense fallback={<LoadingPlaceholder />}>
                <NutCheckList
                  nuts={nuts}
                  selectedNutIds={dailyLogData.selectedNutIds}
                  date={date}
                  isSkipped={isSkipped}
                />
              </Suspense>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
            <div className={CARD_CLASS_NAME}>
              <div className="p-5">
                <CalendarPicker
                  selectedDate={date}
                  recordedDates={recordedDates}
                  skippedDates={skippedDates}
                />
              </div>
            </div>

            <div className={CARD_CLASS_NAME}>
              <div className="p-5">
                <TodayScore
                  isSaved={isSaved}
                  scores={isSaved ? scoreResult.scores : undefined}
                  comment={comment}
                  emptyMessage={SCORE_EMPTY_MESSAGE}
                  dateLabel={dateLabel}
                />
              </div>
            </div>
          </div>
        </section>

        <aside className={CARD_CLASS_NAME}>
          <div className="p-5">
            <Suspense fallback={<LoadingPlaceholder />}>
              <CharacterStreak
                baseDate={date}
                streak={monthStreak}
                recordDays={monthRecordDays}
              />
            </Suspense>
          </div>
        </aside>
      </div>
    );
  } catch (error) {
    console.error("Failed to load daily dashboard page", error);

    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-card-foreground">
            ナッツバランス記録
          </h1>
        </div>
        <div className="max-w-lg mx-auto">
          <ErrorMessage message="データの読み込み中にエラーが発生しました。" />
        </div>
      </div>
    );
  }
}
