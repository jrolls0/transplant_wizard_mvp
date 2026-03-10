export const milestone2AuditEventTypes = {
  authLinkGenerated: "auth-link-generated",
  onboardingAccessed: "onboarding-accessed",
  referralCreated: "referral-created",
  roiForm1Signed: "roi-form-1-signed",
  roiForm2Signed: "roi-form-2-signed",
  stageTransitioned: "stage-transitioned",
} as const;

export type Milestone2AuditEventType =
  (typeof milestone2AuditEventTypes)[keyof typeof milestone2AuditEventTypes];

export type Milestone2CaseStage =
  | "initial-todos"
  | "new-referral"
  | "patient-onboarding";

export type ReferralFormValues = {
  duswContactEmail: string;
  duswContactName: string;
  nephrologistContactEmail: string;
  nephrologistContactName: string;
  patientEmail: string;
  patientFirstName: string;
  patientLastName: string;
  patientPhone: string;
  patientPreferredLanguage: "en" | "es";
};

export type ReferralCaseInsert = {
  dusw_contact_email: string;
  dusw_contact_name: string;
  email_consent: boolean;
  invite_link_generated_at: string;
  nephrologist_contact_email: string;
  nephrologist_contact_name: string;
  patient_id: string;
  referring_clinic_id: string;
  sms_consent: boolean;
  stage: "patient-onboarding";
  submitted_by_role: "clinic-dusw" | "clinic-nephrologist";
};

export type AuditEventInsert = {
  actor_id: string;
  actor_type: "patient" | "staff";
  case_id: string;
  event_type: Milestone2AuditEventType;
  metadata: Record<string, string>;
};

export function buildReferralCaseInsert(input: {
  inviteGeneratedAt: string;
  patientId: string;
  profile: {
    organizationId: string;
    role: "clinic-dusw" | "clinic-nephrologist";
  };
  values: ReferralFormValues;
}): ReferralCaseInsert {
  const { inviteGeneratedAt, patientId, profile, values } = input;

  return {
    dusw_contact_email: values.duswContactEmail,
    dusw_contact_name: values.duswContactName,
    email_consent: false,
    invite_link_generated_at: inviteGeneratedAt,
    nephrologist_contact_email: values.nephrologistContactEmail,
    nephrologist_contact_name: values.nephrologistContactName,
    patient_id: patientId,
    referring_clinic_id: profile.organizationId,
    sms_consent: false,
    stage: "patient-onboarding",
    submitted_by_role: profile.role,
  };
}

export function buildReferralAuditRows(input: {
  actorId: string;
  caseId: string;
  caseNumber: string;
  patientId: string;
  redirectTo: string;
}): AuditEventInsert[] {
  const { actorId, caseId, caseNumber, patientId, redirectTo } = input;

  return [
    {
      actor_id: actorId,
      actor_type: "staff",
      case_id: caseId,
      event_type: milestone2AuditEventTypes.referralCreated,
      metadata: {
        case_number: caseNumber,
        patient_id: patientId,
        stage: "patient-onboarding",
      },
    },
    {
      actor_id: actorId,
      actor_type: "staff",
      case_id: caseId,
      event_type: milestone2AuditEventTypes.authLinkGenerated,
      metadata: {
        case_number: caseNumber,
        patient_id: patientId,
        redirect_to: redirectTo,
        verification_type: "magiclink",
      },
    },
  ];
}

export function buildRoiForm1AuditRow(input: {
  caseId: string;
  caseNumber: string;
  patientId: string;
  sessionUserId: string;
  signedAt: string;
}): AuditEventInsert {
  const { caseId, caseNumber, patientId, sessionUserId, signedAt } = input;

  return {
    actor_id: sessionUserId,
    actor_type: "patient",
    case_id: caseId,
    event_type: milestone2AuditEventTypes.roiForm1Signed,
    metadata: {
      case_number: caseNumber,
      patient_id: patientId,
      signed_at: signedAt,
    },
  };
}

export function assertCanCompleteRoiCheckpoint(input: {
  roiForm1SignedAt: string | null;
  stage: Milestone2CaseStage;
}) {
  if (input.stage !== "patient-onboarding") {
    throw new Error("This case is no longer in patient onboarding.");
  }

  if (!input.roiForm1SignedAt) {
    throw new Error("ROI Form 1 must be completed before ROI Form 2.");
  }
}

export function buildRoiCheckpointCaseUpdate(completedAt: string) {
  return {
    roi_completed_at: completedAt,
    roi_form_2_signed_at: completedAt,
    stage: "initial-todos" as const,
    stage_entered_at: completedAt,
  };
}

export function buildRoiCheckpointAuditRows(input: {
  caseId: string;
  caseNumber: string;
  completedAt: string;
  patientId: string;
  sessionUserId: string;
}): AuditEventInsert[] {
  const { caseId, caseNumber, completedAt, patientId, sessionUserId } = input;

  return [
    {
      actor_id: sessionUserId,
      actor_type: "patient",
      case_id: caseId,
      event_type: milestone2AuditEventTypes.roiForm2Signed,
      metadata: {
        case_number: caseNumber,
        patient_id: patientId,
        signed_at: completedAt,
      },
    },
    {
      actor_id: sessionUserId,
      actor_type: "patient",
      case_id: caseId,
      event_type: milestone2AuditEventTypes.stageTransitioned,
      metadata: {
        case_number: caseNumber,
        checkpoint: "roi-complete",
        from_stage: "patient-onboarding",
        patient_id: patientId,
        to_stage: "initial-todos",
        transitioned_at: completedAt,
      },
    },
  ];
}
