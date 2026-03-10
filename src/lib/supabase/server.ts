import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabasePublicEnv, hasSupabasePublicEnv } from "./env";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabasePublicEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server components can read cookies but cannot always write them.
        }
      },
    },
  });
}

export async function getOptionalServerSupabaseClient() {
  if (!hasSupabasePublicEnv()) {
    return null;
  }

  return createServerSupabaseClient();
}

export const createClient = createServerSupabaseClient;
