"use server";

import { headers } from "next/headers";

import { normalizePortalType } from "@/lib/auth/portal";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { hasSupabaseServiceRoleEnv } from "@/lib/supabase/env";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

const requiredFieldNames = [
  "patientFirstName",
  "patientLastName",
  "patientEmail",
  "patientPhone",
  "patientPreferredLanguage",
  "duswContactName",
  "duswContactEmail",
  "nephrologistContactName",
  "nephrologistContactEmail",
] as const;

type RequiredFieldName = (typeof requiredFieldNames)[number];

type ReferralFormValues = Record<RequiredFieldName, string>;

export type ClinicReferralActionState = {
  caseNumber: string | null;
  errors: Partial<Record<RequiredFieldName, string>>;
  message: string | null;
  onboardingLink: string | null;
  patientName: string | null;
  status: "idle" | "error" | "success";
};

function normalizeFieldValue(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function validateReferralForm(formData: FormData) {
  const values = {
    patientFirstName: normalizeFieldValue(formData.get("patientFirstName")),
    patientLastName: normalizeFieldValue(formData.get("patientLastName")),
    patientEmail: normalizeFieldValue(formData.get("patientEmail")).toLowerCase(),
    patientPhone: normalizeFieldValue(formData.get("patientPhone")),
    patientPreferredLanguage: normalizeFieldValue(
      formData.get("patientPreferredLanguage"),
    ),
    duswContactName: normalizeFieldValue(formData.get("duswContactName")),
    duswContactEmail: normalizeFieldValue(
      formData.get("duswContactEmail"),
    ).toLowerCase(),
    nephrologistContactName: normalizeFieldValue(
      formData.get("nephrologistContactName"),
    ),
    nephrologistContactEmail: normalizeFieldValue(
      formData.get("nephrologistContactEmail"),
    ).toLowerCase(),
  } satisfies ReferralFormValues;

  const errors: Partial<Record<RequiredFieldName, string>> = {};

  requiredFieldNames.forEach((fieldName) => {
    if (!values[fieldName]) {
      errors[fieldName] = "Required";
    }
  });

  if (
    values.patientPreferredLanguage &&
    !["en", "es"].includes(values.patientPreferredLanguage)
  ) {
    errors.patientPreferredLanguage = "Select a supported language.";
  }

  ["patientEmail", "duswContactEmail", "nephrologistContactEmail"].forEach(
    (fieldName) => {
      const typedFieldName = fieldName as RequiredFieldName;
      const value = values[typedFieldName];

      if (value && !value.includes("@")) {
        errors[typedFieldName] = "Enter a valid email.";
      }
    },
  );

  return { errors, values };
}

function buildCaseNumber() {
  const now = new Date();
  const dateSegment = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0"),
  ].join("");
  const suffix = crypto.randomUUID().slice(0, 6).toUpperCase();

  return `TC-${dateSegment}-${suffix}`;
}

async function buildPatientRedirectTo() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");

  if (origin) {
    return `${origin}/patient/auth/callback`;
  }

  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return "http://localhost:3000/patient/auth/callback";
  }

  return `${protocol}://${host}/patient/auth/callback`;
}

async function ensurePatientAuthUser(
  adminSupabase: ReturnType<typeof createAdminSupabaseClient>,
  values: ReferralFormValues,
  redirectTo: string,
) {
  const {
    data: { users },
    error: listUsersError,
  } = await adminSupabase.auth.admin.listUsers({ page: 1, perPage: 200 });

  if (listUsersError) {
    throw listUsersError;
  }

  const existingUser = users.find((candidate) => candidate.email === values.patientEmail);
  const currentPortalType = normalizePortalType(
    existingUser?.user_metadata?.portal_type ??
      existingUser?.app_metadata?.portal_type,
  );

  if (existingUser && currentPortalType && currentPortalType !== "patient") {
    throw new Error(
      "That email is already attached to a non-patient account and cannot be reused for patient onboarding.",
    );
  }

  const userMetadata = {
    first_name: values.patientFirstName,
    last_name: values.patientLastName,
    portal_type: "patient",
    preferred_language: values.patientPreferredLanguage,
  };

  let authUserId = existingUser?.id ?? null;

  if (existingUser) {
    const { error: updateUserError } = await adminSupabase.auth.admin.updateUserById(
      existingUser.id,
      {
        app_metadata: {
          portal_type: "patient",
        },
        email: values.patientEmail,
        email_confirm: true,
        user_metadata: userMetadata,
      },
    );

    if (updateUserError) {
      throw updateUserError;
    }
  } else {
    const { data: createdUser, error: createUserError } =
      await adminSupabase.auth.admin.createUser({
        app_metadata: {
          portal_type: "patient",
        },
        email: values.patientEmail,
        email_confirm: true,
        user_metadata: userMetadata,
      });

    if (createUserError) {
      throw createUserError;
    }

    authUserId = createdUser.user.id;
  }

  const { data: linkData, error: generateLinkError } =
    await adminSupabase.auth.admin.generateLink({
      email: values.patientEmail,
      options: {
        data: userMetadata,
        redirectTo,
      },
      type: "magiclink",
    });

  if (generateLinkError) {
    throw generateLinkError;
  }

  return {
    actionLink: linkData.properties.action_link,
    authUserId: authUserId ?? linkData.user.id,
  };
}

