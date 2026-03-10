import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { randomUUID } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  assertCanCompleteRoiCheckpoint,
  buildReferralAuditRows,
  buildReferralCaseInsert,
  buildRoiCheckpointAuditRows,
  buildRoiCheckpointCaseUpdate,
  buildRoiForm1AuditRow,
  milestone2AuditEventTypes,
  type ReferralFormValues,
} from "../../src/lib/milestone2/workflow";

const clinicOrgId = "00000000-0000-0000-0000-000000000101";
const centerOrgId = "00000000-0000-0000-0000-000000000102";
const secondClinicOrgId = "00000000-0000-0000-0000-000000000103";

const hasLiveEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const liveSkipReason = hasLiveEnv
  ? undefined
  : "Missing Supabase URL, anon key, or service-role key.";

const clinicCredentials = {
  email: process.env.TEST_CLINIC_EMAIL ?? "clinic.dusw+milestone2@example.com",
  password:
    process.env.TEST_CLINIC_PASSWORD ??
    process.env.SEED_CLINIC_PASSWORD ??
    "ClinicPass!2026",
};

const frontDeskCredentials = {
  email: process.env.TEST_FRONT_DESK_EMAIL ?? "frontdesk+milestone2@example.com",
  password:
    process.env.TEST_FRONT_DESK_PASSWORD ??
    process.env.SEED_FRONT_DESK_PASSWORD ??
    "FrontDeskPass!2026",
};

const secondClinicCredentials = {
  email: process.env.TEST_SECOND_CLINIC_EMAIL ?? "clinic.other+milestone2@example.com",
  password: process.env.TEST_SECOND_CLINIC_PASSWORD ?? "ClinicOtherPass!2026",
};

const createdCaseIds = new Set<string>();
const createdPatientIds = new Set<string>();
const createdUserIds = new Set<string>();

function assertSameTimestamp(actual: string | null, expected: string) {
  assert.equal(Boolean(actual), true, "Expected a timestamp value.");
  assert.equal(new Date(actual ?? "").toISOString(), new Date(expected).toISOString());
}

function getLiveClients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const admin = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const createAnonClient = () =>
    createClient(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

  return { admin, createAnonClient };
}

async function signInWithPassword(
  client: SupabaseClient,
  credentials: { email: string; password: string },
) {
  const { data, error } = await client.auth.signInWithPassword(credentials);
  assert.ifError(error);
  assert.ok(data.user, `Expected an authenticated user for ${credentials.email}.`);
  return data.user;
}

async function ensureOrganization(
  admin: SupabaseClient,
  organization: { id: string; name: string; type: "center" | "clinic" },
) {
  const { error } = await admin.from("organizations").upsert(organization);
  assert.ifError(error);
}

async function ensureStaffUser(
  admin: SupabaseClient,
  seed: {
    email: string;
    fullName: string;
    organizationId: string;
    password: string;
    portalType: "center" | "clinic";
    role: "clinic-dusw" | "front-desk";
  },
) {
  const {
    data: { users },
    error: listError,
  } = await admin.auth.admin.listUsers({ page: 1, perPage: 500 });
  assert.ifError(listError);

  const existingUser = users.find((candidate) => candidate.email === seed.email);
  const payload = {
    app_metadata: {
      organization_id: seed.organizationId,
      portal_type: seed.portalType,
      role: seed.role,
    },
    email: seed.email,
    email_confirm: true,
    password: seed.password,
    user_metadata: {
      full_name: seed.fullName,
      organization_id: seed.organizationId,
      portal_type: seed.portalType,
      role: seed.role,
    },
  };

  const userId = existingUser
    ? existingUser.id
    : null;

  let resolvedUserId = userId;

  if (!resolvedUserId) {
    const { data: createdUser, error: createUserError } =
      await admin.auth.admin.createUser(payload);
    assert.ifError(createUserError);
    resolvedUserId = createdUser.user?.id ?? null;
  }

  if (!resolvedUserId) {
    throw new Error(`Unable to create or load staff user for ${seed.email}.`);
  }

  if (existingUser) {
    const { error: updateError } = await admin.auth.admin.updateUserById(
      resolvedUserId,
      payload,
    );
    assert.ifError(updateError);
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    email: seed.email,
    full_name: seed.fullName,
    id: resolvedUserId,
    organization_id: seed.organizationId,
    role: seed.role,
  });
  assert.ifError(profileError);

  return resolvedUserId;
}

