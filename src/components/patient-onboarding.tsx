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

const stepLabels = {
  complete: "Complete",
  "link-required": "Sign in",
  "roi-form-1": "ROI Form 1",
  "roi-form-2": "ROI Form 2",
  welcome: "Welcome",
} as const;

const roiForm1Sections: ConsentSection[] = [
  {
    heading: "Purpose of This Authorization",
    paragraphs: [
      "Transplant Wizard and the transplant program use this authorization to request, review, and share the medical information needed to continue your kidney transplant intake.",
      "This authorization supports communication between your dialysis clinic, social worker, nephrologist, and transplant center so your referral can move forward without delay.",
    ],
  },
  {
    heading: "Information That May Be Requested",
    bullets: [
      "Dialysis treatment records and social work documentation",
      "Laboratory results, imaging, and referral notes",
      "Insurance and transplant-evaluation records needed for intake",
    ],
  },
  {
    heading: "Your Rights",
    checkItems: [
      "You may request a copy of this authorization for your records.",
      "You may revoke this authorization in writing according to transplant-center policy.",
      "Revoking this authorization may limit how quickly the program can continue your intake.",
    ],
  },
];

const roiForm2Sections: ConsentSection[] = [
  {
    heading: "Protected Health Information Authorization",
    paragraphs: [
      "This authorization allows the transplant program to use and disclose protected health information needed to complete your intake review and coordinate next steps.",
      "The information may include clinical history, specialist notes, referral summaries, insurance details, and other records required for transplant evaluation.",
    ],
  },
  {
    heading: "Who May Receive This Information",
    numbered: [
      {
        label: "1.",
        text: "Members of the transplant center involved in intake and evaluation.",
      },
      {
        label: "2.",
        text: "Your dialysis clinic team and nephrology care team when coordination is required.",
      },
      {
        label: "3.",
        text: "Authorized operational staff supporting scheduling, records follow-up, and intake progression.",
      },
    ],
  },
  {
    heading: "Important Notes",
    checkItems: [
      "This milestone covers only onboarding and consent collection.",
      "After this form is signed, your case advances to the next intake stage.",
      "A transplant team member will contact you with the next required steps.",
    ],
  },
];

function PatientBackground({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f2f7ff] via-[#ecf3ff] to-[#e2edf8] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">{children}</div>
    </main>
  );
}

function BrandMark({ large = false }: { large?: boolean }) {
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-gradient-to-br from-[#3399e6] to-[#1f83d2] text-white shadow-[0_10px_24px_rgba(51,153,230,0.35)] ${
        large ? "h-16 w-16 text-lg font-bold" : "h-11 w-11 text-sm font-semibold"
      }`}
    >
      TW
    </div>
  );
}

function EntryShell({
  body,
  eyebrow,
  footer,
  hero,
  title,
}: {
  body: ReactNode;
  eyebrow: string;
  footer?: ReactNode;
  hero: ReactNode;
  title: string;
}) {
  return (
    <PatientBackground>
      <div className="px-5 pb-6 pt-10">
        <div className="mb-6 mt-2 text-center">
          <div className="mx-auto mb-3">
            <BrandMark large />
          </div>
          <h1 className="text-[2rem] font-bold leading-tight text-slate-900">
            {title}
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">{eyebrow}</p>
          <div className="mt-3 text-sm leading-relaxed text-slate-600">{hero}</div>
        </div>

        <div className="rounded-[28px] bg-white/95 p-4 shadow-[0_20px_40px_rgba(15,23,42,0.11)]">
          {body}
        </div>

        {footer ? <div className="mt-4 px-1">{footer}</div> : null}
      </div>
    </PatientBackground>
  );
}

function EntryTabs({ activeTab }: { activeTab: EntryTab }) {
  return (
    <div className="mb-4 flex rounded-2xl bg-[#eff4fa] p-1">
      <div
        className={`flex-1 rounded-xl px-4 py-2 text-center text-sm font-semibold transition ${
          activeTab === "login" ? "bg-[#3399e6] text-white" : "text-slate-500"
        }`}
      >
        Login
      </div>
      <div
        className={`flex-1 rounded-xl px-4 py-2 text-center text-sm font-semibold transition ${
          activeTab === "register" ? "bg-[#3399e6] text-white" : "text-slate-500"
        }`}
      >
        Register
      </div>
    </div>
  );
}

function ProgressHeader({
  caseNumber,
  currentStep,
}: {
  caseNumber: string;
  currentStep: PatientOnboardingStep;
}) {
  const orderedSteps = ["welcome", "roi-form-1", "roi-form-2", "complete"] as const;
  const currentIndex = orderedSteps.indexOf(
    currentStep === "link-required" ? "welcome" : currentStep,
  );

  return (
    <div className="mb-4 rounded-2xl bg-[#f4f8fd] px-4 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3380cc]">
            Case {caseNumber}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {currentStep === "complete"
              ? "Onboarding finished"
              : `${stepLabels[currentStep]} step`}
          </p>
        </div>
        <div className="flex gap-2">
          {orderedSteps.map((step, index) => {
            const isActive = currentStep === step;
            const isComplete = currentStep === "complete" || index < currentIndex;

            return (
              <span
                key={step}
                className={`h-2.5 w-9 rounded-full transition ${
                  isComplete
                    ? "bg-[#3399e6]"
                    : isActive
                      ? "bg-[#8cc7f3]"
                      : "bg-[#d9e7f5]"
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
      {message}
    </div>
  );
}

function RegistrationSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-xl bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]">
      <h3 className="mb-3 text-base font-semibold text-slate-900">{title}</h3>
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
      <div className="flex min-h-11 items-center rounded-lg bg-[#f0f3f7] px-3 text-sm text-slate-800">
        {value}
      </div>
    </label>
  );
}

function StyledField({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
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
    <label className="flex items-start gap-2 rounded-xl border border-[#d8e4f1] bg-[#f8fbff] px-3 py-2.5 text-left">
      <input
        className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#3399e6]"
        defaultChecked={defaultChecked}
        name={name}
        type="checkbox"
      />
      <span className="text-xs leading-relaxed text-slate-600">{text}</span>
    </label>
  );
}

function ServicesFootnote() {
  return (
    <div className="pb-1 text-center">
      <p className="text-[11px] text-slate-500">
        By continuing, you agree to the Transplant Wizard intake process.
      </p>
      <p className="mt-2 text-[11px] text-emerald-600">
        Your onboarding information is handled in a HIPAA-compliant workflow.
      </p>
    </div>
  );
}

function PanelIntro({
  subtitle,
  title,
}: {
  subtitle: string;
  title: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{subtitle}</p>
    </div>
  );
}

function WelcomeStep({ context }: { context: PatientOnboardingContext }) {
  return (
    <EntryShell
      eyebrow="Your journey to a new beginning"
      footer={<ServicesFootnote />}
      hero={
        <p>
          Complete the remaining registration details for case{" "}
          <span className="font-semibold text-slate-700">
            {context.currentCase.caseNumber}
          </span>{" "}
          before you review the required release forms.
        </p>
      }
      title="Patient Portal"
      body={
        <div>
          <EntryTabs activeTab="register" />
          <PanelIntro
            subtitle="Join our HIPAA-compliant transplant platform"
            title="Create Your Account"
          />

          <form action={savePatientWelcomePreferences} className="space-y-4">
            <RegistrationSection title="Personal Information">
              <ReadOnlyField
                label="First name"
                value={context.patient.firstName}
              />
              <ReadOnlyField label="Last name" value={context.patient.lastName} />
            </RegistrationSection>

            <RegistrationSection title="Contact Information">
              <ReadOnlyField label="Email address" value={context.patient.email} />
              <StyledField label="Preferred language">
                <select
                  className="h-11 w-full rounded-lg bg-[#f0f3f7] px-3 text-sm text-slate-800 outline-none ring-offset-2 focus:ring-2 focus:ring-[#cfe7fd]"
                  defaultValue={context.patient.preferredLanguage}
                  name="preferredLanguage"
                  required
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                </select>
              </StyledField>
            </RegistrationSection>

            <RegistrationSection title="Communication Preferences">
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
            </RegistrationSection>

            <button
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#3399e6] to-[#1f83d2] text-sm font-semibold text-white shadow-[0_8px_18px_rgba(51,153,230,0.32)]"
              type="submit"
            >
              Continue to ROI Form 1
            </button>
          </form>
        </div>
      }
    />
  );
}

function ConsentSectionBlock({ section }: { section: ConsentSection }) {
  return (
    <section>
      <h4 className="mb-1 text-xs font-bold text-[#3380cc]">{section.heading}</h4>

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
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
          <p className="text-[13px] leading-relaxed text-slate-700">{item}</p>
        </div>
      ))}
    </section>
  );
}

function SignatureBlock({
  agreementText,
  name,
}: {
  agreementText: string;
  name: string;
}) {
  const formattedDate = new Date().toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mt-4 border-t border-[#d7dde8] pt-5">
      <h4 className="text-sm font-bold text-slate-900">PATIENT SIGNATURE</h4>

      <p className="mt-3 text-xs leading-relaxed text-slate-700">{agreementText}</p>

      <div className="mt-4">
        <p className="mb-1 text-[11px] font-semibold text-slate-500">
          Signature (simulated)
        </p>
        <div className="flex h-[100px] w-full items-center justify-center rounded-lg bg-[#f2f4f7] px-4">
          <span className="text-3xl italic tracking-wide text-slate-500">
            {name}
          </span>
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-600">
        <span className="font-semibold text-slate-500">Date:</span> {formattedDate}
      </div>
    </div>
  );
}