export async function submitClinicReferral(
  _previousState: ClinicReferralActionState,
  formData: FormData,
): Promise<ClinicReferralActionState> {
  const { errors, values } = validateReferralForm(formData);

  if (Object.keys(errors).length > 0) {
    return {
      caseNumber: null,
      errors,
      message: "Fix the required referral fields and submit again.",
      onboardingLink: null,
      patientName: null,
      status: "error",
    };
  }

  const sessionSupabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await sessionSupabase.auth.getUser();

  if (userError || !user) {
    return {
      caseNumber: null,
      errors: {},
      message: "You must sign in with a clinic account before submitting a referral.",
      onboardingLink: null,
      patientName: null,
      status: "error",
    };
  }

  const portalType = normalizePortalType(
    user.user_metadata?.portal_type ?? user.app_metadata?.portal_type,
  );

  if (portalType !== "clinic") {
    return {
      caseNumber: null,
      errors: {},
      message: "The active session is not authorized for the clinic portal.",
      onboardingLink: null,
      patientName: null,
      status: "error",
    };
  }

  const { data: profile, error: profileError } = await sessionSupabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      caseNumber: null,
      errors: {},
      message: "The clinic profile for the active user is missing.",
      onboardingLink: null,
      patientName: null,
      status: "error",
    };
  }

  if (
    profile.role !== "clinic-dusw" &&
    profile.role !== "clinic-nephrologist"
  ) {
    return {
      caseNumber: null,
      errors: {},
      message: "Only clinic DUSW or clinic nephrologist users can submit referrals.",
      onboardingLink: null,
      patientName: null,
      status: "error",
    };
  }

  if (!hasSupabaseServiceRoleEnv()) {
    return {
      caseNumber: null,
      errors: {},
      message:
        "Referral submission requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      onboardingLink: null,
      patientName: null,
      status: "error",
    };
  }

  const adminSupabase = createAdminSupabaseClient();

  try {
    const redirectTo = await buildPatientRedirectTo();
    const patientAuth = await ensurePatientAuthUser(adminSupabase, values, redirectTo);

    const { data: patient, error: patientError } = await adminSupabase
      .from("patients")
      .upsert(
        {
          auth_user_id: patientAuth.authUserId,
          email: values.patientEmail,
          first_name: values.patientFirstName,
          last_name: values.patientLastName,
          phone: values.patientPhone,
          preferred_language: values.patientPreferredLanguage,
        },
        {
          onConflict: "email",
        },
      )
      .select("id, first_name, last_name")
      .single();

    if (patientError || !patient) {
      throw patientError ?? new Error("Unable to create the patient record.");
    }

    const caseNumber = buildCaseNumber();
    const inviteGeneratedAt = new Date().toISOString();

    const { data: createdCase, error: caseError } = await adminSupabase
      .from("cases")
      .insert({
        case_number: caseNumber,
        dusw_contact_email: values.duswContactEmail,
        dusw_contact_name: values.duswContactName,
        email_consent: false,
        invite_link_generated_at: inviteGeneratedAt,
        nephrologist_contact_email: values.nephrologistContactEmail,
        nephrologist_contact_name: values.nephrologistContactName,
        patient_id: patient.id,
        referring_clinic_id: profile.organization_id,
        sms_consent: false,
        stage: "patient-onboarding",
        submitted_by_role: profile.role,
      })
      .select("id")
      .single();

    if (caseError || !createdCase) {
      throw caseError ?? new Error("Unable to create the case record.");
    }

    const auditRows = [
      {
        actor_id: user.id,
        actor_type: "staff",
        case_id: createdCase.id,
        event_type: "referral-created",
        metadata: {
          case_number: caseNumber,
          patient_id: patient.id,
          stage: "patient-onboarding",
        },
      },
      {
        actor_id: user.id,
        actor_type: "staff",
        case_id: createdCase.id,
        event_type: "auth-link-generated",
        metadata: {
          case_number: caseNumber,
          patient_id: patient.id,
          redirect_to: redirectTo,
          verification_type: "magiclink",
        },
      },
    ];

    const { error: auditError } = await adminSupabase
      .from("audit_events")
      .insert(auditRows);

    if (auditError) {
      throw auditError;
    }

    return {
      caseNumber,
      errors: {},
      message: "Referral submitted. Copy the onboarding link and deliver it manually.",
      onboardingLink: patientAuth.actionLink,
      patientName: `${patient.first_name} ${patient.last_name}`,
      status: "success",
    };
  } catch (error) {
    return {
      caseNumber: null,
      errors: {},
      message:
        error instanceof Error
          ? error.message
          : "The referral could not be created.",
      onboardingLink: null,
      patientName: null,
      status: "error",
    };
  }
}
