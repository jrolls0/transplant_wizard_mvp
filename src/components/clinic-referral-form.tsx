"use client";

import { useActionState, useState } from "react";

import {
  submitClinicReferral,
  type ClinicReferralActionState,
} from "@/app/clinic/actions";
import {
  getClinicStageMeta,
  type ClinicReferralListItem,
} from "@/lib/clinic/referrals";

const initialClinicReferralActionState: ClinicReferralActionState = {
  caseNumber: null,
  errors: {},
  message: null,
  onboardingLink: null,
  patientName: null,
  referralListItem: null,
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

function formatListDate(dateValue: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateValue));
}

function ClinicStatusBadge({ stage }: { stage: ClinicReferralListItem["stage"] }) {
  const stageMeta = getClinicStageMeta(stage);

  return (
    <div
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${stageMeta.accentClass}`}
    >
      {stageMeta.label}
    </div>
  );
}

function ClinicReferralRow({ referral }: { referral: ClinicReferralListItem }) {
  const stageMeta = getClinicStageMeta(referral.stage);

  return (
    <div className="grid gap-4 border-t border-[var(--border)] px-6 py-5 md:grid-cols-[minmax(0,1.25fr)_minmax(0,0.9fr)_minmax(0,0.9fr)] md:items-center">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--foreground)]">
          {referral.patientName}
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
          {referral.caseNumber}
        </p>
      </div>

      <div className="space-y-2">
        <ClinicStatusBadge stage={referral.stage} />
        <p className="text-sm text-[var(--muted)]">{stageMeta.helperText}</p>
      </div>

      <div className="space-y-1 text-sm text-[var(--muted)]">
        <p className="font-medium text-[var(--foreground)]">
          Updated {formatListDate(referral.stageEnteredAt)}
        </p>
        <p>Referred {formatListDate(referral.createdAt)}</p>
      </div>
    </div>
  );
}

function ClinicReferralsList({
  referrals,
}: {
  referrals: ClinicReferralListItem[];
}) {
  if (!referrals.length) {
    return (
      <section className="rounded-[28px] border border-[var(--border)] bg-white/90 p-8 shadow-[0_20px_60px_rgba(16,36,63,0.08)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
              Referral status
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Read-only milestone list for referrals created by your clinic
              organization.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-[24px] border border-dashed border-[var(--border)] bg-[#f8fbff] px-6 py-10 text-center">
          <p className="text-base font-medium text-[var(--foreground)]">
            No referrals yet
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Submit the first referral above to populate this read-only status list.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-[var(--border)] bg-white/90 shadow-[0_20px_60px_rgba(16,36,63,0.08)]">
      <div className="flex flex-wrap items-end justify-between gap-4 px-8 pb-6 pt-8">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
            Referral status
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Read-only milestone list for referrals created by your clinic
            organization.
          </p>
        </div>
        <p className="text-sm text-[var(--muted)]">
          Showing {referrals.length} referral{referrals.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="hidden border-y border-[var(--border)] bg-[#f8fbff] px-6 py-3 md:grid md:grid-cols-[minmax(0,1.25fr)_minmax(0,0.9fr)_minmax(0,0.9fr)] md:gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Patient / Case
        </p>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Current stage
        </p>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Dates
        </p>
      </div>

      <div>
        {referrals.map((referral, index) => (
          <div key={referral.caseNumber} className={index === 0 ? "border-t border-[var(--border)] md:border-t-0" : ""}>
            <ClinicReferralRow referral={referral} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function ClinicReferralForm({
  initialReferrals,
}: {
  initialReferrals: ClinicReferralListItem[];
}) {
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState(
    submitClinicReferral,
    initialClinicReferralActionState,
  );
  const referrals =
    state.referralListItem
      ? [
          state.referralListItem,
          ...initialReferrals.filter(
            (referral) =>
              referral.caseNumber !== state.referralListItem?.caseNumber,
          ),
        ]
      : initialReferrals;

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
          This step is limited to the required referral data, the manual onboarding
          link handoff, and the read-only Milestone 2 referral status list.
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
            . Deliver the onboarding link manually for this milestone. The new case
            also appears in the referral status list below.
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

      <ClinicReferralsList referrals={referrals} />
    </div>
  );
}
