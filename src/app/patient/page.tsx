import { redirect } from "next/navigation";

import { PatientOnboardingView } from "@/components/patient-onboarding";
import { normalizePortalType } from "@/lib/auth/portal";
import {
  getPatientOnboardingStep,
  patientAuditEventTypes,
  type PatientOnboardingContext,
} from "@/lib/patient/onboarding";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PatientPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getPatientErrorMessage(code?: string) {
  switch (code) {
    case "audit_lookup_failed":
      return "We could not load the onboarding history for this referral.";
    case "case_missing":
      return "No onboarding case is available for this patient yet.";
    case "magic_link_exchange_failed":
      return "Your onboarding link could not be verified. Request a fresh link from the clinic.";
    case "magic_link_missing":
      return "Your onboarding link is missing the required sign-in token.";
    case "patient_missing":
      return "The patient record for this session could not be found.";
    case "portal_mismatch":
      return "The active session is not authorized for the patient portal.";
    case "roi_checkpoint_failed":
      return "ROI Form 2 could not complete the onboarding checkpoint.";
    case "roi_form_1_failed":
      return "ROI Form 1 could not be saved.";
    case "roi_form_1_invalid":
      return "Review both acknowledgements before signing ROI Form 1.";
    case "roi_form_1_unavailable":
      return "ROI Form 1 is not available for this case right now.";
    case "roi_form_2_invalid":
      return "Review both acknowledgements before signing ROI Form 2.";
    case "roi_form_2_unavailable":
      return "ROI Form 2 is not available until ROI Form 1 is complete.";
    case "service_role_missing":
      return "The patient onboarding write path is not configured.";
    case "session_required":
      return "Open your secure onboarding link to start the patient flow.";
    case "welcome_invalid":
      return "Select a valid preferred language before continuing.";
    case "welcome_unavailable":
      return "Welcome & Preferences is not available for this case right now.";
    case "welcome_save_failed":
      return "Your onboarding preferences could not be saved.";
    default:
      return null;
  }
}

function getAuthCallbackRedirect(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const callbackParams = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      callbackParams.set(key, value);
    }
  }

  if (!callbackParams.size) {
    return null;
  }

  if (callbackParams.has("code")) {
    return `/patient/auth/callback?${callbackParams.toString()}`;
  }

  return null;
}

async function getPatientOnboardingContext(userId: string) {
  const sessionSupabase = await createServerSupabaseClient();

  const { data: patient, error: patientError } = await sessionSupabase
    .from("patients")
    .select("id, email, first_name, last_name, preferred_language")
    .eq("auth_user_id", userId)
    .single();

  if (patientError || !patient) {
    return null;
  }

  const { data: currentCase, error: caseError } = await sessionSupabase
    .from("cases")
    .select(
      "id, case_number, email_consent, invite_link_generated_at, roi_form_1_signed_at, roi_form_2_signed_at, roi_completed_at, sms_consent, stage, stage_entered_at",
    )
    .eq("patient_id", patient.id)
    .in("stage", ["patient-onboarding", "initial-todos"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (caseError || !currentCase) {
    return null;
  }

  const { data: onboardingAccessEvent } = await sessionSupabase
    .from("audit_events")
    .select("created_at")
    .eq("case_id", currentCase.id)
    .eq("event_type", patientAuditEventTypes.onboardingAccessed)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const context: PatientOnboardingContext = {
    currentCase: {
      caseNumber: currentCase.case_number,
      emailConsent: currentCase.email_consent,
      id: currentCase.id,
      inviteLinkGeneratedAt: currentCase.invite_link_generated_at,
      roiForm1SignedAt: currentCase.roi_form_1_signed_at,
      roiForm2SignedAt: currentCase.roi_form_2_signed_at,
      roiCompletedAt: currentCase.roi_completed_at,
      smsConsent: currentCase.sms_consent,
      stage: currentCase.stage,
      stageEnteredAt: currentCase.stage_entered_at,
    },
    onboardingAccessedAt: onboardingAccessEvent?.created_at ?? null,
    patient: {
      email: patient.email,
      firstName: patient.first_name,
      id: patient.id,
      lastName: patient.last_name,
      preferredLanguage: patient.preferred_language,
    },
  };

  return context;
}

export default async function PatientPage({ searchParams }: PatientPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const callbackRedirect = getAuthCallbackRedirect(resolvedSearchParams);

  if (callbackRedirect) {
    redirect(callbackRedirect);
  }

  const sessionSupabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await sessionSupabase.auth.getUser();
  const portalType = normalizePortalType(
    user?.user_metadata?.portal_type ?? user?.app_metadata?.portal_type,
  );

  if (!user || portalType !== "patient") {
    return (
      <PatientOnboardingView
        context={null}
        errorMessage={getPatientErrorMessage(
          typeof resolvedSearchParams.error === "string"
            ? resolvedSearchParams.error
            : undefined,
        )}
        step="link-required"
      />
    );
  }

  const context = await getPatientOnboardingContext(user.id);

  if (!context) {
    return (
      <PatientOnboardingView
        context={null}
        errorMessage={getPatientErrorMessage("case_missing")}
        step="link-required"
      />
    );
  }

  return (
    <PatientOnboardingView
      context={context}
      errorMessage={getPatientErrorMessage(
        typeof resolvedSearchParams.error === "string"
          ? resolvedSearchParams.error
          : undefined,
      )}
      step={getPatientOnboardingStep(context)}
    />
  );
}
