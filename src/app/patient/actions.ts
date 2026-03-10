"use server";

import { redirect } from "next/navigation";

import { normalizePortalType } from "@/lib/auth/portal";
import {
  assertCanCompleteRoiCheckpoint,
  buildRoiCheckpointAuditRows,
  buildRoiCheckpointCaseUpdate,
  buildRoiForm1AuditRow,
} from "@/lib/milestone2/workflow";
import {
  getPatientOnboardingStep,
  patientAuditEventTypes,
  type PatientOnboardingContext,
} from "@/lib/patient/onboarding";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceRoleEnv } from "@/lib/supabase/env";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

type PatientContextResult =
  | { context: PatientOnboardingContext; sessionUserId: string }
  | { errorRedirect: string };

function parseBooleanValue(value: FormDataEntryValue | null) {
  return value === "on";
}

function buildPatientErrorRedirect(code: string) {
  return `/patient?error=${code}`;
}

async function getPatientContext(): Promise<PatientContextResult> {
  const sessionSupabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await sessionSupabase.auth.getUser();

  if (userError || !user) {
    return {
      errorRedirect: buildPatientErrorRedirect("session_required"),
    };
  }

  const portalType = normalizePortalType(
    user.user_metadata?.portal_type ?? user.app_metadata?.portal_type,
  );

  if (portalType !== "patient") {
    return {
      errorRedirect: buildPatientErrorRedirect("portal_mismatch"),
    };
  }

  const { data: patient, error: patientError } = await sessionSupabase
    .from("patients")
    .select("id, email, first_name, last_name, preferred_language")
    .eq("auth_user_id", user.id)
    .single();

  if (patientError || !patient) {
    return {
      errorRedirect: buildPatientErrorRedirect("patient_missing"),
    };
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
    return {
      errorRedirect: buildPatientErrorRedirect("case_missing"),
    };
  }

  const { data: onboardingAccessEvent, error: auditError } = await sessionSupabase
    .from("audit_events")
    .select("created_at")
    .eq("case_id", currentCase.id)
    .eq("event_type", patientAuditEventTypes.onboardingAccessed)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (auditError) {
    return {
      errorRedirect: buildPatientErrorRedirect("audit_lookup_failed"),
    };
  }

  return {
    context: {
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
    },
    sessionUserId: user.id,
  };
}

async function insertOnboardingAccessEventIfMissing(
  caseId: string,
  patientId: string,
  sessionUserId: string,
) {
  const adminSupabase = createAdminSupabaseClient();

  const { data: existingEvent, error: existingEventError } = await adminSupabase
    .from("audit_events")
    .select("id")
    .eq("case_id", caseId)
    .eq("event_type", patientAuditEventTypes.onboardingAccessed)
    .limit(1)
    .maybeSingle();

  if (existingEventError) {
    throw existingEventError;
  }

  if (existingEvent) {
    return;
  }

  const { error: insertError } = await adminSupabase.from("audit_events").insert({
    actor_id: sessionUserId,
    actor_type: "patient",
    case_id: caseId,
    event_type: patientAuditEventTypes.onboardingAccessed,
    metadata: {
      patient_id: patientId,
    },
  });

  if (insertError) {
    throw insertError;
  }
}

async function completePatientOnboardingCheckpoint(
  caseId: string,
  patientId: string,
  sessionUserId: string,
) {
  const adminSupabase = createAdminSupabaseClient();
  const completedAt = new Date().toISOString();

  const { data: currentCase, error: currentCaseError } = await adminSupabase
    .from("cases")
    .select("case_number, roi_form_1_signed_at, stage")
    .eq("id", caseId)
    .single();

  if (currentCaseError || !currentCase) {
    throw currentCaseError ?? new Error("The current case could not be loaded.");
  }

  assertCanCompleteRoiCheckpoint({
    roiForm1SignedAt: currentCase.roi_form_1_signed_at,
    stage: currentCase.stage,
  });

  const { error: updateError } = await adminSupabase
    .from("cases")
    .update(buildRoiCheckpointCaseUpdate(completedAt))
    .eq("id", caseId)
    .eq("stage", "patient-onboarding")
    .is("roi_form_2_signed_at", null);

  if (updateError) {
    throw updateError;
  }

  const { error: auditError } = await adminSupabase.from("audit_events").insert(
    buildRoiCheckpointAuditRows({
      caseId,
      caseNumber: currentCase.case_number,
      completedAt,
      patientId,
      sessionUserId,
    }),
  );

  if (auditError) {
    throw auditError;
  }
}

