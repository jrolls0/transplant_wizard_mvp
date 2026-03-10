import { randomBytes } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

const clinicOrgId = "00000000-0000-0000-0000-000000000101";
const centerOrgId = "00000000-0000-0000-0000-000000000102";

const clinicSeed = {
  email: "clinic.dusw+milestone2@example.com",
  fullName: "Milestone 2 Clinic DUSW",
  organizationId: clinicOrgId,
  portalType: "clinic",
  role: "clinic-dusw",
};

const frontDeskSeed = {
  email: "frontdesk+milestone2@example.com",
  fullName: "Milestone 2 Front Desk",
  organizationId: centerOrgId,
  portalType: "center",
  role: "front-desk",
};

function createPassword() {
  return randomBytes(18).toString("base64url");
}

async function upsertStaffUser(supabase, seed, password) {
  const {
    data: { users },
    error: listError,
  } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });

  if (listError) {
    throw listError;
  }

  const existingUser = users.find((candidate) => candidate.email === seed.email);

  if (existingUser) {
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      {
        email: seed.email,
        email_confirm: true,
        password,
        user_metadata: {
          full_name: seed.fullName,
          organization_id: seed.organizationId,
          portal_type: seed.portalType,
          role: seed.role,
        },
        app_metadata: {
          organization_id: seed.organizationId,
          portal_type: seed.portalType,
          role: seed.role,
        },
      },
    );

    if (updateError) {
      throw updateError;
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: existingUser.id,
      email: seed.email,
      full_name: seed.fullName,
      organization_id: seed.organizationId,
      role: seed.role,
    });

    if (profileError) {
      throw profileError;
    }

    return {
      email: seed.email,
      password,
      userId: existingUser.id,
    };
  }

  const { data: createdUser, error: createError } =
    await supabase.auth.admin.createUser({
      email: seed.email,
      email_confirm: true,
      password,
      user_metadata: {
        full_name: seed.fullName,
        organization_id: seed.organizationId,
        portal_type: seed.portalType,
        role: seed.role,
      },
      app_metadata: {
        organization_id: seed.organizationId,
        portal_type: seed.portalType,
        role: seed.role,
      },
    });

  if (createError) {
    throw createError;
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: createdUser.user.id,
    email: seed.email,
    full_name: seed.fullName,
    organization_id: seed.organizationId,
    role: seed.role,
  });

  if (profileError) {
    throw profileError;
  }

  return {
    email: seed.email,
    password,
    userId: createdUser.user.id,
  };
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error: organizationsError } = await supabase.from("organizations").upsert([
    {
      id: clinicOrgId,
      name: "Milestone 2 Clinic",
      type: "clinic",
    },
    {
      id: centerOrgId,
      name: "Milestone 2 Center",
      type: "center",
    },
  ]);

  if (organizationsError) {
    throw organizationsError;
  }

  const clinicPassword = process.env.SEED_CLINIC_PASSWORD ?? createPassword();
  const frontDeskPassword =
    process.env.SEED_FRONT_DESK_PASSWORD ?? createPassword();

  const clinicUser = await upsertStaffUser(
    supabase,
    clinicSeed,
    clinicPassword,
  );
  const frontDeskUser = await upsertStaffUser(
    supabase,
    frontDeskSeed,
    frontDeskPassword,
  );

  console.log("Seeded organizations:");
  console.log(`- ${clinicOrgId}: Milestone 2 Clinic`);
  console.log(`- ${centerOrgId}: Milestone 2 Center`);
  console.log("Seeded staff users:");
  console.log(
    `- ${clinicUser.email} (${clinicSeed.role}) password=${clinicUser.password}`,
  );
  console.log(
    `- ${frontDeskUser.email} (${frontDeskSeed.role}) password=${frontDeskUser.password}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
