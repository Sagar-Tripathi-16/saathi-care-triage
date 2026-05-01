import type { PatientInput, ValidationIssue } from "./types";

const RANGES: Record<string, [number, number]> = {
  spo2: [50, 100],
  temperature: [30, 45],
  hemoglobin: [1, 25],
  age: [0, 120],
  respiratory_rate: [5, 120],
  pregnancy_weeks: [0, 45],
  fever_duration_days: [0, 365],
};

export function validate(input: PatientInput): { issues: ValidationIssue[]; canProceed: boolean } {
  const issues: ValidationIssue[] = [];

  // Mandatory: age + at least temp or spo2 or symptoms
  if (input.age === undefined || input.age === null) {
    issues.push({ field: "age", level: "error", message: "Age is required." });
  }

  const hasSymptoms = Array.isArray(input.symptoms) && input.symptoms.length > 0;
  const hasTemp = typeof input.temperature === "number";
  const hasSpo2 = typeof input.spo2 === "number";
  if (!hasSymptoms && !hasTemp && !hasSpo2) {
    issues.push({
      level: "error",
      message: "Provide at least one of: symptoms, temperature, or SpO₂.",
    });
  }

  // Range checks
  for (const [field, [min, max]] of Object.entries(RANGES)) {
    const v = input[field];
    if (typeof v === "number" && (v < min || v > max)) {
      issues.push({
        field,
        level: "error",
        message: `${field} must be between ${min} and ${max} (got ${v}).`,
      });
    }
  }

  // Maternal sanity
  if (input.pregnant === true && (typeof input.age === "number" && input.age < 10)) {
    issues.push({ field: "pregnant", level: "warning", message: "Pregnancy flag with age < 10 — please re-check." });
  }

  // Contradictions (warnings only — never block escalation)
  if (typeof input.spo2 === "number" && input.spo2 >= 97 && input.breathlessness === "severe") {
    issues.push({
      level: "warning",
      message: "SpO₂ is normal but severe breathlessness reported — please re-measure SpO₂.",
    });
  }
  if (typeof input.temperature === "number" && input.temperature < 37.5 && input.fever_duration_days && input.fever_duration_days > 0) {
    issues.push({
      level: "warning",
      message: "Fever reported but current temperature is normal — patient may have taken antipyretic.",
    });
  }

  const canProceed = !issues.some((i) => i.level === "error");
  return { issues, canProceed };
}