async function createPatientFixture(
  admin: SupabaseClient,
  input: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    preferredLanguage: "en" | "es";
  },
) {
  const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
    app_metadata: {
      portal_type: "patient",
    },
    email: input.email,
    email_confirm: true,
    password: input.password,
    user_metadata: {
      first_name: input.firstName,
      last_name: input.lastName,
      portal_type: "patient",
      preferred_language: input.preferredLanguage,
    },
  });
  assert.ifError(createUserError);
  assert.ok(createdUser.user);
  createdUserIds.add(createdUser.user.id);

  const { data: patient, error: patientError } = await admin
    .from("patients")
    .upsert(
      {
        auth_user_id: createdUser.user.id,
        email: input.email,
        first_name: input.firstName,
        last_name: input.lastName,
        phone: "555-000-0000",
        preferred_language: input.preferredLanguage,
      },
      { onConflict: "email" },
    )
    .select("id")
    .single();

  assert.ifError(patientError);
  assert.ok(patient);
  createdPatientIds.add(patient.id);

  return {
    authUserId: createdUser.user.id,
    email: input.email,
    patientId: patient.id,
  };
}

async function createReferralFixture(
  admin: SupabaseClient,
  input: {
    caseNumber: string;
    clinicUserId: string;
    patient: Awaited<ReturnType<typeof createPatientFixture>>;
    redirectTo: string;
    referringClinicId: string;
    submittedByRole: "clinic-dusw" | "clinic-nephrologist";
    values: ReferralFormValues;
  },
) {
  const inviteGeneratedAt = new Date().toISOString();
  const { data: magicLinkData, error: magicLinkError } =
    await admin.auth.admin.generateLink({
      email: input.values.patientEmail,
      options: {
        data: {
          first_name: input.values.patientFirstName,
          last_name: input.values.patientLastName,
          portal_type: "patient",
          preferred_language: input.values.patientPreferredLanguage,
        },
        redirectTo: input.redirectTo,
      },
      type: "magiclink",
    });
  assert.ifError(magicLinkError);
  assert.ok(magicLinkData.properties.action_link);

  const { data: createdCase, error: caseError } = await admin
    .from("cases")
    .insert({
      case_number: input.caseNumber,
      ...buildReferralCaseInsert({
        inviteGeneratedAt,
        patientId: input.patient.patientId,
        profile: {
          organizationId: input.referringClinicId,
          role: input.submittedByRole,
        },
        values: input.values,
      }),
    })
    .select("id, stage, stage_entered_at")
    .single();

  assert.ifError(caseError);
  assert.ok(createdCase);
  createdCaseIds.add(createdCase.id);

  const { error: auditError } = await admin
    .from("audit_events")
    .insert(
      buildReferralAuditRows({
        actorId: input.clinicUserId,
        caseId: createdCase.id,
        caseNumber: input.caseNumber,
        patientId: input.patient.patientId,
        redirectTo: input.redirectTo,
      }),
    );
  assert.ifError(auditError);

  return {
    actionLink: magicLinkData.properties.action_link,
    caseId: createdCase.id,
    caseNumber: input.caseNumber,
    stage: createdCase.stage,
    stageEnteredAt: createdCase.stage_entered_at,
  };
}

async function fetchCaseById(admin: SupabaseClient, caseId: string) {
  const { data, error } = await admin
    .from("cases")
    .select(
      "case_number, patient_id, stage, stage_entered_at, roi_form_1_signed_at, roi_form_2_signed_at, roi_completed_at, invite_link_generated_at",
    )
    .eq("id", caseId)
    .single();

  assert.ifError(error);
  assert.ok(data);
  return data;
}

