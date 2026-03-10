import Image from "next/image";
import type { ReactNode } from "react";

import {
  savePatientWelcomePreferences,
  signPatientRoiForm1,
  signPatientRoiForm2,
} from "@/app/patient/actions";
import {
  type PatientOnboardingContext,
  type PatientOnboardingStep,
} from "@/lib/patient/onboarding";

type PatientOnboardingViewProps = {
  context: PatientOnboardingContext | null;
  errorMessage: string | null;
  step: PatientOnboardingStep;
};

type EntryTab = "login" | "register";

type ConsentSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  checkItems?: string[];
  numbered?: Array<{ label: string; text: string }>;
};

type IconProps = {
  className?: string;
};

const SERVICES_CONSENT_SECTIONS: ConsentSection[] = [
  {
    heading: "INTRODUCTION",
    paragraphs: [
      'This document constitutes an agreement between you (the "Patient") and Transplant Wizard, LLC ("Transplant Wizard," "we," "us," or "our") regarding the use of our transplant coordination and referral services.',
    ],
  },
  {
    heading: "DESCRIPTION OF SERVICES",
    paragraphs: [
      "Transplant Wizard provides a digital platform designed to assist patients in navigating the kidney transplant referral process. Our services include:",
    ],
    bullets: [
      "Facilitating communication between patients, dialysis social workers, and transplant centers",
      "Secure document collection and transmission",
      "Transplant center selection assistance",
      "Care coordination and progress tracking",
      "Educational resources about the transplant process",
    ],
  },
  {
    heading: "IMPORTANT DISCLAIMERS",
    paragraphs: [
      "By using Transplant Wizard services, you acknowledge and understand that:",
    ],
    numbered: [
      {
        label: "1.",
        text: "Transplant Wizard does NOT provide medical advice, diagnosis, or treatment. We are a coordination service only.",
      },
      {
        label: "2.",
        text: "All medical decisions regarding your transplant care should be made in consultation with your healthcare providers.",
      },
      {
        label: "3.",
        text: "Use of our services does not guarantee acceptance by any transplant center or placement on a transplant waiting list.",
      },
      {
        label: "4.",
        text: "You remain responsible for attending appointments and complying with transplant center requirements.",
      },
    ],
  },
  {
    heading: "DATA SECURITY",
    paragraphs: [
      "We are committed to protecting your personal health information in accordance with the Health Insurance Portability and Accountability Act (HIPAA) and applicable state laws. Your information is encrypted, securely stored, and only shared with authorized parties as specified in the Medical Records Consent Form.",
    ],
  },
  {
    heading: "VOLUNTARY PARTICIPATION",
    paragraphs: [
      "Your participation in Transplant Wizard services is entirely voluntary. You may withdraw your consent and discontinue use of our services at any time by contacting us at support@transplantwizard.com. Withdrawal will not affect your eligibility for transplant evaluation through other means.",
    ],
  },
  {
    heading: "CONSENT ACKNOWLEDGMENT",
    paragraphs: ["By signing below, I acknowledge that:"],
    checkItems: [
      "I have read and understand this consent form",
      "I voluntarily agree to use Transplant Wizard services",
      "I understand that Transplant Wizard does not provide medical advice",
      "I agree to the terms and conditions outlined above",
    ],
  },
];

