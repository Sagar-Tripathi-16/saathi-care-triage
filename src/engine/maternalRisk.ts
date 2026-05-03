import type { PatientInput, TriageResult } from "./types";
import type { AssessmentRecord, HighRiskPregnancyFlag } from "@/storage/db";

const HIGH_RISK_SYMPTOMS: Record<string, string> = {
  heavy_bleeding: "risk_heavy_bleeding",
  severe_headache: "risk_severe_headache",
  headache_severe: "risk_severe_headache",    // graded chip variant stored in symptoms[]
  headache_persistent: "risk_headache",       // persistent headache during pregnancy
  blurred_vision: "risk_blurred_vision",
  severe_weakness: "risk_severe_weakness",
  weakness_severe: "risk_severe_weakness",    // graded chip variant stored in symptoms[]
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Pure, deterministic post-engine advisory flag.
 * Does NOT modify or replace the deterministic triage result.
 */
export function computeHighRiskPregnancy(
  input: PatientInput,
  _result: TriageResult,
  priorAssessmentsForPatient: AssessmentRecord[] = [],
  now: number = Date.now(),
): HighRiskPregnancyFlag {
  if (input.pregnant !== true) return { flagged: false, reasons: [] };

  const reasons: string[] = [];

  if (typeof input.hemoglobin === "number" && input.hemoglobin < 7) {
    reasons.push("risk_severe_anemia");
  }

  const symptoms = new Set(input.symptoms ?? []);
  for (const [sym, key] of Object.entries(HIGH_RISK_SYMPTOMS)) {
    if (symptoms.has(sym) || input[sym] === true) {
      if (!reasons.includes(key)) reasons.push(key);
    }
  }

  const recentReferrals = priorAssessmentsForPatient.filter(
    (r) =>
      now - r.created_at <= THIRTY_DAYS_MS &&
      (r.severity === "Emergency" || r.severity === "PHC Referral"),
  );
  if (recentReferrals.length >= 2) {
    reasons.push("risk_repeated_referrals");
  }

  return { flagged: reasons.length > 0, reasons };
}
