import type { PatientInput } from "./types";

const SYMPTOM_ALIASES: Record<string, string> = {
  "breathing issue": "breathlessness",
  "breathing problem": "breathlessness",
  "difficulty breathing": "breathlessness",
  "shortness of breath": "breathlessness",
  "sob": "breathlessness",
  "trouble breathing": "breathlessness",
  "fits": "convulsions",
  "seizure": "convulsions",
  "seizures": "convulsions",
  "passed out": "unconscious",
  "unresponsive": "unconscious",
  "not feeding": "unable_to_feed",
  "cant feed": "unable_to_feed",
  "cannot feed": "unable_to_feed",
  "cant drink": "unable_to_drink",
  "cannot drink": "unable_to_drink",
  "vomits everything": "vomiting_everything",
  "vomiting all": "vomiting_everything",
  "chest pain": "severe_chest_pain",
  "fainted": "fainting",
  "blackout": "fainting",
  "bleeding heavy": "heavy_bleeding",
  "heavy bleed": "heavy_bleeding",
  "no fetal movement": "fetal_movement_stopped",
  "less fetal movement": "reduced_fetal_movement",
  "indrawing": "chest_indrawing",
  "fast breathing": "fast_breathing",
};

const TRUE_VALUES = new Set(["yes", "y", "true", "1", "t", "haan", "haa"]);
const FALSE_VALUES = new Set(["no", "n", "false", "0", "f", "nahi"]);

export function coerceBool(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  if (v == null) return undefined;
  const s = String(v).trim().toLowerCase();
  if (TRUE_VALUES.has(s)) return true;
  if (FALSE_VALUES.has(s)) return false;
  return undefined;
}

export function normalizeSymptomLabel(s: string): string {
  const lower = s.trim().toLowerCase().replace(/\s+/g, " ");
  return SYMPTOM_ALIASES[lower] ?? lower.replace(/\s+/g, "_");
}

export function normalize(input: PatientInput): PatientInput {
  const out: PatientInput = { ...input };

  // numeric coercions
  for (const k of ["age", "temperature", "spo2", "hemoglobin", "respiratory_rate", "pregnancy_weeks", "fever_duration_days"] as const) {
    const v = out[k];
    if (v !== undefined && v !== null && v !== "") {
      const n = typeof v === "number" ? v : parseFloat(String(v));
      if (!Number.isNaN(n)) (out as Record<string, unknown>)[k] = n;
      else delete (out as Record<string, unknown>)[k];
    } else {
      delete (out as Record<string, unknown>)[k];
    }
  }

  // pregnant boolean
  const preg = coerceBool(out.pregnant);
  out.pregnant = preg ?? false;

  // normalize symptoms array → set boolean fields
  const normSymptoms: string[] = [];
  if (Array.isArray(out.symptoms)) {
    for (const s of out.symptoms) {
      if (typeof s !== "string") continue;
      const norm = normalizeSymptomLabel(s);
      if (!norm) continue;
      normSymptoms.push(norm);
      // expose as boolean field for rule conditions
      if (!(norm in out)) (out as Record<string, unknown>)[norm] = true;
    }
  }
  out.symptoms = normSymptoms;

  // breathlessness severity: if symptoms include "severe_breathlessness" or string in field
  if (normSymptoms.includes("severe_breathlessness")) {
    out.breathlessness = "severe";
  } else if (typeof out.breathlessness === "string") {
    out.breathlessness = out.breathlessness.trim().toLowerCase();
  } else if (out.breathlessness === true || normSymptoms.includes("breathlessness")) {
    // leave as flag; severe form requires explicit
    if (out.breathlessness !== "severe") out.breathlessness = out.breathlessness === true ? "mild" : out.breathlessness;
  }

  // coerce known boolean symptom fields if provided as strings
  const boolFields = [
    "convulsions", "unconscious", "unable_to_feed", "unable_to_drink",
    "vomiting_everything", "confusion", "chest_indrawing", "fast_breathing",
    "severe_chest_pain", "fainting", "severe_weakness", "heavy_bleeding",
    "severe_headache", "blurred_vision", "reduced_fetal_movement",
    "fetal_movement_stopped", "swelling", "dizziness",
  ];
  for (const f of boolFields) {
    if (f in out) {
      const b = coerceBool(out[f]);
      if (b !== undefined) (out as Record<string, unknown>)[f] = b;
    }
  }

  return out;
}