before(async () => {
  if (!hasLiveEnv) {
    return;
  }

  const { admin } = getLiveClients();

  await ensureOrganization(admin, {
    id: clinicOrgId,
    name: "Milestone 2 Clinic",
    type: "clinic",
  });
  await ensureOrganization(admin, {
    id: centerOrgId,
    name: "Milestone 2 Center",
    type: "center",
  });
  await ensureOrganization(admin, {
    id: secondClinicOrgId,
    name: "Milestone 2 Other Clinic",
    type: "clinic",
  });

  await ensureStaffUser(admin, {
    email: clinicCredentials.email,
    fullName: "Milestone 2 Clinic DUSW",
    organizationId: clinicOrgId,
    password: clinicCredentials.password,
    portalType: "clinic",
    role: "clinic-dusw",
  });
  await ensureStaffUser(admin, {
    email: frontDeskCredentials.email,
    fullName: "Milestone 2 Front Desk",
    organizationId: centerOrgId,
    password: frontDeskCredentials.password,
    portalType: "center",
    role: "front-desk",
  });
  await ensureStaffUser(admin, {
    email: secondClinicCredentials.email,
    fullName: "Milestone 2 Other Clinic User",
    organizationId: secondClinicOrgId,
    password: secondClinicCredentials.password,
    portalType: "clinic",
    role: "clinic-dusw",
  });
});

after(async () => {
  if (!hasLiveEnv) {
    return;
  }

  const { admin } = getLiveClients();

  if (createdCaseIds.size > 0) {
    const { error } = await admin.from("cases").delete().in("id", [...createdCaseIds]);
    assert.ifError(error);
  }

  if (createdPatientIds.size > 0) {
    const { error } = await admin
      .from("patients")
      .delete()
      .in("id", [...createdPatientIds]);
    assert.ifError(error);
  }

  for (const userId of createdUserIds) {
    const { error } = await admin.auth.admin.deleteUser(userId);
    assert.ifError(error);
  }
});

