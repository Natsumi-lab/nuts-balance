import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * アカウント削除 Route Handler
 *
 * 【セキュリティ要件】
 * - ログイン中の本人のみ削除可能
 * - クライアントから userId を受け取らない（必ずサーバー側で取得）
 * - 認証チェックは通常クライアントで実施
 * - 削除処理は Service Role で実行（RLSバイパスのため厳格管理）
 *
 * 【削除順序】
 * 1. auth.admin.deleteUser(userId) を先に実行
 *    → ユーザーが残るリスクを回避
 * 2. RPC(delete_user_account) で関連テーブルをトランザクション削除
 *    - daily_log_items
 *    - daily_logs
 *    - daily_skips
 *    - streaks
 *
 * 【設計意図】
 * - auth削除失敗時にユーザーが残らないことを優先
 * - DB削除は冪等なRPCで実行し、再実行可能にする
 */

export async function POST() {
  try {
    // 1) 認証チェック（ここで userId を確定させる）
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const userId = user.id;

    // 2) Service Role クライアント
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase env for admin operations");
      return NextResponse.json(
        { error: "サーバー設定エラーが発生しました" },
        { status: 500 }
      );
    }

    const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 3) authユーザー削除を先に実行
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(
      userId
    );

    if (authDeleteError) {
      console.error("Failed to delete auth user:", { userId, authDeleteError });
      return NextResponse.json(
        { error: "アカウントの削除に失敗しました" },
        { status: 500 }
      );
    }

    // 4) DBデータ削除（トランザクション）
    const { error: rpcError } = await adminClient.rpc("delete_user_account", {
      p_user_id: userId,
    });

    if (rpcError) {
      // authは消えているので、ここは運用で拾えるよう強めにログ
      console.error("Auth deleted but DB cleanup via RPC failed:", {
        userId,
        rpcError,
      });

      return NextResponse.json(
        {
          error:
            "アカウントは無効化されましたが、データ削除の一部に失敗しました。時間をおいて再度お試しください。",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "予期せぬエラーが発生しました" },
      { status: 500 }
    );
  }
}