export async function savePatientWelcomePreferences(formData: FormData) {
  if (!hasSupabaseServiceRoleEnv()) {
    redirect(buildPatientErrorRedirect("service_role_missing"));
  }

  const contextResult = await getPatientContext();

  if ("errorRedirect" in contextResult) {
    redirect(contextResult.errorRedirect);
  }

  const { context, sessionUserId } = contextResult;
  const currentStep = getPatientOnboardingStep(context);
  const preferredLanguage = String(formData.get("preferredLanguage") ?? "").trim();

  if (currentStep !== "welcome") {
    redirect(buildPatientErrorRedirect("welcome_unavailable"));
  }

  if (preferredLanguage !== "en" && preferredLanguage !== "es") {
    redirect(buildPatientErrorRedirect("welcome_invalid"));
  }

  const adminSupabase = createAdminSupabaseClient();

  try {
    await insertOnboardingAccessEventIfMissing(
      context.currentCase.id,
      context.patient.id,
      sessionUserId,
    );

    const { error: patientUpdateError } = await adminSupabase
      .from("patients")
      .update({
        preferred_language: preferredLanguage,
      })
      .eq("id", context.patient.id);

    if (patientUpdateError) {
      throw patientUpdateError;
    }

    const { error: caseUpdateError } = await adminSupabase
      .from("cases")
      .update({
        email_consent: parseBooleanValue(formData.get("emailConsent")),
        sms_consent: parseBooleanValue(formData.get("smsConsent")),
      })
      .eq("id", context.currentCase.id);

    if (caseUpdateError) {
      throw caseUpdateError;
    }
  } catch {
    redirect(buildPatientErrorRedirect("welcome_save_failed"));
  }

  redirect("/patient");
}

export async function signPatientRoiForm1(formData: FormData) {
  if (!hasSupabaseServiceRoleEnv()) {
    redirect(buildPatientErrorRedirect("service_role_missing"));
  }

  const contextResult = await getPatientContext();

  if ("errorRedirect" in contextResult) {
    redirect(contextResult.errorRedirect);
  }

  const { context, sessionUserId } = contextResult;
  const currentStep = getPatientOnboardingStep(context);

  if (currentStep !== "roi-form-1") {
    redirect(buildPatientErrorRedirect("roi_form_1_unavailable"));
  }

  const acknowledgedRecordsRelease =
    parseBooleanValue(formData.get("acknowledgeRecordsRelease"));
  const acknowledgedCommunicationRights =
    parseBooleanValue(formData.get("acknowledgeCommunicationRights"));

  if (!acknowledgedRecordsRelease || !acknowledgedCommunicationRights) {
    redirect(buildPatientErrorRedirect("roi_form_1_invalid"));
  }

  const adminSupabase = createAdminSupabaseClient();
  const signedAt = new Date().toISOString();

  try {
    const { error: updateError } = await adminSupabase
      .from("cases")
      .update({
        roi_form_1_signed_at: signedAt,
      })
      .eq("id", context.currentCase.id)
      .eq("stage", "patient-onboarding")
      .is("roi_form_1_signed_at", null);

    if (updateError) {
      throw updateError;
    }

    const { error: auditError } = await adminSupabase
      .from("audit_events")
      .insert(
        buildRoiForm1AuditRow({
          caseId: context.currentCase.id,
          caseNumber: context.currentCase.caseNumber,
          patientId: context.patient.id,
          sessionUserId,
          signedAt,
        }),
      );

    if (auditError) {
      throw auditError;
    }
  } catch {
    redirect(buildPatientErrorRedirect("roi_form_1_failed"));
  }

  redirect("/patient");
}

export async function signPatientRoiForm2(formData: FormData) {
  if (!hasSupabaseServiceRoleEnv()) {
    redirect(buildPatientErrorRedirect("service_role_missing"));
  }

  const contextResult = await getPatientContext();

  if ("errorRedirect" in contextResult) {
    redirect(contextResult.errorRedirect);
  }

  const { context, sessionUserId } = contextResult;
  const currentStep = getPatientOnboardingStep(context);

  if (currentStep !== "roi-form-2") {
    redirect(buildPatientErrorRedirect("roi_form_2_unavailable"));
  }

  const acknowledgedHipaaAuthorization =
    parseBooleanValue(formData.get("acknowledgeHipaaAuthorization"));
  const acknowledgedSensitiveInformation =
    parseBooleanValue(formData.get("acknowledgeSensitiveInformation"));

  if (!acknowledgedHipaaAuthorization || !acknowledgedSensitiveInformation) {
    redirect(buildPatientErrorRedirect("roi_form_2_invalid"));
  }

  try {
    await completePatientOnboardingCheckpoint(
      context.currentCase.id,
      context.patient.id,
      sessionUserId,
    );
  } catch {
    redirect(buildPatientErrorRedirect("roi_checkpoint_failed"));
  }

  redirect("/patient");
}