const MEDICAL_CONSENT_SECTIONS: ConsentSection[] = [
  {
    heading: "PURPOSE OF AUTHORIZATION",
    paragraphs: [
      "I hereby authorize the use and/or disclosure of my individually identifiable health information as described below. This authorization is made in compliance with the Health Insurance Portability and Accountability Act of 1996 (HIPAA) Privacy Rule.",
    ],
  },
  {
    heading: "INFORMATION TO BE DISCLOSED",
    paragraphs: [
      "I authorize the release of the following protected health information (PHI):",
    ],
    bullets: [
      "Medical records related to kidney disease, dialysis treatment, and transplant evaluation",
      "Laboratory results including blood tests, urinalysis, and tissue typing",
      "Diagnostic imaging reports and results",
      "Medication lists and pharmacy records",
      "Clinical notes and physician summaries",
      "Social work assessments and psychosocial evaluations",
      "Insurance and financial clearance documentation",
      "Immunization records",
    ],
  },
  {
    heading: "AUTHORIZED PARTIES",
    paragraphs: [
      "I authorize disclosure of my PHI to and from the following parties:",
    ],
    numbered: [
      {
        label: "1.",
        text: "Transplant Centers: Selected transplant programs for evaluation and listing purposes",
      },
      {
        label: "2.",
        text: "Dialysis Unit Social Workers (DUSW): For care coordination and document management",
      },
      {
        label: "3.",
        text: "Healthcare Providers: Physicians, specialists, and care teams involved in my transplant evaluation",
      },
      {
        label: "4.",
        text: "Transplant Wizard: For secure transmission and coordination of medical information",
      },
    ],
  },
  {
    heading: "DURATION OF AUTHORIZATION",
    paragraphs: [
      "This authorization shall remain in effect for a period of twenty-four (24) months from the date of signature, unless revoked earlier in writing by the patient or patient's legal representative.",
    ],
  },
  {
    heading: "RIGHT TO REVOKE",
    paragraphs: [
      "I understand that I have the right to revoke this authorization at any time by submitting a written request to Transplant Wizard at support@transplantwizard.com. I understand that revocation will not affect any actions taken in reliance on this authorization prior to receipt of my written revocation.",
    ],
  },
  {
    heading: "REDISCLOSURE NOTICE",
    paragraphs: [
      "I understand that once my health information is disclosed pursuant to this authorization, it may no longer be protected by federal privacy regulations and could potentially be redisclosed by the recipient.",
    ],
  },
  {
    heading: "VOLUNTARY AUTHORIZATION",
    paragraphs: ["I understand that:"],
    checkItems: [
      "This authorization is voluntary",
      "I may refuse to sign this authorization",
      "My treatment will not be conditioned on signing this authorization",
      "I am entitled to receive a copy of this signed authorization",
    ],
  },
  {
    heading: "ACKNOWLEDGMENT",
    paragraphs: [
      "By signing below, I certify that I have read and understand this Authorization for Release of Protected Health Information, and I voluntarily consent to the disclosure of my health information as described herein.",
    ],
  },
];

const SIMULATED_SIGNATURE_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="90" viewBox="0 0 320 90">
     <rect width="320" height="90" fill="#f8fafc"/>
     <path d="M22 64 C45 18, 80 86, 116 34 C133 12, 168 74, 205 30 C228 5, 267 78, 298 26" stroke="#111827" stroke-width="2.4" fill="none" stroke-linecap="round"/>
     <text x="24" y="83" font-size="11" fill="#64748b" font-family="Arial, sans-serif">/s/ Patient Signature</text>
   </svg>`,
)}`;

function HeartIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 20.4 4.8 13.7C3 12.1 2 10.7 2 8.8 2 6.1 4 4 6.7 4c1.5 0 3 .7 4 1.9C11.7 4.7 13.2 4 14.7 4 17.4 4 19.4 6.1 19.4 8.8c0 1.9-1 3.3-2.8 4.9L12 20.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CrossIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 3v18M3 12h18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M6 7.5h12M7.5 6v12M16.5 6v12M6 16.5h12"
        opacity="0.18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function FileTextIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 3.5h6.2L19 8.3V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 7 19V5A1.5 1.5 0 0 1 8.5 3.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M14 3.8V8h4.2M9.5 11.2h5M9.5 14.2h5M9.5 17.2h3.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function UserIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 7.2c.7-2.9 3.1-4.7 6-4.7s5.3 1.8 6 4.7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function MailIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 6.5h16v11H4zM4.5 7l7.5 6L19.5 7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function BellIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.5 17.2h7l-1-1.8V11a3.5 3.5 0 1 0-7 0v4.4l-1 1.8Zm2.6 2.3a1.4 1.4 0 0 0 2.8 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function PatientGradientBackground({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f2f7ff] via-[#ecf3ff] to-[#e2edf8]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
        {children}
      </div>
    </main>
  );
}

