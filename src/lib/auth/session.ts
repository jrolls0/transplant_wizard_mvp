import { normalizePortalType, type PortalType } from "./portal";
import { getOptionalServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

type PortalSessionSummary = {
  email: string | null;
  hasSession: boolean;
  isConfigured: boolean;
  portalMatches: boolean;
  portalType: PortalType | null;
  userId: string | null;
};

export async function getPortalSessionSummary(
  expectedPortal: PortalType,
): Promise<PortalSessionSummary> {
  if (!hasSupabasePublicEnv()) {
    return {
      email: null,
      hasSession: false,
      isConfigured: false,
      portalMatches: false,
      portalType: null,
      userId: null,
    };
  }

  const supabase = await getOptionalServerSupabaseClient();

  if (!supabase) {
    return {
      email: null,
      hasSession: false,
      isConfigured: false,
      portalMatches: false,
      portalType: null,
      userId: null,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const portalType = normalizePortalType(
    user?.user_metadata?.portal_type ?? user?.app_metadata?.portal_type,
  );

  return {
    email: user?.email ?? null,
    hasSession: Boolean(user),
    isConfigured: true,
    portalMatches: portalType === expectedPortal,
    portalType,
    userId: user?.id ?? null,
  };
}