function ConsentDocumentScreen({
  action,
  acknowledgmentFields,
  agreementText,
  caseNumber,
  documentSubtitle,
  documentTitleLines,
  documentTitleRuleWidth,
  footerNote,
  navigationTitle,
  sections,
  step,
  submitLabel,
  supportBody,
}: {
  action: (formData: FormData) => void;
  acknowledgmentFields: ReactNode;
  agreementText: string;
  caseNumber: string;
  documentSubtitle?: string;
  documentTitleLines: string[];
  documentTitleRuleWidth: number;
  footerNote?: string;
  navigationTitle: string;
  sections: ConsentSection[];
  step: PatientOnboardingStep;
  submitLabel: string;
  supportBody: string;
}) {
  return (
    <PatientBackground>
      <div className="border-b border-[#dfe6ef] bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700">
        {navigationTitle}
      </div>

      <div className="flex-1 overflow-y-auto pb-6 pt-4">
        <div className="space-y-4">
          <div className="space-y-3 text-center">
            <div className="mx-auto">
              <BrandMark />
            </div>
            <p className="text-xs font-bold tracking-[0.24em] text-[#3380cc]">
              TRANSPLANT WIZARD
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Case {caseNumber} · {stepLabels[step]}
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

              <div className="mt-4 rounded-xl bg-[#f8fbff] p-4">
                <h4 className="text-sm font-bold text-slate-900">
                  Required acknowledgements
                </h4>
                <div className="mt-3">{acknowledgmentFields}</div>
              </div>

              <SignatureBlock
                agreementText={agreementText}
                name="Patient Signature"
              />

              {footerNote ? (
                <p className="mt-3 text-[10px] italic text-slate-500">{footerNote}</p>
              ) : null}
            </div>

            <div className="flex justify-center px-4">
              <button
                className="mx-auto flex h-12 w-full max-w-[420px] items-center justify-center rounded-xl bg-gradient-to-r from-[#3380cc] to-[#2a6ea9] text-center text-sm font-semibold text-white shadow-[0_8px_16px_rgba(51,128,204,0.35)]"
                type="submit"
              >
                {submitLabel}
              </button>
            </div>

            <div className="px-4 text-center">
              <p className="text-[11px] leading-relaxed text-slate-500">
                {supportBody}
              </p>
            </div>
          </form>
        </div>
      </div>
    </PatientBackground>
  );
}

