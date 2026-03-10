export type FrontDeskIntakeQueueItem = {
  caseNumber: string;
  clinicName: string;
  patientName: string;
  roiCompletedAt: string | null;
  stage: "initial-todos";
};

export function formatCenterDate(dateValue: string | null) {
  if (!dateValue) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateValue));
}
