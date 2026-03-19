import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const LOGIN_PATH = "/auth/login";
const SETTINGS_PATH = "/settings";
const DEFAULT_REDIRECT_PATH = SETTINGS_PATH;
const HTML_CONTENT_TYPE = "text/html; charset=utf-8";

const AUTH_ERROR_MESSAGE = {
  AUTH_FAILED: "認証に失敗しました。もう一度お試しください。",
  OTP_EXPIRED: "認証リンクの有効期限が切れています。もう一度お試しください。",
  MISSING_PARAMS: "認証に必要な情報が不足しています。",
} as const;

const SETTINGS_INFO_MESSAGE = {
  EMAIL_CHANGE_PENDING:
    "確認リンクを受け付けました。もう一方のメールに届いたリンクも開いてください。",
  EMAIL_CHANGE_CONFIRMED: "メールアドレスを変更しました。",
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
 * hidden input に入れる値を安全な文字列へ変換する。
 * URL パラメータをそのまま HTML に埋め込むと、意図しない解釈をされる可能性があるため。
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
 * 先に値の形を統一すると、この後の条件分岐を短く読みやすくできるため。
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
 * redirect_to にはアプリ内パスだけを許可する。
 * 外部 URL や protocol-relative URL を受け入れると危険なため。
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

function createLoginErrorRedirect(
  origin: string,
  errorMessage:
    (typeof AUTH_ERROR_MESSAGE)[keyof typeof AUTH_ERROR_MESSAGE]
): NextResponse {
  const errorUrl = new URL(LOGIN_PATH, origin);
  errorUrl.searchParams.set("error", errorMessage);

  return NextResponse.redirect(errorUrl);
}

function createSettingsInfoRedirect(
  origin: string,
  infoMessage: string
): NextResponse {
  const infoUrl = new URL(SETTINGS_PATH, origin);
  infoUrl.searchParams.set("info", infoMessage);

  return NextResponse.redirect(infoUrl);
}

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

/**
 * 1通目のメール確認後は、message だけが付いた URL で戻ってくることがある。
 * このケースでは認証処理を続けるのではなく、設定画面へ案内を返す。
 */
function isEmailChangePendingMessage(message: string | null): boolean {
  if (!message) return false;

  return message.includes("Confirmation link accepted");
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
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
 * GET では認証を完了させず、確認画面だけを表示する。
 * メールアプリやブラウザの先読みでリンクが消費されるのを避けるため。
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const error = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  const message = searchParams.get("message");

  if (error) {
    const errorMessage =
      errorCode === "otp_expired"
        ? AUTH_ERROR_MESSAGE.OTP_EXPIRED
        : AUTH_ERROR_MESSAGE.AUTH_FAILED;

    return createLoginErrorRedirect(origin, errorMessage);
  }

  if (isEmailChangePendingMessage(message)) {
    return createSettingsInfoRedirect(
      origin,
      SETTINGS_INFO_MESSAGE.EMAIL_CHANGE_PENDING
    );
  }

  const code = searchParams.get("code");
  const token = searchParams.get("token");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const redirectTo =
    searchParams.get("redirect_to") ?? searchParams.get("next");

  const html = generateConfirmationHtml({
    code,
    token,
    tokenHash,
    type,
    redirectTo,
  });

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": HTML_CONTENT_TYPE,
    },
  });
}

/**
 * POST でだけ認証を確定する。
 * メールアドレス変更では、変更処理自体は完了しているのに
 * このタブだけ code 交換に失敗することがある。
 * その場合はログイン失敗にせず、設定画面へ案内を返す。
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

  /**
   * code がある場合は PKCE の認可コード交換を試す。
   * メール変更では、交換失敗でも変更自体は完了していることがあるため、
   * 設定画面へ戻して完了メッセージを表示する。
   */
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return createSettingsInfoRedirect(
        origin,
        SETTINGS_INFO_MESSAGE.EMAIL_CHANGE_CONFIRMED
      );
    }

    return createSettingsInfoRedirect(
      origin,
      SETTINGS_INFO_MESSAGE.EMAIL_CHANGE_CONFIRMED
    );
  }

  /**
   * token が pkce_ で始まる場合は PKCE フローとして扱う。
   */
  if (token?.startsWith("pkce_")) {
    const { error } = await supabase.auth.exchangeCodeForSession(token);

    if (error) {
      return createLoginErrorRedirect(
        origin,
        AUTH_ERROR_MESSAGE.AUTH_FAILED
      );
    }

    return successResponse;
  }

  /**
   * token_hash + type がある場合は OTP 検証を行う。
   */
  if (tokenHash && type && isValidEmailOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (error) {
      return createLoginErrorRedirect(
        origin,
        AUTH_ERROR_MESSAGE.OTP_EXPIRED
      );
    }

    return successResponse;
  }

  /**
   * token + type がある場合の後方互換処理。
   * verifyOtp には token_hash を渡す API だが、
   * 以前の導線との互換のため token も最後に受ける。
   */
  if (token && type && isValidEmailOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type,
    });

    if (error) {
      return createLoginErrorRedirect(
        origin,
        AUTH_ERROR_MESSAGE.OTP_EXPIRED
      );
    }

    return successResponse;
  }

  return createLoginErrorRedirect(
    origin,
    AUTH_ERROR_MESSAGE.MISSING_PARAMS
  );
}