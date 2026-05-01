import type { Severity } from "./types";

export const SEVERITY_LEVEL: Record<Severity, number> = {
  "Emergency": 3,
  "PHC Referral": 2,
  "Home Care": 1,
};

export function highest(a: Severity, b: Severity): Severity {
  return SEVERITY_LEVEL[a] >= SEVERITY_LEVEL[b] ? a : b;
}
