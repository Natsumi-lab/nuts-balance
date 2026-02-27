import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

type CookiesToSet = Array<{
  name: string;
  value: string;
  options: Parameters<NextResponse["cookies"]["set"]>[2];
}>;

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // redirect時に引き継ぐため、Supabaseが要求する形のまま退避
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
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const protectedPaths = ["/app", "/report", "/nuts", "/settings"];
  const isProtectedRoute = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (!session && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";

    const redirectResponse = NextResponse.redirect(url);

    cookiesToSet.forEach(({ name, value, options }) => {
      // 3引数のオーバーロードを使う（型が安定する）
      redirectResponse.cookies.set(name, value, options);
    });

    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*", "/report/:path*", "/nuts", "/settings/:path*"],
};