test(
  "Milestone 2 smoke path advances a referral to initial-todos and exposes it to clinic and Front Desk",
  { skip: liveSkipReason },
  async () => {
    const { admin, createAnonClient } = getLiveClients();
    const runId = randomUUID().slice(0, 8);
    const patient = await createPatientFixture(admin, {
      email: `m2.smoke.patient+${runId}@example.com`,
      firstName: "Smoke",
      lastName: "Patient",
      password: "PatientPass!2026",
      preferredLanguage: "en",
    });

    const clinicClient = createAnonClient();
    const clinicUser = await signInWithPassword(clinicClient, clinicCredentials);

    const caseNumber = `TC-20260310-${runId.toUpperCase()}`;
    const referral = await createReferralFixture(admin, {
      caseNumber,
      clinicUserId: clinicUser.id,
      patient,
      redirectTo: "http://127.0.0.1:3004/patient/auth/callback",
      referringClinicId: clinicOrgId,
      submittedByRole: "clinic-dusw",
      values: {
        duswContactEmail: "dusw@example.com",
        duswContactName: "DUSW Contact",
        nephrologistContactEmail: "neph@example.com",
        nephrologistContactName: "Neph Contact",
        patientEmail: patient.email,
        patientFirstName: "Smoke",
        patientLastName: "Patient",
        patientPhone: "555-111-2222",
        patientPreferredLanguage: "en",
      },
    });

    assert.ok(referral.actionLink.includes("/auth/v1/verify"));
    assert.equal(referral.stage, "patient-onboarding");

    const createdCase = await fetchCaseById(admin, referral.caseId);
    assert.equal(createdCase.stage, "patient-onboarding");
    assert.ok(createdCase.invite_link_generated_at);

    const invalidAdvance = await admin
      .from("cases")
      .update({ stage: "initial-todos" })
      .eq("id", referral.caseId);
    assert.ok(invalidAdvance.error, "Expected ROI gate check to block invalid stage advancement.");

    const { error: onboardingAuditError } = await admin.from("audit_events").insert({
      actor_id: patient.authUserId,
      actor_type: "patient",
      case_id: referral.caseId,
      event_type: milestone2AuditEventTypes.onboardingAccessed,
      metadata: {
        patient_id: patient.patientId,
      },
    });
    assert.ifError(onboardingAuditError);

    const { error: welcomePatientUpdateError } = await admin
      .from("patients")
      .update({ preferred_language: "es" })
      .eq("id", patient.patientId);
    assert.ifError(welcomePatientUpdateError);

    const { error: welcomeCaseUpdateError } = await admin
      .from("cases")
      .update({
        email_consent: true,
        sms_consent: true,
      })
      .eq("id", referral.caseId);
    assert.ifError(welcomeCaseUpdateError);

    const roiForm1SignedAt = new Date().toISOString();
    const { error: roiForm1UpdateError } = await admin
      .from("cases")
      .update({ roi_form_1_signed_at: roiForm1SignedAt })
      .eq("id", referral.caseId)
      .eq("stage", "patient-onboarding");
    assert.ifError(roiForm1UpdateError);

    const { error: roiForm1AuditError } = await admin
      .from("audit_events")
      .insert(
        buildRoiForm1AuditRow({
          caseId: referral.caseId,
          caseNumber,
          patientId: patient.patientId,
          sessionUserId: patient.authUserId,
          signedAt: roiForm1SignedAt,
        }),
      );
    assert.ifError(roiForm1AuditError);

    const caseBeforeCheckpoint = await fetchCaseById(admin, referral.caseId);
    assertCanCompleteRoiCheckpoint({
      roiForm1SignedAt: caseBeforeCheckpoint.roi_form_1_signed_at,
      stage: caseBeforeCheckpoint.stage,
    });

    const roiCompletedAt = new Date().toISOString();
    const { error: checkpointUpdateError } = await admin
      .from("cases")
      .update(buildRoiCheckpointCaseUpdate(roiCompletedAt))
      .eq("id", referral.caseId)
      .eq("stage", "patient-onboarding")
      .is("roi_form_2_signed_at", null);
    assert.ifError(checkpointUpdateError);

    const { error: checkpointAuditError } = await admin
      .from("audit_events")
      .insert(
        buildRoiCheckpointAuditRows({
          caseId: referral.caseId,
          caseNumber,
          completedAt: roiCompletedAt,
          patientId: patient.patientId,
          sessionUserId: patient.authUserId,
        }),
      );
    assert.ifError(checkpointAuditError);

    const completedCase = await fetchCaseById(admin, referral.caseId);
    assert.equal(completedCase.stage, "initial-todos");
    assertSameTimestamp(completedCase.roi_form_1_signed_at, roiForm1SignedAt);
    assertSameTimestamp(completedCase.roi_form_2_signed_at, roiCompletedAt);
    assertSameTimestamp(completedCase.roi_completed_at, roiCompletedAt);
    assertSameTimestamp(completedCase.stage_entered_at, roiCompletedAt);

    const { data: auditEvents, error: auditQueryError } = await admin
      .from("audit_events")
      .select("event_type")
      .eq("case_id", referral.caseId)
      .order("created_at", { ascending: true });
    assert.ifError(auditQueryError);
    assert.deepEqual(
      auditEvents?.map((event) => event.event_type),
      [
        milestone2AuditEventTypes.referralCreated,
        milestone2AuditEventTypes.authLinkGenerated,
        milestone2AuditEventTypes.onboardingAccessed,
        milestone2AuditEventTypes.roiForm1Signed,
        milestone2AuditEventTypes.roiForm2Signed,
        milestone2AuditEventTypes.stageTransitioned,
      ],
    );

    const { data: clinicCases, error: clinicCasesError } = await clinicClient
      .from("cases")
      .select("case_number, stage")
      .eq("case_number", caseNumber);
    assert.ifError(clinicCasesError);
    assert.equal(clinicCases?.length, 1);
    assert.equal(clinicCases?.[0]?.stage, "initial-todos");

    const frontDeskClient = createAnonClient();
    await signInWithPassword(frontDeskClient, frontDeskCredentials);

    const { data: queueCases, error: queueError } = await frontDeskClient
      .from("cases")
      .select("case_number, stage")
      .eq("case_number", caseNumber);
    assert.ifError(queueError);
    assert.equal(queueCases?.length, 1);
    assert.equal(queueCases?.[0]?.stage, "initial-todos");
  },
);