function EntryHero() {
  return (
    <div className="mb-7 mt-3 flex flex-col items-center gap-3 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#3399e6] shadow-[0_10px_24px_rgba(51,153,230,0.35)]">
        <HeartIcon className="h-10 w-10 text-white" />
      </div>
      <div>
        <h1 className="text-[31px] font-bold tracking-tight text-slate-900">
          Patient Portal
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Your journey to a new beginning
        </p>
      </div>
    </div>
  );
}

function EntryTabs({ activeTab }: { activeTab: EntryTab }) {
  return (
    <div className="mb-4 rounded-full bg-white p-1 shadow-[0_8px_18px_rgba(15,23,42,0.08)]">
      <div className="grid grid-cols-2 gap-1">
        <div
          className={`rounded-full px-4 py-2.5 text-center text-sm font-semibold transition ${
            activeTab === "login" ? "bg-[#3399e6] text-white" : "text-slate-500"
          }`}
        >
          Sign In
        </div>
        <div
          className={`rounded-full px-4 py-2.5 text-center text-sm font-semibold transition ${
            activeTab === "register"
              ? "bg-[#3399e6] text-white"
              : "text-slate-500"
          }`}
        >
          Register
        </div>
      </div>
    </div>
  );
}

function EntryCard({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-0 flex-1 overflow-hidden rounded-[24px] bg-white/95 p-4 shadow-[0_20px_40px_rgba(15,23,42,0.11)]">
      {children}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
      {message}
    </div>
  );
}

function SectionCard({
  children,
  icon: Icon,
  title,
}: {
  children: ReactNode;
  icon: (props: IconProps) => ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-xl bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#3399e6]" />
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="flex h-11 w-full items-center rounded-lg bg-[#f0f3f7] px-3 text-sm text-slate-800">
        {value}
      </div>
    </label>
  );
}

