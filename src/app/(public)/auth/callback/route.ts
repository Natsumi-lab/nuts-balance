import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * HTML属性値をエスケープ（XSS対策）
 */
function escapeHtmlAttr(str: string | null): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * EmailOtpType として有効な値かどうかを判定する型ガード
 */
function isValidEmailOtpType(value: string): value is EmailOtpType {
  const valid: EmailOtpType[] = [
    "signup",
    "invite",
    "magiclink",
    "recovery",
    "email_change",
    "email",
  ];
  return valid.includes(value as EmailOtpType);
}

/**
 * 安全なリダイレクト先を取得（同一オリジンのみ許可）
 * - 絶対URL/任意スキームを拒否（https:, javascript: 等）
 * - protocol-relative URL (//evil.com) を拒否
 * - "/" で始まる相対パスのみ許可
 */
function getSafeRedirectPath(path: string | null, fallback: string): string {
  if (!path) return fallback;

  const p = path.trim();

  // 絶対URLや任意スキーム（https:, javascript: など）は拒否
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(p)) return fallback;

  // protocol-relative URL（//evil.com）を拒否
  if (p.startsWith("//")) return fallback;

  // 同一オリジンの相対パス（"/" で始まるもの）のみ許可
  if (p.startsWith("/")) return p;

  return fallback;
}

/**
 * 確認画面の HTML を生成
 */
function generateConfirmationHtml(params: {
  code: string | null;
  token: string | null;
  tokenHash: string | null;
  type: string | null;
  redirectTo: string | null;
}): string {
  const { code, token, tokenHash, type, redirectTo } = params;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>認証確認 - nuts balance</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      padding: 40px;
      max-width: 400px;
      width: 100%;
      text-align: center;
    }
    h1 {
      color: #2d3748;
      font-size: 1.5rem;
      margin-bottom: 16px;
    }
    p {
      color: #718096;
      margin-bottom: 24px;
      line-height: 1.6;
    }
    .button {
      background: linear-gradient(135deg, #FBE38E 0%, #E98A3F 100%);
      color: white;
      border: none;
      border-radius: 12px;
      padding: 16px 32px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(233, 138, 63, 0.4);
    }
    .button:active {
      transform: translateY(0);
    }
    .icon {
      font-size: 3rem;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🥜</div>
    <h1>認証を確認</h1>
    <p>ボタンをクリックして認証を完了してください。</p>
    <form method="POST">
      <input type="hidden" name="code" value="${escapeHtmlAttr(code)}" />
      <input type="hidden" name="token" value="${escapeHtmlAttr(token)}" />
      <input type="hidden" name="token_hash" value="${escapeHtmlAttr(tokenHash)}" />
      <input type="hidden" name="type" value="${escapeHtmlAttr(type)}" />
      <input type="hidden" name="redirect_to" value="${escapeHtmlAttr(redirectTo)}" />
      <button type="submit" class="button">確認して続行</button>
    </form>
  </div>
</body>
</html>`;
}

/**
 * GET: 確認画面を表示（認証処理は行わない）
 * プリフェッチによるトークン消費を防ぐ
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const code = searchParams.get("code");
  const token = searchParams.get("token");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const redirectTo = searchParams.get("redirect_to") ?? searchParams.get("next");

  const html = generateConfirmationHtml({
    code,
    token,
    tokenHash,
    type,
    redirectTo,
  });

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

/**
 * POST: 実際の認証処理を行う
 */
export async function POST(request: NextRequest) {
  const { origin } = request.nextUrl;
  const formData = await request.formData();

  const code = formData.get("code") as string | null;
  const token = formData.get("token") as string | null;
  const tokenHash = formData.get("token_hash") as string | null;
  const type = formData.get("type") as string | null;
  const redirectTo = formData.get("redirect_to") as string | null;

  // 空文字を null に変換
  const normalizedCode = code && code.trim() !== "" ? code : null;
  const normalizedToken = token && token.trim() !== "" ? token : null;
  const normalizedTokenHash =
    tokenHash && tokenHash.trim() !== "" ? tokenHash : null;
  const normalizedType = type && type.trim() !== "" ? type : null;

  const redirectPath = getSafeRedirectPath(redirectTo, "/settings");
  const successUrl = new URL(redirectPath, origin);

  // 成功時に返す redirect レスポンスを先に作成
  const redirectResponse = NextResponse.redirect(successUrl);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            redirectResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // (1) code がある場合（通常 PKCE フロー）
  if (normalizedCode) {
    const { error } = await supabase.auth.exchangeCodeForSession(normalizedCode);
    if (error) {
      const errorUrl = new URL("/auth/login", origin);
      errorUrl.searchParams.set("error", "auth_failed");
      return NextResponse.redirect(errorUrl);
    }
    return redirectResponse;
  }

  // (2) token が pkce_ で始まる場合は最優先で exchange（verifyOtpしない）
  if (normalizedToken && normalizedToken.startsWith("pkce_")) {
    const { error } = await supabase.auth.exchangeCodeForSession(normalizedToken);
    if (error) {
      const errorUrl = new URL("/auth/login", origin);
      errorUrl.searchParams.set("error", "auth_failed");
      return NextResponse.redirect(errorUrl);
    }
    return redirectResponse;
  }

  // (3) token_hash + type がある場合
  if (normalizedTokenHash && normalizedType && isValidEmailOtpType(normalizedType)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: normalizedTokenHash,
      type: normalizedType,
    });

    if (error) {
      const errorUrl = new URL("/auth/login", origin);
      errorUrl.searchParams.set("error", "otp_expired");
      return NextResponse.redirect(errorUrl);
    }

    return redirectResponse;
  }

  // (4) token + type がある場合（pkce_ ではない OTP 系）
  if (normalizedToken && normalizedType && isValidEmailOtpType(normalizedType)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: normalizedToken,
      type: normalizedType,
    });

    if (error) {
      const errorUrl = new URL("/auth/login", origin);
      errorUrl.searchParams.set("error", "otp_expired");
      return NextResponse.redirect(errorUrl);
    }

    return redirectResponse;
  }

  // パラメータ不足
  const errorUrl = new URL("/auth/login", origin);
  errorUrl.searchParams.set("error", "missing_params");
  return NextResponse.redirect(errorUrl);
}