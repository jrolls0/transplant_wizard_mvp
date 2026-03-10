export { milestone2AuditEventTypes as patientAuditEventTypes } from "@/lib/milestone2/workflow";

export type PatientOnboardingStep =
  | "link-required"
  | "welcome"
  | "roi-form-1"
  | "roi-form-2"
  | "complete";

export type PatientPortalCase = {
  caseNumber: string;
  emailConsent: boolean;
  id: string;
  inviteLinkGeneratedAt: string | null;
  roiForm1SignedAt: string | null;
  roiForm2SignedAt: string | null;
  roiCompletedAt: string | null;
  smsConsent: boolean;
  stage: "initial-todos" | "patient-onboarding";
  stageEnteredAt: string;
};

export type PatientPortalProfile = {
  email: string;
  firstName: string;
  id: string;
  lastName: string;
  preferredLanguage: "en" | "es";
};

export type PatientOnboardingContext = {
  currentCase: PatientPortalCase;
  onboardingAccessedAt: string | null;
  patient: PatientPortalProfile;
};

export function getPatientOnboardingStep(
  context: PatientOnboardingContext,
): PatientOnboardingStep {
  if (context.currentCase.stage === "initial-todos") {
    return "complete";
  }

  if (!context.onboardingAccessedAt) {
    return "welcome";
  }

  if (!context.currentCase.roiForm1SignedAt) {
    return "roi-form-1";
  }

  if (!context.currentCase.roiForm2SignedAt) {
    return "roi-form-2";
  }

  return "complete";
}
