import { proxy } from "./src/lib/supabase/proxy";

export { proxy };

export const config = {
  matcher: ["/clinic/:path*", "/patient/:path*", "/center/:path*"],
};
