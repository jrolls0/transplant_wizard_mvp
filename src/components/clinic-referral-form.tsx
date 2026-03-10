"use client";

import { useActionState, useState } from "react";

import {
  submitClinicReferral,
  type ClinicReferralActionState,
} from "@/app/clinic/actions";

const initialClinicReferralActionState: ClinicReferralActionState = {
  caseNumber: null,
  errors: {},
  message: null,
  onboardingLink: null,
  patientName: null,
  status: "idle",
};

type ReferralFieldConfig = {
  label: string;
  name: keyof ClinicReferralActionState["errors"] | "patientPreferredLanguage";
  placeholder?: string;
  type?: "email" | "tel" | "text";
};

const textFields: ReferralFieldConfig[] = [
  {
    label: "Patient first name",
    name: "patientFirstName",
    placeholder: "First name",
  },
  {
    label: "Patient last name",
    name: "patientLastName",
    placeholder: "Last name",
  },
  {
    label: "Patient email",
    name: "patientEmail",
    placeholder: "patient@example.com",
    type: "email",
  },
  {
    label: "Patient phone",
    name: "patientPhone",
    placeholder: "(555) 555-0100",
    type: "tel",
  },
  {
    label: "DUSW contact name",
    name: "duswContactName",
    placeholder: "DUSW full name",
  },
  {
    label: "DUSW contact email",
    name: "duswContactEmail",
    placeholder: "dusw@clinic.org",
    type: "email",
  },
  {
    label: "Nephrologist contact name",
    name: "nephrologistContactName",
    placeholder: "Nephrologist full name",
  },
  {
    label: "Nephrologist contact email",
    name: "nephrologistContactEmail",
    placeholder: "nephrologist@clinic.org",
    type: "email",
  },
];

async function copyToClipboard(text: string) {
  if (!navigator.clipboard) {
    return false;
  }

  await navigator.clipboard.writeText(text);
  return true;
}

export function ClinicReferralForm() {
  const [state, formAction, isPending] = useActionState(
    submitClinicReferral,
    initialClinicReferralActionState,
  );
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  async function handleCopy(link: string) {
    try {
      const didCopy = await copyToClipboard(link);
      setCopyMessage(didCopy ? "Onboarding link copied." : "Clipboard not available.");
    } catch {
      setCopyMessage("Clipboard copy failed.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[var(--border)] bg-white/90 p-8 shadow-[0_20px_60px_rgba(16,36,63,0.08)]">
        <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
          Submit new transplant referral
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          This step is limited to the required referral data and the manual onboarding
          link handoff. No clinic dashboard or patient list is included yet.
        </p>

        <form action={formAction} className="mt-6 space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            {textFields.map((field) => (
              <label key={field.name} className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  {field.label}
                </span>
                <input
                  className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                  name={field.name}
                  placeholder={field.placeholder}
                  required
                  type={field.type ?? "text"}
                />
                {state.errors[field.name] ? (
                  <span className="mt-2 block text-sm text-[var(--danger)]">
                    {state.errors[field.name]}
                  </span>
                ) : null}
              </label>
            ))}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                Patient preferred language
              </span>
              <select
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                defaultValue="en"
                name="patientPreferredLanguage"
                required
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
              </select>
              {state.errors.patientPreferredLanguage ? (
                <span className="mt-2 block text-sm text-[var(--danger)]">
                  {state.errors.patientPreferredLanguage}
                </span>
              ) : null}
            </label>
          </div>

          {state.message ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${
                state.status === "success"
                  ? "border-[#cfe8d8] bg-[#f4fbf6] text-[#21563a]"
                  : "border-[#f2c8cd] bg-[#fff5f6] text-[#8a2133]"
              }`}
            >
              {state.message}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
              type="submit"
            >
              {isPending ? "Submitting referral..." : "Submit referral"}
            </button>
            <span className="text-sm text-[var(--muted)]">
              Only the 9 locked referral fields are included in this step.
            </span>
          </div>
        </form>
      </section>

      {state.status === "success" && state.onboardingLink ? (
        <section className="rounded-[28px] border border-[var(--border)] bg-white/90 p-8 shadow-[0_20px_60px_rgba(16,36,63,0.08)]">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
            Referral submitted
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {state.patientName} was created in the intake flow as case{" "}
            <span className="font-semibold text-[var(--foreground)]">
              {state.caseNumber}
            </span>
            . Deliver the onboarding link manually for this milestone.
          </p>

          <div className="mt-6 space-y-3">
            <label className="block text-sm font-medium text-[var(--foreground)]">
              Patient onboarding link
            </label>
            <textarea
              className="min-h-32 w-full rounded-2xl border border-[var(--border)] bg-[#f7faff] px-4 py-3 text-sm leading-6 text-[var(--foreground)] outline-none"
              readOnly
              value={state.onboardingLink}
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
                onClick={() => handleCopy(state.onboardingLink!)}
                type="button"
              >
                Copy onboarding link
              </button>
              {copyMessage ? (
                <span className="text-sm text-[var(--muted)]">{copyMessage}</span>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
