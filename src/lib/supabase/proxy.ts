import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { normalizePortalType } from "@/lib/auth/portal";
import { getSupabasePublicEnv, hasSupabasePublicEnv } from "@/lib/supabase/env";

function getPortalFromPath(pathname: string) {
  if (pathname === "/clinic" || pathname.startsWith("/clinic/")) {
    return "clinic";
  }

  if (pathname === "/patient" || pathname.startsWith("/patient/")) {
    return "patient";
  }

  if (pathname === "/center" || pathname.startsWith("/center/")) {
    return "center";
  }

  return null;
}

export async function proxy(request: NextRequest) {
  if (!hasSupabasePublicEnv()) {
    return NextResponse.next();
  }

  const requestedPortal = getPortalFromPath(request.nextUrl.pathname);

  if (!requestedPortal) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { url, anonKey } = getSupabasePublicEnv();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return response;
  }

  const portalType = normalizePortalType(
    user.user_metadata?.portal_type ?? user.app_metadata?.portal_type,
  );

  if (portalType && portalType !== requestedPortal) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${portalType}`;
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/clinic/:path*", "/patient/:path*", "/center/:path*"],
};
