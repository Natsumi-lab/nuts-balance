'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ActionResult } from '@/lib/types';

const YMD_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function getJstTodayYmd(): string {
  const jst = new Date(Date.now() + JST_OFFSET_MS);
  return jst.toISOString().slice(0, 10);
}

function validateYmd(date: string): boolean {
  return YMD_REGEX.test(date);
}

function normalizeNutIds(nutIds: Array<number | string>): number[] {
  return nutIds
    .map((v) => (typeof v === 'string' ? Number(v) : v))
    .filter(Number.isFinite);
}

async function requireUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('auth.getUser error:', error);
  }

  if (!user) {
    return { supabase: null, user: null };
  }

  return { supabase, user };
}

/**
 * 日々のナッツ記録を保存する
 *
 * 仕様
 * - daily_logs は「ユーザー × 日付」で1行
 * - daily_log_items は毎回全同期
 * - RLS により user_id = auth.uid() が必須
 */
export async function upsertDailyLog(
  date: string,
  nutIds: Array<number | string>
): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();

    if (!user || !supabase) {
      return { success: false, message: 'ログインが必要です' };
    }

    if (!validateYmd(date)) {
      return { success: false, message: '日付の形式が不正です' };
    }

    const normalizedNutIds = normalizeNutIds(nutIds);

    if (normalizedNutIds.length === 0) {
      return { success: false, message: 'ナッツを1つ以上選択してください' };
    }

    const { error } = await supabase.rpc('upsert_daily_log', {
      p_log_date: date,
      p_nut_ids: normalizedNutIds,
    });

    if (error) {
      console.error('RPC upsert_daily_log error:', error);
      return { success: false, message: '日誌の保存に失敗しました' };
    }

    revalidatePath('/app');

    return { success: true, message: '保存しました' };
  } catch (error) {
    console.error('upsertDailyLog unexpected error:', error);
    return { success: false, message: '予期せぬエラーが発生しました' };
  }
}

/**
 * 「今日は食べなかった」
 *
 * 仕様
 * - daily_logs は作らない
 * - daily_skips に保存
 * - 同日ログがあれば削除してスキップへ置換（RPC側で担保）
 * - ストリークはリセット
 */
export async function skipToday(date: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireUser();

    if (!user || !supabase) {
      return { success: false, message: 'ログインが必要です' };
    }

    if (!validateYmd(date)) {
      return { success: false, message: '日付の形式が不正です' };
    }

    const todayYmd = getJstTodayYmd();

    if (date !== todayYmd) {
      return { success: false, message: 'スキップは今日のみ可能です' };
    }

    const { error } = await supabase.rpc('mark_daily_skip', {
      p_log_date: date,
    });

    if (error) {
      console.error('RPC mark_daily_skip error:', error);
      return { success: false, message: 'スキップの保存に失敗しました' };
    }

    revalidatePath('/app');

    return { success: true, message: '今日は🥜食べませんでした' };
  } catch (error) {
    console.error('skipToday unexpected error:', error);
    return { success: false, message: 'スキップ処理中にエラーが発生しました' };
  }
}