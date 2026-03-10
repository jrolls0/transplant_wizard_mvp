"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type StaffPortal = "center" | "clinic";

function normalizePortal(value: FormDataEntryValue | null): StaffPortal {
  return value === "center" ? "center" : "clinic";
}

export async function signInStaff(formData: FormData) {
  const portal = normalizePortal(formData.get("portal"));
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(`/${portal}?error=missing_credentials`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/${portal}?error=invalid_credentials`);
  }

  redirect(`/${portal}`);
}

export async function signOut(formData: FormData) {
  const portal = String(formData.get("portal") ?? "clinic");
  const supabase = await createClient();

  await supabase.auth.signOut();
  redirect(`/${portal}`);
}
