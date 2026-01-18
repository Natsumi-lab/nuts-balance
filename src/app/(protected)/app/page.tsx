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
    <div className="border rounded-lg shadow-sm p-5 border-accent/20 bg-muted/20">
      <div className="pb-2 border-b border-border/30">
        <h3 className="text-lg font-semibold text-accent-foreground">
          エラーが発生しました
        </h3>
      </div>
      <div className="pt-4">
        <p className="text-muted-foreground">{message}</p>
        <div className="mt-4">
          <button
            className="px-4 py-2 rounded-md border border-border text-sm bg-card hover:bg-muted/50 transition-colors"
            onClick={() => window.location.reload()}>
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
    <div className="bg-card/50 border border-border/50 rounded-lg shadow-sm">
      <div className="flex items-center justify-center h-64 p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">読み込み中...</p>
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

    return (
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">
            ナッツバランス記録
          </h1>
          <p className="text-muted-foreground">オーガニックナッツの摂取バランスを記録して健康管理をサポート</p>
          <div className="h-px mt-6 bg-border/60 max-w-xl mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 左カラム: 日付選択 */}
          <div className="bg-card/80 border border-border/70 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-muted/30 border-b border-border/30 pb-3 p-4">
              <h3 className="text-lg font-semibold text-foreground/90">日付選択</h3>
            </div>
            <div className="p-4 space-y-6 pt-5">
              <DateSelector date={date} />
              <div className="h-px my-4 bg-border/40"></div>
              <CalendarPicker selectedDate={date} />
            </div>
          </div>

          {/* 中央カラム: ナッツチェックリスト */}
          <div className="bg-card/80 border border-primary/10 rounded-lg shadow-md md:col-span-1">
            <div className="bg-primary/5 border-b border-primary/10 pb-3 p-4">
              <h3 className="text-lg font-semibold text-primary-foreground/90">今日のナッツ記録</h3>
            </div>
            <div className="p-0 pt-1">
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
          <div className="bg-card/80 border border-secondary/20 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-secondary/5 border-b border-secondary/10 pb-3 p-4">
              <h3 className="text-lg font-semibold text-secondary-foreground/90">マイプロフィール</h3>
            </div>
            <div className="p-0">
              <Suspense fallback={<LoadingPlaceholder />}>
                <UserInfo streak={streak} />
              </Suspense>
            </div>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error("ページ表示エラー:", error);
    return (
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">
            ナッツバランス記録
          </h1>
          <div className="h-px mt-6 bg-border/60 max-w-xl mx-auto"></div>
        </div>

        <div className="max-w-lg mx-auto mt-12">
          <ErrorMessage message="データの読み込み中にエラーが発生しました。しばらくしてから再度お試しください。" />
        </div>
      </main>
    );
  }
}
