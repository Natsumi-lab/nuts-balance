/**
 * ナッツマスター情報の型定義
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
 * 日誌の型定義
 */
export type DailyLog = {
  id: string;
  user_id: string;
  log_date: string;
  created_at: string;
  updated_at: string;
};

/**
 * 日誌に記録されたナッツアイテムの型定義
 */
export type DailyLogItem = {
  id: string;
  daily_log_id: string;
  nut_id: number;
  created_at: string;
};

/**
 * ユーザーのストリーク情報の型定義
 */
export type Streak = {
  user_id: string;
  current_streak: number;
  last_logged_date: string | null;
  updated_at: string;
};

/**
 * 日付に基づいた日誌データの型定義
 */
export type DailyLogData = {
  dailyLog: DailyLog | null;
  selectedNutIds: string[];
};

/**
 * Server Actionの結果の型定義
 */
export type ActionResult = {
  success: boolean;
  message: string;
};