test(
  "Milestone 2 RLS boundaries isolate clinic, patient, and Front Desk reads",
  { skip: liveSkipReason },
  async () => {
    const { admin, createAnonClient } = getLiveClients();
    const runId = randomUUID().slice(0, 8);

    const clinicClient = createAnonClient();
    await signInWithPassword(clinicClient, clinicCredentials);

    const secondClinicClient = createAnonClient();
    await signInWithPassword(secondClinicClient, secondClinicCredentials);

    const frontDeskClient = createAnonClient();
    await signInWithPassword(frontDeskClient, frontDeskCredentials);

    const patientOwn = await createPatientFixture(admin, {
      email: `m2.rls.own+${runId}@example.com`,
      firstName: "Own",
      lastName: "Patient",
      password: "PatientPass!2026",
      preferredLanguage: "en",
    });
    const patientOther = await createPatientFixture(admin, {
      email: `m2.rls.other+${runId}@example.com`,
      firstName: "Other",
      lastName: "Patient",
      password: "PatientPass!2026",
      preferredLanguage: "en",
    });

    const ownCase = await createReferralFixture(admin, {
      caseNumber: `TC-20260310-${runId.toUpperCase()}`,
      clinicUserId: (await clinicClient.auth.getUser()).data.user!.id,
      patient: patientOwn,
      redirectTo: "http://127.0.0.1:3004/patient/auth/callback",
      referringClinicId: clinicOrgId,
      submittedByRole: "clinic-dusw",
      values: {
        duswContactEmail: "dusw@example.com",
        duswContactName: "DUSW Contact",
        nephrologistContactEmail: "neph@example.com",
        nephrologistContactName: "Neph Contact",
        patientEmail: patientOwn.email,
        patientFirstName: "Own",
        patientLastName: "Patient",
        patientPhone: "555-111-3333",
        patientPreferredLanguage: "en",
      },
    });

    const otherClinicCase = await createReferralFixture(admin, {
      caseNumber: `TC-20260310-${randomUUID().slice(0, 8).toUpperCase()}`,
      clinicUserId: (await secondClinicClient.auth.getUser()).data.user!.id,
      patient: patientOther,
      redirectTo: "http://127.0.0.1:3004/patient/auth/callback",
      referringClinicId: secondClinicOrgId,
      submittedByRole: "clinic-dusw",
      values: {
        duswContactEmail: "dusw@example.com",
        duswContactName: "DUSW Contact",
        nephrologistContactEmail: "neph@example.com",
        nephrologistContactName: "Neph Contact",
        patientEmail: patientOther.email,
        patientFirstName: "Other",
        patientLastName: "Patient",
        patientPhone: "555-111-4444",
        patientPreferredLanguage: "en",
      },
    });

    const { data: clinicVisibleCases, error: clinicVisibleError } = await clinicClient
      .from("cases")
      .select("case_number");
    assert.ifError(clinicVisibleError);
    assert.ok(
      clinicVisibleCases?.some((item) => item.case_number === ownCase.caseNumber),
      "Clinic user should see own-org case.",
    );
    assert.ok(
      !clinicVisibleCases?.some(
        (item) => item.case_number === otherClinicCase.caseNumber,
      ),
      "Clinic user should not see another clinic org's case.",
    );

    const patientClient = createAnonClient();
    await signInWithPassword(patientClient, {
      email: patientOwn.email,
      password: "PatientPass!2026",
    });

    const { data: patientCases, error: patientCasesError } = await patientClient
      .from("cases")
      .select("case_number");
    assert.ifError(patientCasesError);
    assert.deepEqual(patientCases?.map((item) => item.case_number), [ownCase.caseNumber]);

    const { data: patientRows, error: patientRowsError } = await patientClient
      .from("patients")
      .select("email");
    assert.ifError(patientRowsError);
    assert.deepEqual(patientRows?.map((item) => item.email), [patientOwn.email]);

    const { data: frontDeskCases, error: frontDeskCasesError } = await frontDeskClient
      .from("cases")
      .select("case_number, stage");
    assert.ifError(frontDeskCasesError);
    assert.ok(
      !frontDeskCases?.some((item) => item.case_number === ownCase.caseNumber),
      "Patient-onboarding cases must not appear for Front Desk.",
    );

    const completedAt = new Date().toISOString();
    const { error: fastForwardError } = await admin
      .from("cases")
      .update({
        roi_form_1_signed_at: completedAt,
        ...buildRoiCheckpointCaseUpdate(completedAt),
      })
      .eq("id", ownCase.caseId);
    assert.ifError(fastForwardError);

    const { data: frontDeskCasesAfter, error: frontDeskCasesAfterError } =
      await frontDeskClient
        .from("cases")
        .select("case_number, stage")
        .eq("case_number", ownCase.caseNumber);
    assert.ifError(frontDeskCasesAfterError);
    assert.equal(frontDeskCasesAfter?.length, 1);
    assert.equal(frontDeskCasesAfter?.[0]?.stage, "initial-todos");
  },
);