function RoiForm1Step({ context }: { context: PatientOnboardingContext }) {
  return (
    <ConsentDocumentScreen
      action={signPatientRoiForm1}
      acknowledgmentFields={
        <div className="space-y-2">
          <label className="flex items-start gap-2.5">
            <input
              aria-label="Acknowledge records release"
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-400 accent-[#3380cc]"
              name="acknowledgeRecordsRelease"
              required
              type="checkbox"
            />
            <span className="text-xs leading-relaxed text-slate-700">
              I understand this release allows the transplant team to request
              records needed for my evaluation.
            </span>
          </label>
          <label className="flex items-start gap-2.5">
            <input
              aria-label="Acknowledge communication rights"
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-400 accent-[#3380cc]"
              name="acknowledgeCommunicationRights"
              required
              type="checkbox"
            />
            <span className="text-xs leading-relaxed text-slate-700">
              I understand this authorization supports communication between the
              care teams involved in my referral.
            </span>
          </label>
        </div>
      }
      agreementText="I understand this release allows the transplant team to request records needed for my evaluation and supports communication between the care teams involved in my referral."
      caseNumber={context.currentCase.caseNumber}
      documentTitleLines={["AUTHORIZATION FOR RELEASE", "OF TRANSPLANT INTAKE RECORDS"]}
      documentTitleRuleWidth={260}
      navigationTitle="ROI Form 1"
      sections={roiForm1Sections}
      step="roi-form-1"
      submitLabel="Sign and Continue"
      supportBody="This first release confirms that the transplant program may collect and review the records needed to continue your intake."
      footerNote="A second release form is required before your referral can move into the next intake stage."
    />
  );
}

function RoiForm2Step({ context }: { context: PatientOnboardingContext }) {
  return (
    <ConsentDocumentScreen
      action={signPatientRoiForm2}
      acknowledgmentFields={
        <div className="space-y-2">
          <label className="flex items-start gap-2.5">
            <input
              aria-label="Acknowledge HIPAA authorization"
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-400 accent-[#3380cc]"
              name="acknowledgeHipaaAuthorization"
              required
              type="checkbox"
            />
            <span className="text-xs leading-relaxed text-slate-700">
              I authorize the transplant program to use and disclose the protected
              health information needed for my intake.
            </span>
          </label>
          <label className="flex items-start gap-2.5">
            <input
              aria-label="Acknowledge sensitive information"
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-400 accent-[#3380cc]"
              name="acknowledgeSensitiveInformation"
              required
              type="checkbox"
            />
            <span className="text-xs leading-relaxed text-slate-700">
              I understand this authorization may include sensitive information
              needed for the transplant center to continue my evaluation.
            </span>
          </label>
        </div>
      }
      agreementText="By signing below, I certify that I have read and understand this Authorization for Release of Protected Health Information and I voluntarily consent to the disclosure of my health information as described above."
      caseNumber={context.currentCase.caseNumber}
      documentSubtitle="HIPAA COMPLIANT • 45 CFR § 164.508"
      documentTitleLines={[
        "AUTHORIZATION FOR RELEASE",
        "OF PROTECTED HEALTH INFORMATION",
      ]}
      documentTitleRuleWidth={280}
      footerNote="Submitting this form completes the explicit onboarding checkpoint and advances your case to initial TODOs."
      navigationTitle="ROI Form 2"
      sections={roiForm2Sections}
      step="roi-form-2"
      submitLabel="Sign and Finish"
      supportBody="This is the final required onboarding form. Once it is signed, your referral moves into the next transplant intake stage."
    />
  );
}

function CompleteStep({ context }: { context: PatientOnboardingContext }) {
  return (
    <EntryShell
      eyebrow="Your journey to a new beginning"
      hero={
        <p>
          Your release forms are complete and your transplant intake onboarding has
          been received successfully.
        </p>
      }
      title="Patient Portal"
      body={
        <div>
          <PanelIntro
            subtitle={`Case ${context.currentCase.caseNumber} is ready for the next intake stage`}
            title={`You're all set, ${context.patient.firstName}`}
          />

          <section className="rounded-2xl bg-gradient-to-r from-[#3380cc] to-[#2a6ea9] p-4 shadow-[0_12px_24px_rgba(42,110,169,0.35)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              Onboarding complete
            </p>
            <h2 className="mt-1 text-2xl font-bold text-white">
              Release forms completed
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-blue-100">
              Thank you. The transplant team will contact you about next steps in
              your intake process.
            </p>
          </section>

          <section className="mt-4 rounded-xl bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]">
            <h3 className="text-base font-semibold text-slate-900">
              What to expect next
            </h3>
            <div className="mt-3 space-y-2">
              <div className="rounded-xl bg-[#f4f8fd] px-4 py-3">
                <p className="text-sm font-medium text-slate-900">
                  Your referral has moved into the next intake stage.
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  This milestone intentionally stops here. No dashboard or TODO list
                  is shown until later steps are implemented.
                </p>
              </div>
              <div className="rounded-xl bg-[#f4f8fd] px-4 py-3">
                <p className="text-sm font-medium text-slate-900">
                  Keep an eye on your messages and phone.
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  The transplant team may contact you to confirm next intake actions.
                </p>
              </div>
            </div>
          </section>
        </div>
      }
    />
  );
}

function LinkRequiredStep({ errorMessage }: { errorMessage: string | null }) {
  return (
    <EntryShell
      eyebrow="Your journey to a new beginning"
      hero={
        <p>
          Open the secure onboarding link shared by your clinic or transplant team to
          enter the patient portal.
        </p>
      }
      title="Patient Portal"
      body={
        <div>
          <EntryTabs activeTab="login" />
          {errorMessage ? <ErrorBanner message={errorMessage} /> : null}
          <PanelIntro
            subtitle="Continue with your secure onboarding link"
            title="Welcome Back"
          />

          <RegistrationSection title="Secure portal access">
            <p className="text-sm leading-relaxed text-slate-600">
              Your onboarding link will sign you in automatically and return you to
              the patient portal without a separate registration flow.
            </p>
            <div className="space-y-2 rounded-xl bg-[#f4f8fd] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3380cc]">
                Before you begin
              </p>
              <p className="text-sm leading-relaxed text-slate-600">
                Have your phone available in case the transplant team needs to follow
                up after you complete the release forms.
              </p>
            </div>
          </RegistrationSection>
        </div>
      }
    />
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
    return <WelcomeStep context={context} />;
  }

  if (step === "roi-form-1") {
    return <RoiForm1Step context={context} />;
  }

  if (step === "roi-form-2") {
    return <RoiForm2Step context={context} />;
  }

  return <CompleteStep context={context} />;
}
