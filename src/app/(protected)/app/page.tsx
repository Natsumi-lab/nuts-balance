import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Nut, DailyLogData } from "@/lib/types";
import NutCheckList from "./NutCheckList";
import DateSelector from "./DateSelector";
import UserInfo from "./UserInfo";
import DateInitializer from "./DateInitializer";
import CalendarPicker from "./CalendarPicker";

/**
 * 日付パラメータの型
 */
interface PageProps {
  searchParams: Promise<{
    date?: string;
  }>;
}

/**
 * エラーメッセージコンポーネント
 */
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
          <button
            className="px-5 py-2.5 rounded-xl border border-[#E6E6E4] text-sm bg-white hover:bg-[#F2F2F0] text-[#333] shadow-md transition-all"
            onClick={() => window.location.reload()}
          >
            再読み込み
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * ローディングプレースホルダコンポーネント
 */
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

/**
 * 指定日付のナッツ記録とユーザーデータを取得
 */
async function fetchDailyData(date: string): Promise<{
  nuts: Nut[];
  dailyLogData: DailyLogData;
  streak: number;
}> {
  const supabase = await createClient();

  // 1. ナッツ一覧を取得
  const { data: nuts, error: nutsError } = await supabase
    .from("nuts")
    .select("*")
    .order("id");

  if (nutsError) {
    console.error("ナッツの取得に失敗しました:", nutsError);
    throw new Error("ナッツの取得に失敗しました");
  }

  // 2. 指定日付の日記を取得（RLS前提でuser_id条件は不要）
  const { data: dailyLog, error: dailyLogError } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("log_date", date)
    .maybeSingle();

  if (dailyLogError) {
    console.error("日誌の取得に失敗しました:", dailyLogError);
    throw new Error("日誌の取得に失敗しました");
  }

  // 3. 日記があれば、その日のナッツ選択を取得
  let selectedNutIds: string[] = [];

  if (dailyLog) {
    const { data: dailyLogItems, error: itemsError } = await supabase
      .from("daily_log_items")
      .select("nut_id")
      .eq("daily_log_id", dailyLog.id);

    if (itemsError) {
      console.error("日誌アイテムの取得に失敗しました:", itemsError);
      throw new Error("日誌アイテムの取得に失敗しました");
    }

    selectedNutIds = dailyLogItems.map((item) => item.nut_id);
  }

  // 4. ストリーク情報を取得
  const { data: streakData, error: streakError } = await supabase
    .from("streaks")
    .select("*")
    .maybeSingle();

  if (streakError) {
    console.error("ストリーク情報の取得に失敗しました:", streakError);
    throw new Error("ストリーク情報の取得に失敗しました");
  }

  return {
    nuts: nuts as Nut[],
    dailyLogData: {
      dailyLog: dailyLog || null,
      selectedNutIds,
    },
    streak: streakData?.current_streak || 0,
  };
}

/**
 * メインページコンポーネント
 */
export default async function Page({ searchParams }: PageProps) {
  // URLクエリパラメータから日付を取得
  const params = await searchParams;
  const { date } = params;

  // 日付が指定されていない場合は日付初期化コンポーネントを表示
  if (!date) {
    return <DateInitializer />;
  }

  try {
    // データ取得
    const { nuts, dailyLogData, streak } = await fetchDailyData(date);
    const [y, m, d] = date.split("-").map(Number);
    const dateLabel = `${m}月${d}日のナッツ記録`;

    return (
      <main className="min-h-screen px-4 py-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 左カラム: 日付選択 */}
            <div className="bg-[#FAFAF8] border border-white/20 rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-[#F8F8F6] border-b border-[#E6E6E4] pb-3 p-4">
                <h3 className="text-lg font-semibold text-[#333]">日付選択</h3>
              </div>
              <div className="p-5 space-y-6">
                <DateSelector date={date} />
                <div className="h-px my-4 bg-[#E6E6E4]"></div>
                <CalendarPicker selectedDate={date} />
              </div>
            </div>

            {/* 中央カラム: ナッツチェックリスト */}
            <div className="bg-[#FAFAF8] border border-white/20 rounded-2xl shadow-lg md:col-span-1 overflow-hidden">
              <div className="bg-[#F8F8F6] border-b border-[#E6E6E4] pb-3 p-4">
                <h3 className="text-lg font-semibold text-[#333]">
                  {dateLabel}
                </h3>
              </div>

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

            {/* 右カラム: ユーザー情報 */}
            <div className="bg-[#FAFAF8] border border-white/20 rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-[#F8F8F6] border-b border-[#E6E6E4] pb-3 p-4">
                <h3 className="text-lg font-semibold text-[#333]">
                  マイプロフィール
                </h3>
              </div>
              <div className="p-0">
                <Suspense fallback={<LoadingPlaceholder />}>
                  <UserInfo streak={streak} />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error("ページ表示エラー:", error);
    return (
      <main className="min-h-screen px-4 py-8">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-[#333] mb-2">
              ナッツバランス記録
            </h1>
            <div className="h-px mt-6 bg-white/40 max-w-xl mx-auto"></div>
          </div>

          <div className="max-w-lg mx-auto mt-12">
            <ErrorMessage message="データの読み込み中にエラーが発生しました。しばらくしてから再度お試しください。" />
          </div>
        </div>
      </main>
    );
  }
}
