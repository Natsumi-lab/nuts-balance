import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * アカウント削除 Route Handler
 *
 * 【セキュリティ要件】
 * - ログイン中の本人のみ削除可能
 * - クライアントからuserId受け取りは禁止
 * - サーバー側で認証チェック後、Service Role で削除実行
 *
 * 【削除順序】
 * 1. daily_log_items（daily_logs と結合して対象を特定）
 * 2. daily_logs（user_id で削除）
 * 3. streaks（user_id で削除）
 * 4. auth.admin.deleteUser（最後に実行）
 */
export async function POST() {
  try {
    // 1. 認証チェック（通常クライアントでセッション確認）
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // 2. Service Role クライアントを作成（削除処理用）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase environment variables for admin operations');
      return NextResponse.json(
        { error: 'サーバー設定エラーが発生しました' },
        { status: 500 }
      );
    }

    const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 3. daily_logs のID一覧を取得（daily_log_items 削除用）
    const { data: dailyLogs, error: logsQueryError } = await adminClient
      .from('daily_logs')
      .select('id')
      .eq('user_id', userId);

    if (logsQueryError) {
      console.error('Failed to query daily_logs:', logsQueryError);
      return NextResponse.json(
        { error: '日誌データの取得に失敗しました' },
        { status: 500 }
      );
    }

    // 4. daily_log_items を削除
    if (dailyLogs && dailyLogs.length > 0) {
      const logIds = dailyLogs.map((log) => log.id);

      const { error: itemsDeleteError } = await adminClient
        .from('daily_log_items')
        .delete()
        .in('daily_log_id', logIds);

      if (itemsDeleteError) {
        console.error('Failed to delete daily_log_items:', itemsDeleteError);
        return NextResponse.json(
          { error: '記録アイテムの削除に失敗しました' },
          { status: 500 }
        );
      }
    }

    // 5. daily_logs を削除
    const { error: logsDeleteError } = await adminClient
      .from('daily_logs')
      .delete()
      .eq('user_id', userId);

    if (logsDeleteError) {
      console.error('Failed to delete daily_logs:', logsDeleteError);
      return NextResponse.json(
        { error: '日誌データの削除に失敗しました' },
        { status: 500 }
      );
    }

    // 6. streaks を削除
    const { error: streaksDeleteError } = await adminClient
      .from('streaks')
      .delete()
      .eq('user_id', userId);

    if (streaksDeleteError) {
      console.error('Failed to delete streaks:', streaksDeleteError);
      return NextResponse.json(
        { error: 'ストリークデータの削除に失敗しました' },
        { status: 500 }
      );
    }

    // 7. auth ユーザーを削除
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(
      userId
    );

    if (authDeleteError) {
      console.error('Failed to delete auth user:', authDeleteError);
      return NextResponse.json(
        { error: 'アカウントの削除に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: '予期せぬエラーが発生しました' },
      { status: 500 }
    );
  }
}
