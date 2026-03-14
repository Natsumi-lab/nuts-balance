import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const LOGIN_PATH = "/auth/login";
const DEFAULT_REDIRECT_PATH = "/settings";
const HTML_CONTENT_TYPE = "text/html; charset=utf-8";

const AUTH_ERROR = {
  AUTH_FAILED: "auth_failed",
  OTP_EXPIRED: "otp_expired",
  MISSING_PARAMS: "missing_params",
} as const;

const VALID_EMAIL_OTP_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

/**
 * hidden input の value に入れる文字を安全な形に変換する。
 * URLパラメータの値をそのまま HTML に入れると、画面が意図しない形で壊れることがあるため。
 */
function escapeHtmlAttr(value: string | null): string {
  if (!value) return "";

  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * 空文字や空白だけの値を null にそろえる。
 * 最初に値の形をそろえておくと、この後の if 文が読みやすくなるため。
 */
function normalizeFormValue(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;

  const trimmedValue = value.trim();
  return trimmedValue === "" ? null : trimmedValue;
}

function isValidEmailOtpType(value: string): value is EmailOtpType {
  return VALID_EMAIL_OTP_TYPES.includes(value as EmailOtpType);
}

/**
 * リダイレクト先として使ってよいパスだけを許可する。
 * アプリの外に飛ぶ値まで受け入れると危険なので、
 * このアプリ内のパスだけ使えるようにしている。
 */
function getSafeRedirectPath(
  path: string | null,
  fallbackPath: string
): string {
  if (!path) return fallbackPath;

  const trimmedPath = path.trim();

  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmedPath)) {
    return fallbackPath;
  }

  if (trimmedPath.startsWith("//")) {
    return fallbackPath;
  }

  if (trimmedPath.startsWith("/")) {
    return trimmedPath;
  }

  return fallbackPath;
}

/**
 * ログイン画面にエラー付きで戻すためのレスポンスを作る。
 * 同じ処理が何回も出てくるので関数にまとめている。
 */
function createLoginErrorRedirect(
  origin: string,
  errorCode: (typeof AUTH_ERROR)[keyof typeof AUTH_ERROR]
): NextResponse {
  const errorUrl = new URL(LOGIN_PATH, origin);
  errorUrl.searchParams.set("error", errorCode);

  return NextResponse.redirect(errorUrl);
}

/**
 * Supabase のサーバークライアントを作る。
 * 認証後に受け取った cookie をリダイレクトレスポンスに反映するため、
 * request と response の両方を受け取るようにしている。
 */
function createSupabaseClient(
  request: NextRequest,
  response: NextResponse
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );
}

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
 * GET では認証を完了せず、確認画面だけを表示する。
 * メールアプリやブラウザがリンク先を先に開くことがあり、
 * その時点で認証してしまうと、本人が押したときにリンクが使えなくなることがあるため。
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const error = searchParams.get("error");
  const errorCode = searchParams.get("error_code");

  if (error) {
    const normalizedErrorCode =
      errorCode === "otp_expired"
        ? AUTH_ERROR.OTP_EXPIRED
        : AUTH_ERROR.AUTH_FAILED;

    return createLoginErrorRedirect(origin, normalizedErrorCode);
  }

  const html = generateConfirmationHtml({
    code: searchParams.get("code"),
    token: searchParams.get("token"),
    tokenHash: searchParams.get("token_hash"),
    type: searchParams.get("type"),
    redirectTo:
      searchParams.get("redirect_to") ?? searchParams.get("next"),
  });

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": HTML_CONTENT_TYPE },
  });
}

/**
 * POST でだけ認証を確定する。
 * 認証リンクには複数の形式があるため、
 * どの値が届いたかを順番に確認しながら処理している。
 */
export async function POST(request: NextRequest) {
  const { origin } = request.nextUrl;
  const formData = await request.formData();

  const code = normalizeFormValue(formData.get("code"));
  const token = normalizeFormValue(formData.get("token"));
  const tokenHash = normalizeFormValue(formData.get("token_hash"));
  const type = normalizeFormValue(formData.get("type"));
  const redirectTo = normalizeFormValue(formData.get("redirect_to"));

  const redirectPath = getSafeRedirectPath(
    redirectTo,
    DEFAULT_REDIRECT_PATH
  );
  const successUrl = new URL(redirectPath, origin);
  const successResponse = NextResponse.redirect(successUrl);

  const supabase = createSupabaseClient(request, successResponse);

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return createLoginErrorRedirect(origin, AUTH_ERROR.AUTH_FAILED);
    }

    return successResponse;
  }

  if (token?.startsWith("pkce_")) {
    const { error } = await supabase.auth.exchangeCodeForSession(token);

    if (error) {
      return createLoginErrorRedirect(origin, AUTH_ERROR.AUTH_FAILED);
    }

    return successResponse;
  }

  if (tokenHash && type && isValidEmailOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (error) {
      return createLoginErrorRedirect(origin, AUTH_ERROR.OTP_EXPIRED);
    }

    return successResponse;
  }

  if (token && type && isValidEmailOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type,
    });

    if (error) {
      return createLoginErrorRedirect(origin, AUTH_ERROR.OTP_EXPIRED);
    }

    return successResponse;
  }

  return createLoginErrorRedirect(origin, AUTH_ERROR.MISSING_PARAMS);
}