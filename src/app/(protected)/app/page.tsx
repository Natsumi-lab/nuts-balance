import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Nut, DailyLogData } from "@/lib/types";
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

interface PageProps {
  searchParams: Promise<{
    date?: string;
  }>;
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="border rounded-2xl shadow-lg p-5 border-white/20 bg-[#FAFAF8]">
      <div className="pb-3 border-b border-[#E6E6E4]">
        <h3 className="text-lg font-semibold text-[#E38B3A]">
          エラーが発生しました
        </h3>
      </div>
      <div className="pt-4">
        <p className="text-[#555]">{message}</p>
        <div className="mt-5">
          <a
            href=""
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-[#E6E6E4] text-sm bg-white hover:bg-[#F2F2F0] text-[#333] shadow-md transition-all"
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
    <div className="bg-[#FAFAF8] border border-white/20 rounded-2xl shadow-md">
      <div className="flex items-center justify-center h-64 p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-[#9FBFAF] border-t-[#E38B3A]"></div>
          <p className="text-sm text-[#555]">読み込み中...</p>
        </div>
      </div>
    </div>
  );
}

/** YYYY-MM-DD -> Date */
function parseYmd(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Date -> YYYY-MM-DD */
function formatYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 今月範囲（開始:月初、終了:翌月初） */
function getMonthRangeYmd(baseYmd: string) {
  const base = parseYmd(baseYmd);
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const nextStart = new Date(base.getFullYear(), base.getMonth() + 1, 1);
  return { startYmd: formatYmd(start), nextStartYmd: formatYmd(nextStart) };
}

/**
 * 今月ストリーク（baseYmdから遡る。月初より前はカウントしない）
 * 仕様：baseYmd が未記録なら 0
 */
function calcMonthlyStreak(logDatesYmd: string[], baseYmd: string): number {
  const set = new Set(logDatesYmd);
  if (!set.has(baseYmd)) return 0;

  const base = parseYmd(baseYmd);
  const monthStart = new Date(base.getFullYear(), base.getMonth(), 1);

  const cur = new Date(base);
  let count = 0;

  while (cur.getTime() >= monthStart.getTime()) {
    const ymd = formatYmd(cur);
    if (!set.has(ymd)) break;
    count += 1;
    cur.setDate(cur.getDate() - 1);
  }

  return count;
}

async function fetchDailyData(date: string): Promise<{
  nuts: Nut[];
  dailyLogData: DailyLogData;
  monthStreak: number;
  monthRecordDays: number;
  recordedDates: string[];
  skippedDates: string[];
}> {
  const supabase = await createClient();

  const { data: nuts, error: nutsError } = await supabase
    .from("nuts")
    .select("*")
    .order("id");

  if (nutsError) throw new Error("ナッツの取得に失敗しました");

  const { data: dailyLog, error: dailyLogError } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("log_date", date)
    .maybeSingle();

  if (dailyLogError) throw new Error("日誌の取得に失敗しました");

  let selectedNutIds: string[] = [];

  if (dailyLog) {
    const { data: dailyLogItems, error: itemsError } = await supabase
      .from("daily_log_items")
      .select("nut_id")
      .eq("daily_log_id", dailyLog.id);

    if (itemsError) throw new Error("日誌アイテムの取得に失敗しました");

    selectedNutIds = dailyLogItems.map((item) => item.nut_id);
  }

  //  今月の集計（月次リセット）
  const { startYmd, nextStartYmd } = getMonthRangeYmd(date);

  const { data: monthLogs, error: monthErr } = await supabase
    .from("daily_logs")
    .select("log_date")
    .gte("log_date", startYmd)
    .lt("log_date", nextStartYmd)
    .order("log_date", { ascending: true });

  if (monthErr) throw new Error("今月の記録日数の取得に失敗しました");

  const monthLogDates = (monthLogs ?? []).map((r) => r.log_date as string);
  const monthRecordDays = monthLogDates.length;
  const monthStreak = calcMonthlyStreak(monthLogDates, date);

  //  カレンダー用：記録がある日付一覧（摂取日）
  const { data: recordedLogs, error: recordedLogsError } = await supabase
    .from("daily_logs")
    .select("log_date");

  if (recordedLogsError) throw new Error("記録日付一覧の取得に失敗しました");

  // ✅ カレンダー用：スキップ日一覧
  const { data: skippedLogs, error: skippedLogsError } = await supabase
    .from("daily_skips")
    .select("log_date");

  if (skippedLogsError) throw new Error("スキップ日付一覧の取得に失敗しました");

  return {
    nuts: nuts as Nut[],
    dailyLogData: {
      dailyLog: dailyLog || null,
      selectedNutIds,
    },
    monthStreak,
    monthRecordDays,
    recordedDates: (recordedLogs ?? []).map((log) => log.log_date),
    skippedDates: (skippedLogs ?? []).map((log) => log.log_date),
  };
}

function formatJaLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return `${dt.getMonth() + 1}/${dt.getDate()}（${days[dt.getDay()]}）`;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const { date } = params;

  if (!date) return <DateInitializer />;

  try {
    const {
      nuts,
      dailyLogData,
      monthStreak,
      monthRecordDays,
      recordedDates,
      skippedDates,
    } = await fetchDailyData(date);

    const savedSelectedIds = dailyLogData.selectedNutIds
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v));

    const hasSelection = savedSelectedIds.length > 0;
    const isSaved = dailyLogData.dailyLog !== null && hasSelection;

    const scoreResult = computeDailyScores(nuts, savedSelectedIds);

    //  コメントにも「今月streak」を使ってUIと一致させる
    const comment = isSaved
      ? generateDailyComment({ date, streak: monthStreak, scoreResult })
      : undefined;

    const dateLabel = formatJaLabel(date);

    return (
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px] lg:gap-6">
        <section className="grid grid-cols-1 gap-5 lg:gap-6">
          <div className="bg-[#FAFAF8] border border-white/20 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-5">
              <Suspense fallback={<LoadingPlaceholder />}>
                <NutCheckList
                  nuts={nuts}
                  selectedNutIds={dailyLogData.selectedNutIds}
                  date={date}
                />
              </Suspense>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
            <div className="bg-[#FAFAF8] border border-white/20 rounded-2xl shadow-lg overflow-hidden">
              <div className="p-5">
                <CalendarPicker
                  selectedDate={date}
                  recordedDates={recordedDates}
                  skippedDates={skippedDates}
                />
              </div>
            </div>

            <div className="bg-[#FAFAF8] border border-white/20 rounded-2xl shadow-lg overflow-hidden">
              <div className="p-5">
                <TodayScore
                  isSaved={isSaved}
                  scores={isSaved ? scoreResult.scores : undefined}
                  comment={isSaved ? comment : undefined}
                  emptyMessage={SCORE_EMPTY_MESSAGE}
                  dateLabel={dateLabel}
                />
              </div>
            </div>
          </div>
        </section>

        <aside className="bg-[#FAFAF8] border border-white/20 rounded-2xl shadow-lg overflow-hidden">
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
  } catch {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#333]">ナッツバランス記録</h1>
        </div>
        <div className="max-w-lg mx-auto">
          <ErrorMessage message="データの読み込み中にエラーが発生しました。" />
        </div>
      </div>
    );
  }
}
