import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_PATHS = ["/app", "/report", "/nuts", "/settings"];
const LOGIN_PATH = "/auth/login";

type CookiesToSet = Array<{
  name: string;
  value: string;
  options: Parameters<NextResponse["cookies"]["set"]>[2];
}>;

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const cookiesToSet: CookiesToSet = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (newCookies) => {
          newCookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
            cookiesToSet.push({ name, value, options });
          });
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path),
  );

  if (!session && isProtectedRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;

    const redirectResponse = NextResponse.redirect(loginUrl);

    cookiesToSet.forEach(({ name, value, options }) => {
      redirectResponse.cookies.set(name, value, options);
    });

    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*", "/report/:path*", "/nuts", "/settings/:path*"],
};