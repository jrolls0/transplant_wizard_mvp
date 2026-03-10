export type ClinicReferralStage =
  | "initial-todos"
  | "new-referral"
  | "patient-onboarding";

export type ClinicReferralListItem = {
  caseNumber: string;
  createdAt: string;
  patientName: string;
  stage: ClinicReferralStage;
  stageEnteredAt: string;
};

export function getClinicStageMeta(stage: ClinicReferralStage) {
  switch (stage) {
    case "initial-todos":
      return {
        accentClass:
          "border-[#cde7d8] bg-[#f4fbf6] text-[#21563a]",
        helperText: "ROI complete",
        label: "Initial TODOs",
      };
    case "patient-onboarding":
      return {
        accentClass:
          "border-[#d7e6f4] bg-[#f5faff] text-[#285f87]",
        helperText: "Awaiting ROI",
        label: "Patient Onboarding",
      };
    default:
      return {
        accentClass:
          "border-[#e2e8f0] bg-[#f8fafc] text-[#475569]",
        helperText: "Referral submitted",
        label: "New Referral",
      };
  }
}
