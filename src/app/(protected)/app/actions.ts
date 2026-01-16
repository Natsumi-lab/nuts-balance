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
  nutIds: Array<number | string> // フロントが string[] の可能性も考慮
): Promise<ActionResult> {
  try {
    // Supabase server client を生成
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
      return {
        success: false,
        message: 'ログインが必要です',
      };
    }

    // -----------------------------
    // 2. 日付バリデーション
    // -----------------------------
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return {
        success: false,
        message: '日付の形式が不正です',
      };
    }

    // -----------------------------
    // 3. nutIds を bigint 列に合わせて number に正規化
    //    nuts.id は小さい数値なので number で安全
    // -----------------------------
    const nutIdsNum = nutIds
      .map((v) => (typeof v === 'string' ? Number(v) : v))
      .filter((v) => Number.isFinite(v)) as number[];

    // -----------------------------
    // 4. 保存処理は RPC に集約（トランザクションで一括処理）
    //    - daily_logs upsert
    //    - daily_log_items 全削除→insert
    //    - streaks 再計算＆更新
    // -----------------------------
    const { error: rpcError } = await supabase.rpc('upsert_daily_log', {
      p_log_date: date,
      p_nut_ids: nutIdsNum, // bigint[] 相当
    });

    if (rpcError) {
      console.error('RPC 保存エラー:', rpcError);
      return {
        success: false,
        message: '日誌の保存に失敗しました',
      };
    }

    // -----------------------------
    // 8. キャッシュ再検証
    // -----------------------------
    revalidatePath('/app');

    return {
      success: true,
      message: '保存しました',
    };
  } catch (error) {
    console.error('Upsert error:', error);
    return {
      success: false,
      message: '予期せぬエラーが発生しました',
    };
  }
}