function PreferenceCheckbox({
  defaultChecked,
  name,
  text,
}: {
  defaultChecked?: boolean;
  name: string;
  text: string;
}) {
  return (
    <label className="flex w-full items-start gap-2 rounded-xl border border-[#d8e4f1] bg-[#f8fbff] px-3 py-2.5 text-left">
      <input
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-[#3399e6]"
        defaultChecked={defaultChecked}
        name={name}
        type="checkbox"
      />
      <span className="text-xs leading-relaxed text-slate-600">{text}</span>
    </label>
  );
}

function WelcomeStep({
  context,
  errorMessage,
}: {
  context: PatientOnboardingContext;
  errorMessage: string | null;
}) {
  return (
    <PatientGradientBackground>
      <div className="flex min-h-0 flex-1 flex-col px-5 pb-6 pt-10">
        <EntryHero />
        <EntryTabs activeTab="register" />
        <EntryCard>
          <div className="h-full overflow-y-auto pr-1">
            <div className="space-y-5 pb-2">
              <div className="space-y-1 text-center">
                <h2 className="text-2xl font-bold text-slate-900">
                  Create Your Account
                </h2>
                <p className="text-sm text-slate-500">
                  Join our HIPAA-compliant transplant platform
                </p>
              </div>

              {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

              <form action={savePatientWelcomePreferences} className="space-y-5">
                <SectionCard icon={UserIcon} title="Personal Information">
                  <ReadOnlyField
                    label="First Name"
                    value={context.patient.firstName}
                  />
                  <ReadOnlyField
                    label="Last Name"
                    value={context.patient.lastName}
                  />
                </SectionCard>

                <SectionCard icon={MailIcon} title="Contact Information">
                  <ReadOnlyField
                    label="Email Address"
                    value={context.patient.email}
                  />
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">
                      Preferred Language
                    </span>
                    <select
                      className="h-11 w-full rounded-lg bg-[#f0f3f7] px-3 text-sm text-slate-800 outline-none ring-offset-2 focus:ring-2 focus:ring-[#cfe7fd]"
                      defaultValue={context.patient.preferredLanguage}
                      name="preferredLanguage"
                      required
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                    </select>
                  </label>
                </SectionCard>

                <SectionCard icon={BellIcon} title="Communication Preferences">
                  <PreferenceCheckbox
                    defaultChecked={context.currentCase.smsConsent}
                    name="smsConsent"
                    text="I agree to receive text reminders about my transplant intake steps."
                  />
                  <PreferenceCheckbox
                    defaultChecked={context.currentCase.emailConsent}
                    name="emailConsent"
                    text="I agree to receive email updates about my transplant intake steps."
                  />
                </SectionCard>

                <button
                  className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#3399e6] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(51,153,230,0.35)]"
                  type="submit"
                >
                  Continue
                </button>
              </form>
            </div>
          </div>
        </EntryCard>
      </div>
    </PatientGradientBackground>
  );
}

function ConsentSectionBlock({ section }: { section: ConsentSection }) {
  return (
    <section>
      <h5 className="mb-1 text-xs font-bold text-[#3380cc]">{section.heading}</h5>

      {section.paragraphs?.map((paragraph) => (
        <p key={paragraph} className="mb-2 text-[13px] leading-relaxed text-slate-700">
          {paragraph}
        </p>
      ))}

      {section.bullets?.map((item) => (
        <div key={item} className="mb-1.5 flex items-start gap-2 pl-2">
          <span className="text-[13px] leading-5 text-slate-700">•</span>
          <p className="text-[13px] leading-relaxed text-slate-700">{item}</p>
        </div>
      ))}

      {section.numbered?.map((item) => (
        <div key={`${item.label}-${item.text}`} className="mb-1.5 flex items-start gap-2 pl-2">
          <span className="w-5 text-[13px] font-semibold leading-5 text-slate-700">
            {item.label}
          </span>
          <p className="text-[13px] leading-relaxed text-slate-700">{item.text}</p>
        </div>
      ))}

      {section.checkItems?.map((item) => (
        <div key={item} className="mb-1.5 flex items-start gap-2 pl-2">
          <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
          <p className="text-[13px] leading-relaxed text-slate-700">{item}</p>
        </div>
      ))}
    </section>
  );
}

function ConsentAcknowledgement({
  ariaLabel,
  name,
  text,
}: {
  ariaLabel: string;
  name: string;
  text: string;
}) {
  return (
    <label className="flex items-start gap-2.5">
      <input
        aria-label={ariaLabel}
        className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-400 accent-[#1f6eb3]"
        name={name}
        required
        type="checkbox"
      />
      <p className="text-xs leading-relaxed text-slate-700">{text}</p>
    </label>
  );
}

function ConsentDocumentScreen({
  action,
  agreementText,
  acknowledgmentFields,
  documentSubtitle,
  documentTitleLines,
  documentTitleRuleWidth,
  errorMessage,
  footerNote,
  headerIcon: HeaderIcon,
  navigationTitle,
  sections,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  agreementText: string;
  acknowledgmentFields: ReactNode;
  documentSubtitle?: string;
  documentTitleLines: string[];
  documentTitleRuleWidth: number;
  errorMessage: string | null;
  footerNote?: string;
  headerIcon: (props: IconProps) => ReactNode;
  navigationTitle: string;
  sections: ConsentSection[];
  submitLabel: string;
}) {
  const formattedDate = new Date().toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="min-h-screen bg-[#edf1f6]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
        <div className="border-b border-[#dfe6ef] bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700">
          {navigationTitle}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-4 pb-6 pt-4">
            <div className="space-y-3 text-center">
              <HeaderIcon className="mx-auto h-12 w-12 text-[#3380cc]" />
              <p className="text-xs font-bold tracking-[0.24em] text-[#3380cc]">
                TRANSPLANT WIZARD
              </p>
            </div>

            <form action={action} className="space-y-4">
              <div className="mx-4 rounded-xl bg-white p-5 shadow-[0_8px_18px_rgba(15,23,42,0.12)]">
                <div className="mb-5 text-center">
                  {documentTitleLines.map((line) => (
                    <p key={line} className="text-sm font-bold text-slate-900">
                      {line}
                    </p>
                  ))}
                  <div
                    className="mx-auto mt-2 h-0.5 bg-[#3380cc]"
                    style={{ maxWidth: "80%", width: `${documentTitleRuleWidth}px` }}
                  />
                  {documentSubtitle ? (
                    <p className="mt-2 text-[10px] font-medium text-slate-500">
                      {documentSubtitle}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-3">
                  {sections.map((section) => (
                    <ConsentSectionBlock key={section.heading} section={section} />
                  ))}
                </div>

                <div className="mt-4 border-t border-[#d7dde8] pt-5">
                  <h4 className="text-sm font-bold text-slate-900">
                    PATIENT SIGNATURE
                  </h4>

                  <div className="mt-3 space-y-3">{acknowledgmentFields}</div>

                  <p className="mt-3 text-xs leading-relaxed text-slate-700">
                    {agreementText}
                  </p>

                  <div className="mt-4">
                    <p className="mb-1 text-[11px] font-semibold text-slate-500">
                      Signature (simulated)
                    </p>
                    <div className="flex h-[100px] w-full items-center justify-center rounded-lg bg-[#f2f4f7] text-slate-500">
                      <Image
                        alt="Simulated patient signature"
                        className="h-[90px] w-auto object-contain"
                        height={90}
                        src={SIMULATED_SIGNATURE_DATA_URL}
                        unoptimized
                        width={320}
                      />
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-slate-600">
                    <span className="font-semibold text-slate-500">Date:</span>{" "}
                    {formattedDate}
                  </div>
                  {footerNote ? (
                    <p className="mt-3 text-[10px] italic text-slate-500">
                      {footerNote}
                    </p>
                  ) : null}
                </div>
              </div>

              {errorMessage ? (
                <p className="px-4 text-xs text-red-600">{errorMessage}</p>
              ) : null}

              <div className="flex justify-center px-4">
                <button
                  className="mx-auto flex h-12 w-full max-w-[420px] items-center justify-center rounded-xl bg-gradient-to-r from-[#3380cc] to-[#2a6ea9] text-center text-sm font-semibold text-white shadow-[0_8px_16px_rgba(51,128,204,0.35)]"
                  type="submit"
                >
                  {submitLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

function LinkRequiredStep({ errorMessage }: { errorMessage: string | null }) {
  return (
    <PatientGradientBackground>
      <div className="flex min-h-0 flex-1 flex-col px-5 pb-6 pt-10">
        <EntryHero />
        <EntryTabs activeTab="login" />
        <EntryCard>
          <div className="h-full overflow-y-auto pr-1">
            <div className="space-y-4">
              {errorMessage ? <ErrorBanner message={errorMessage} /> : null}
              <div className="rounded-xl bg-[#edf5ff] px-3 py-2 text-xs text-[#2a6ead]">
                Continue with your secure onboarding link.
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-slate-900">
                  Welcome Back
                </h2>
                <p className="text-sm text-slate-500">
                  Open the secure sign-in link sent by your clinic to continue your
                  transplant onboarding.
                </p>
              </div>

              <div className="rounded-xl border border-[#d8e4f1] bg-white px-4 py-4 text-sm leading-relaxed text-slate-600">
                This MVP does not use a separate patient password. Your secure
                magic-link signs you in directly and returns you to the patient
                portal.
              </div>
            </div>
          </div>
        </EntryCard>
      </div>
    </PatientGradientBackground>
  );
}

function RoiForm1Step({ errorMessage }: { errorMessage: string | null }) {
  return (
    <ConsentDocumentScreen
      acknowledgmentFields={
        <>
          <ConsentAcknowledgement
            ariaLabel="Acknowledge records release"
            name="acknowledgeRecordsRelease"
            text="I understand this release allows the transplant team to request records needed for my evaluation."
          />
          <ConsentAcknowledgement
            ariaLabel="Acknowledge communication rights"
            name="acknowledgeCommunicationRights"
            text="I understand this authorization supports communication between the care teams involved in my referral."
          />
        </>
      }
      action={signPatientRoiForm1}
      agreementText="I have read, understand, and agree to the terms of this Consent for Transplant Wizard Services."
      documentTitleLines={["CONSENT FOR TRANSPLANT WIZARD SERVICES"]}
      documentTitleRuleWidth={200}
      errorMessage={errorMessage}
      headerIcon={CrossIcon}
      navigationTitle="Services Consent"
      sections={SERVICES_CONSENT_SECTIONS}
      submitLabel="I Agree & Continue"
    />
  );
}

function RoiForm2Step({ errorMessage }: { errorMessage: string | null }) {
  return (
    <ConsentDocumentScreen
      acknowledgmentFields={
        <>
          <ConsentAcknowledgement
            ariaLabel="Acknowledge HIPAA authorization"
            name="acknowledgeHipaaAuthorization"
            text="I authorize the transplant program to use and disclose the protected health information needed for my intake."
          />
          <ConsentAcknowledgement
            ariaLabel="Acknowledge sensitive information"
            name="acknowledgeSensitiveInformation"
            text="I understand this authorization may include sensitive information needed for the transplant center to continue my evaluation."
          />
        </>
      }
      action={signPatientRoiForm2}
      agreementText="I authorize the release of my protected health information as described above and understand my rights regarding this authorization."
      documentSubtitle="HIPAA COMPLIANT • 45 CFR § 164.508"
      documentTitleLines={[
        "AUTHORIZATION FOR RELEASE",
        "OF PROTECTED HEALTH INFORMATION",
      ]}
      documentTitleRuleWidth={280}
      errorMessage={errorMessage}
      footerNote="This form complies with HIPAA regulations (45 CFR Parts 160 and 164) and applicable state privacy laws."
      headerIcon={FileTextIcon}
      navigationTitle="Medical Records Authorization"
      sections={MEDICAL_CONSENT_SECTIONS}
      submitLabel="I Authorize & Continue"
    />
  );
}

function CompleteStep({ context }: { context: PatientOnboardingContext }) {
  return (
    <PatientGradientBackground>
      <div className="flex min-h-0 flex-1 flex-col px-5 pb-6 pt-10">
        <EntryHero />
        <EntryCard>
          <div className="h-full overflow-y-auto pr-1">
            <div className="space-y-4 pb-2">
              <section className="rounded-2xl bg-gradient-to-r from-[#3380cc] to-[#2a6ea9] p-4 shadow-[0_12px_24px_rgba(42,110,169,0.35)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                  Welcome Back
                </p>
                <h2 className="mt-1 text-2xl font-bold text-white">
                  {context.patient.firstName}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-blue-100">
                  Your onboarding forms are complete. The transplant team will
                  contact you about the next steps in your intake process.
                </p>
              </section>

              <section className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.07)]">
                <div className="mb-2 flex items-center gap-2">
                  <FileTextIcon className="h-4 w-4 text-[#3399e6]" />
                  <h3 className="text-base font-semibold text-slate-900">
                    Onboarding Complete
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-600">
                  Your authorization forms have been received and your referral is
                  ready for the next intake stage.
                </p>
                <div className="mt-3 rounded-xl bg-[#edf5ff] px-3 py-3 text-xs leading-relaxed text-[#2a6ead]">
                  Case {context.currentCase.caseNumber} has advanced successfully.
                </div>
              </section>
            </div>
          </div>
        </EntryCard>
      </div>
    </PatientGradientBackground>
  );
}

export function PatientOnboardingView({
  context,
  errorMessage,
  step,
}: PatientOnboardingViewProps) {
  if (step === "link-required") {
    return <LinkRequiredStep errorMessage={errorMessage} />;
  }

  if (!context) {
    return <LinkRequiredStep errorMessage={errorMessage} />;
  }

  if (step === "welcome") {
    return <WelcomeStep context={context} errorMessage={errorMessage} />;
  }

  if (step === "roi-form-1") {
    return <RoiForm1Step errorMessage={errorMessage} />;
  }

  if (step === "roi-form-2") {
    return <RoiForm2Step errorMessage={errorMessage} />;
  }

  return <CompleteStep context={context} />;
}
