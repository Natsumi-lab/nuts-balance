'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ActionResult } from '@/lib/types';

/**
 * 日々のナッツ記録を保存する Server Action
 *
 * - 同一ユーザー × 同一日付では daily_logs を 1 行だけ保持
 * - daily_log_items は「全削除 → 再 insert」で同期
 * - RLS 前提で user_id は auth.uid() と一致する必要あり
 *
 * @param date - 記録する日付（YYYY-MM-DD形式）
 * @param nutIds - 選択されたナッツID配列（DBでは bigint）
 * @returns 成功可否とメッセージ
 */
export async function upsertDailyLog(
  date: string,
  nutIds: Array<number | string>
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    // -----------------------------
    // 1. 認証ユーザー取得
    // -----------------------------
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error('auth.getUser error:', userError);
    }

    if (!user) {
      return { success: false, message: 'ログインが必要です' };
    }

    // -----------------------------
    // 2. 日付バリデーション
    // -----------------------------
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return { success: false, message: '日付の形式が不正です' };
    }

    // -----------------------------
    // 3. nutIds を number に正規化
    // -----------------------------
    const nutIdsNum = nutIds
      .map((v) => (typeof v === 'string' ? Number(v) : v))
      .filter((v) => Number.isFinite(v)) as number[];

    //  未選択は保存不可（=「記録」とは摂取があった日）
    if (nutIdsNum.length === 0) {
      return { success: false, message: 'ナッツを1つ以上選択してください' };
    }

    // -----------------------------
    // 4. RPC 実行
    // -----------------------------
    const { error: rpcError } = await supabase.rpc('upsert_daily_log', {
      p_log_date: date,
      p_nut_ids: nutIdsNum,
    });

    if (rpcError) {
      console.error('RPC 保存エラー:', rpcError);
      return { success: false, message: '日誌の保存に失敗しました' };
    }

    revalidatePath('/app');

    return { success: true, message: '保存しました' };
  } catch (error) {
    console.error('Upsert error:', error);
    return { success: false, message: '予期せぬエラーが発生しました' };
  }
}

/**
 * 「今日は食べなかった」
 *
 * - daily_logs は作らない（= 摂取があった日だけが「記録」）
 * - daily_skips に保存する（= 意図的に食べなかった日）
 * - 同日に daily_logs が存在していた場合は削除してスキップへ置換（DB側RPCで担保）
 * - ストリークは切れる（current_streak = 0）
 *
 * @param date - 対象日付（YYYY-MM-DD形式）
 */
export async function skipToday(date: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    // -----------------------------
    // 1. 認証ユーザー取得
    // -----------------------------
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error('auth.getUser error:', userError);
    }

    if (!user) {
      return { success: false, message: 'ログインが必要です' };
    }

    // -----------------------------
    // 2. 日付バリデーション
    // -----------------------------
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return { success: false, message: '日付の形式が不正です' };
    }

    // -----------------------------
    // 3. RPC 実行（スキップ永続化）
    // -----------------------------
    const { error: rpcError } = await supabase.rpc('mark_daily_skip', {
      p_log_date: date,
    });

    if (rpcError) {
      console.error('RPC スキップエラー:', rpcError);
      return { success: false, message: 'スキップの保存に失敗しました' };
    }

    revalidatePath('/app');

    return { success: true, message: '今日は🥜食べませんでした' };
  } catch (error) {
    console.error('Skip error:', error);
    return { success: false, message: 'スキップ処理中にエラーが発生しました' };
  }
}
