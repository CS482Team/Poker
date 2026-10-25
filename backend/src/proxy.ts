import { createServerClient } from "@/app/supabaseClient.ts";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(list) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Logged-out users can't see protected pages
  if (!user && path.startsWith("/dashboard")) { // TODO: change dashboard to correct page
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Logged-in users skip the sign-in page
  if (user && path === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Real accounts skip signup; guests can still reach it to upgrade
  if (user && !user.is_anonymous && path === "/signup") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|auth/callback).*)"],
};