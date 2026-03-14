import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function errorResponse(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return errorResponse("ログインが必要です", 401);
    }

    const userId = user.id;

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      console.error("Missing Supabase env for admin operations");
      return errorResponse("サーバー設定エラーが発生しました");
    }

    const adminClient = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // authユーザー削除を先に実行する
    const { error: authDeleteError } =
      await adminClient.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error("Failed to delete auth user:", { userId, authDeleteError });

      return errorResponse("アカウントの削除に失敗しました");
    }

    // DBデータ削除（RPCでトランザクション実行）
    const { error: rpcError } = await adminClient.rpc("delete_user_account", {
      p_user_id: userId,
    });

    if (rpcError) {
      console.error("Auth deleted but DB cleanup via RPC failed:", {
        userId,
        rpcError,
      });

      return errorResponse(
        "アカウントは無効化されましたが、データ削除の一部に失敗しました。時間をおいて再度お試しください。"
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account deletion error:", error);
    return errorResponse("予期せぬエラーが発生しました");
  }
}