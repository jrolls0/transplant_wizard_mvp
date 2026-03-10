export type PortalType = "clinic" | "patient" | "center";

export function normalizePortalType(value: unknown): PortalType | null {
  if (value === "clinic" || value === "patient" || value === "center") {
    return value;
  }

  return null;
}
