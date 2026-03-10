import test from "node:test";
import assert from "node:assert/strict";

import {
  assertCanCompleteRoiCheckpoint,
  buildReferralAuditRows,
  buildReferralCaseInsert,
  buildRoiCheckpointAuditRows,
  buildRoiCheckpointCaseUpdate,
  buildRoiForm1AuditRow,
  milestone2AuditEventTypes,
} from "../../src/lib/milestone2/workflow";
import { getPatientOnboardingStep } from "../../src/lib/patient/onboarding";

test("referral creation starts the case at patient-onboarding with locked defaults", () => {
  const createdAt = "2026-03-10T12:00:00.000Z";
  const referralCase = buildReferralCaseInsert({
    inviteGeneratedAt: createdAt,
    patientId: "patient-1",
    profile: {
      organizationId: "clinic-1",
      role: "clinic-dusw",
    },
    values: {
      duswContactEmail: "dusw@example.com",
      duswContactName: "DUSW Contact",
      nephrologistContactEmail: "neph@example.com",
      nephrologistContactName: "Neph Contact",
      patientEmail: "patient@example.com",
      patientFirstName: "Taylor",
      patientLastName: "Example",
      patientPhone: "555-111-2222",
      patientPreferredLanguage: "en",
    },
  });

  assert.equal(referralCase.stage, "patient-onboarding");
  assert.equal(referralCase.email_consent, false);
  assert.equal(referralCase.sms_consent, false);
  assert.equal(referralCase.invite_link_generated_at, createdAt);
  assert.equal(referralCase.referring_clinic_id, "clinic-1");
});

test("referral audit rows are created in the required order", () => {
  const auditRows = buildReferralAuditRows({
    actorId: "staff-1",
    caseId: "case-1",
    caseNumber: "TC-20260310-ABC123",
    patientId: "patient-1",
    redirectTo: "http://127.0.0.1:3004/patient/auth/callback",
  });

  assert.deepEqual(
    auditRows.map((row) => row.event_type),
    [
      milestone2AuditEventTypes.referralCreated,
      milestone2AuditEventTypes.authLinkGenerated,
    ],
  );
  assert.equal(auditRows[0]?.metadata.stage, "patient-onboarding");
  assert.equal(auditRows[1]?.metadata.verification_type, "magiclink");
});

test("ROI Form 1 audit row captures the patient signature timestamp", () => {
  const signedAt = "2026-03-10T13:00:00.000Z";
  const auditRow = buildRoiForm1AuditRow({
    caseId: "case-1",
    caseNumber: "TC-20260310-ABC123",
    patientId: "patient-1",
    sessionUserId: "patient-auth-1",
    signedAt,
  });

  assert.equal(auditRow.event_type, milestone2AuditEventTypes.roiForm1Signed);
  assert.equal(auditRow.metadata.signed_at, signedAt);
});

test("ROI checkpoint rejects a case outside patient onboarding", () => {
  assert.throws(
    () =>
      assertCanCompleteRoiCheckpoint({
        roiForm1SignedAt: "2026-03-10T12:01:00.000Z",
        stage: "initial-todos",
      }),
    /no longer in patient onboarding/i,
  );
});

test("ROI checkpoint rejects completion when ROI Form 1 is missing", () => {
  assert.throws(
    () =>
      assertCanCompleteRoiCheckpoint({
        roiForm1SignedAt: null,
        stage: "patient-onboarding",
      }),
    /ROI Form 1 must be completed before ROI Form 2/i,
  );
});

test("ROI checkpoint update writes the locked transition fields", () => {
  const completedAt = "2026-03-10T14:00:00.000Z";
  const update = buildRoiCheckpointCaseUpdate(completedAt);

  assert.deepEqual(update, {
    roi_completed_at: completedAt,
    roi_form_2_signed_at: completedAt,
    stage: "initial-todos",
    stage_entered_at: completedAt,
  });
});

test("ROI checkpoint audit rows are created in the required order", () => {
  const completedAt = "2026-03-10T14:00:00.000Z";
  const auditRows = buildRoiCheckpointAuditRows({
    caseId: "case-1",
    caseNumber: "TC-20260310-ABC123",
    completedAt,
    patientId: "patient-1",
    sessionUserId: "patient-auth-1",
  });

  assert.deepEqual(
    auditRows.map((row) => row.event_type),
    [
      milestone2AuditEventTypes.roiForm2Signed,
      milestone2AuditEventTypes.stageTransitioned,
    ],
  );
  assert.equal(auditRows[1]?.metadata.from_stage, "patient-onboarding");
  assert.equal(auditRows[1]?.metadata.to_stage, "initial-todos");
});

test("patient onboarding step progression stays aligned with the explicit checkpoint", () => {
  const baseContext = {
    currentCase: {
      caseNumber: "TC-20260310-ABC123",
      emailConsent: false,
      id: "case-1",
      inviteLinkGeneratedAt: "2026-03-10T12:00:00.000Z",
      roiForm1SignedAt: null,
      roiForm2SignedAt: null,
      roiCompletedAt: null,
      smsConsent: false,
      stage: "patient-onboarding" as const,
      stageEnteredAt: "2026-03-10T12:00:00.000Z",
    },
    onboardingAccessedAt: null,
    patient: {
      email: "patient@example.com",
      firstName: "Taylor",
      id: "patient-1",
      lastName: "Example",
      preferredLanguage: "en" as const,
    },
  };

  assert.equal(getPatientOnboardingStep(baseContext), "welcome");
  assert.equal(
    getPatientOnboardingStep({
      ...baseContext,
      onboardingAccessedAt: "2026-03-10T12:05:00.000Z",
    }),
    "roi-form-1",
  );
  assert.equal(
    getPatientOnboardingStep({
      ...baseContext,
      currentCase: {
        ...baseContext.currentCase,
        roiForm1SignedAt: "2026-03-10T12:06:00.000Z",
      },
      onboardingAccessedAt: "2026-03-10T12:05:00.000Z",
    }),
    "roi-form-2",
  );
  assert.equal(
    getPatientOnboardingStep({
      ...baseContext,
      currentCase: {
        ...baseContext.currentCase,
        roiForm1SignedAt: "2026-03-10T12:06:00.000Z",
        roiForm2SignedAt: "2026-03-10T12:07:00.000Z",
        roiCompletedAt: "2026-03-10T12:07:00.000Z",
        stage: "initial-todos",
      },
      onboardingAccessedAt: "2026-03-10T12:05:00.000Z",
    }),
    "complete",
  );
});
