/**
 * nuts テーブルの行データ
 */
export type Nut = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  image_path: string;
  score_antioxidant: number;
  score_mineral: number;
  score_fiber: number;
  score_vitamin: number;
  score_variety?: number | null;
  created_at: string;
  updated_at: string;
};

/**
 * daily_logs テーブルの行データ
 */
export type DailyLog = {
  id: string;
  user_id: string;
  log_date: string;
  created_at: string;
  updated_at: string;
};

/**
 * daily_log_items テーブルの行データ
 */
export type DailyLogItem = {
  id: string;
  daily_log_id: string;
  nut_id: number;
  created_at: string;
};

/**
 * streaks テーブルの行データ
 */
export type Streak = {
  user_id: string;
  current_streak: number;
  last_logged_date: string | null;
  updated_at: string;
};

/**
 * ある1日分の記録表示・編集に必要なデータ
 *
 * selectedNutIds はフォーム値に合わせて string[] とする。
 */
export type DailyLogData = {
  dailyLog: DailyLog | null;
  selectedNutIds: string[];
};

/**
 * Server Action の共通結果
 */
export type ActionResult = {
  success: boolean;
  message: string;
};