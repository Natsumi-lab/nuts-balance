'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ActionResult } from '@/lib/types';

/**
 * 日々のナッツ記録を保存するServer Action
 *
 * @param date - 記録する日付（YYYY-MM-DD形式）
 * @param nutIds - 選択されたナッツのID配列
 * @returns 操作の成功/失敗とメッセージを含むActionResult
 */
export async function upsertDailyLog(date: string, nutIds: string[]): Promise<ActionResult> {
  try {
    // Supabaseクライアントの作成
    const supabase = await createClient();

    // 認証情報の取得
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        message: 'ログインが必要です'
      };
    }

    // 日付のバリデーション（YYYY-MM-DD形式かチェック）
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return {
        success: false,
        message: '日付の形式が不正です'
      };
    }

    // TODO: RPCが実装されたら、そちらを呼び出す
    // 以下は暫定実装

    // 1. daily_logsのupsert
    const { data: dailyLog, error: dailyLogError } = await supabase
      .from('daily_logs')
      .upsert({
        user_id: user.id,
        log_date: date
      })
      .select('id')
      .single();

    if (dailyLogError) {
      console.error('日誌の保存エラー:', dailyLogError);
      return {
        success: false,
        message: '日誌の保存に失敗しました'
      };
    }

    // 2. 既存のdaily_log_itemsを削除
    const { error: deleteError } = await supabase
      .from('daily_log_items')
      .delete()
      .eq('daily_log_id', dailyLog.id);

    if (deleteError) {
      console.error('既存記録の削除エラー:', deleteError);
      return {
        success: false,
        message: '既存の記録削除に失敗しました'
      };
    }

    // 3. 選択されたナッツを挿入
    if (nutIds.length > 0) {
      const dailyLogItems = nutIds.map(nutId => ({
        daily_log_id: dailyLog.id,
        nut_id: nutId
      }));

      const { error: insertError } = await supabase
        .from('daily_log_items')
        .insert(dailyLogItems);

      if (insertError) {
        console.error('ナッツ記録の挿入エラー:', insertError);
        return {
          success: false,
          message: 'ナッツ記録の保存に失敗しました'
        };
      }
    }

    // TODO: streaksの更新
    // こちらはRPCに移行する予定なので、暫定実装は省略

    // キャッシュをクリア
    revalidatePath('/app', 'page');

    return {
      success: true,
      message: '保存しました'
    };
  } catch (error) {
    console.error('Upsert error:', error);
    return {
      success: false,
      message: '予期せぬエラーが発生しました'
    };
  }
}