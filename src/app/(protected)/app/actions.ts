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
    // 4. daily_logs を upsert
    //    UNIQUE(user_id, log_date) 制約を onConflict で明示
    // -----------------------------
    const { data: dailyLog, error: dailyLogError } = await supabase
      .from('daily_logs')
      .upsert(
        {
          user_id: user.id,
          log_date: date,
        },
        {
          onConflict: 'user_id,log_date', // ★ ここが重要
        }
      )
      .select('id')
      .single();

    if (dailyLogError) {
      console.error('日誌の保存エラー:', dailyLogError);
      return {
        success: false,
        message: '日誌の保存に失敗しました',
      };
    }

    // -----------------------------
    // 5. 既存の daily_log_items を全削除
    // -----------------------------
    const { error: deleteError } = await supabase
      .from('daily_log_items')
      .delete()
      .eq('daily_log_id', dailyLog.id);

    if (deleteError) {
      console.error('既存記録の削除エラー:', deleteError);
      return {
        success: false,
        message: '既存の記録削除に失敗しました',
      };
    }

    // -----------------------------
    // 6. 選択されたナッツを insert
    //    重複は UNIQUE(daily_log_id, nut_id) で防止
    // -----------------------------
    if (nutIdsNum.length > 0) {
      const uniqueNutIds = Array.from(new Set(nutIdsNum));

      const dailyLogItems = uniqueNutIds.map((nutId) => ({
        daily_log_id: dailyLog.id,
        nut_id: nutId,
      }));

      const { error: insertError } = await supabase
        .from('daily_log_items')
        .insert(dailyLogItems);

      if (insertError) {
        console.error('ナッツ記録の挿入エラー:', insertError);
        return {
          success: false,
          message: 'ナッツ記録の保存に失敗しました',
        };
      }
    }

    // -----------------------------
    // 7. TODO: ストリーク更新
    //    将来的に RPC(upsert_daily_log) に集約予定
    // -----------------------------

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
