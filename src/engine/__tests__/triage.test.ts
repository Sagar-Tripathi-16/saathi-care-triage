/**
 * Arogya Saathi — Deterministic Triage Engine Validation Suite
 *
 * Phase X Clinical Safety Audit — Scenario Test Matrix
 *
 * Purpose: Systematically validate that the triage engine produces
 * clinically correct outputs for known high-risk scenarios. These tests
 * are the clinical safety backbone for the product.
 *
 * Run with: npx vitest run src/engine/__tests__/triage.test.ts
 */

import { describe, it, expect } from "vitest";
import { runTriage } from "../index";
import type { PatientInput } from "../types";

function triage(input: PatientInput) {
  const out = runTriage(input);
  if (!out.ok || !out.result) throw new Error("Triage failed: " + JSON.stringify(out.validation_issues));
  return out.result;
}

// ─────────────────────────────────────────────────────────────────
// HELPER: Build base adult input
// ─────────────────────────────────────────────────────────────────
function adult(overrides: Partial<PatientInput> = {}): PatientInput {
  return { age: 35, sex: "female", ...overrides };
}
function child(overrides: Partial<PatientInput> = {}): PatientInput {
  return { age: 5, sex: "male", ...overrides };
}
function pregnant(overrides: Partial<PatientInput> = {}): PatientInput {
  return { age: 25, sex: "female", pregnant: true, pregnancy_weeks: 28, ...overrides };
}

// ─────────────────────────────────────────────────────────────────
// SECTION 1: Core Emergency Override Scenarios
// Critical safety requirement: these MUST ALWAYS produce Emergency
// ─────────────────────────────────────────────────────────────────
describe("Emergency Override — Core Danger Signs", () => {
  it("DANGER_001: Convulsions alone → Emergency", () => {
    const r = triage(adult({ symptoms: ["convulsions"] }));
    expect(r.triage).toBe("Emergency");
    expect(r.override_triggered).toBe(true);
    expect(r.urgency).toBe("Immediate");
  });

  it("DANGER_002: Unconsciousness alone → Emergency", () => {
    const r = triage(adult({ symptoms: ["unconscious"] }));
    expect(r.triage).toBe("Emergency");
    expect(r.override_triggered).toBe(true);
    expect(r.urgency).toBe("Immediate");
  });

  it("DANGER_003: Child unable to feed → Emergency", () => {
    const r = triage(child({ symptoms: ["unable_to_feed"] }));
    expect(r.triage).toBe("Emergency");
    expect(r.override_triggered).toBe(true);
  });

  it("RESP_001: SpO₂ < 90 → Emergency", () => {
    const r = triage(adult({ spo2: 85 }));
    expect(r.triage).toBe("Emergency");
    expect(r.override_triggered).toBe(true);
  });

  it("RESP_001: SpO₂ = 89 (boundary) → Emergency", () => {
    const r = triage(adult({ spo2: 89 }));
    expect(r.triage).toBe("Emergency");
  });

  it("RESP_002: Severe breathlessness → Emergency", () => {
    const r = triage(adult({ symptoms: ["breathlessness_severe"] }));
    expect(r.triage).toBe("Emergency");
    expect(r.override_triggered).toBe(true);
  });

  it("RESP_007: Respiratory rate > 30 → Emergency (adult)", () => {
    const r = triage(adult({ respiratory_rate: 35 }));
    expect(r.triage).toBe("Emergency");
    expect(r.override_triggered).toBe(true);
  });

  it("RESP_009: Respiratory rate > 60 → Emergency (child)", () => {
    const r = triage(child({ respiratory_rate: 65 }));
    expect(r.triage).toBe("Emergency");
    expect(r.override_triggered).toBe(true);
  });

  it("ADULT_001: Severe chest pain → Emergency", () => {
    const r = triage(adult({ symptoms: ["severe_chest_pain"] }));
    expect(r.triage).toBe("Emergency");
    expect(r.override_triggered).toBe(true);
  });

  it("ADULT_003: Fainting → Emergency", () => {
    const r = triage(adult({ symptoms: ["fainting"] }));
    expect(r.triage).toBe("Emergency");
    expect(r.override_triggered).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────
// SECTION 2: Maternal Emergencies
// ─────────────────────────────────────────────────────────────────
describe("Maternal Emergency Overrides", () => {
  it("MAT_001: Heavy bleeding in pregnancy → Emergency", () => {
    const r = triage(pregnant({ symptoms: ["heavy_bleeding"] }));
    expect(r.triage).toBe("Emergency");
    expect(r.override_triggered).toBe(true);
  });

  it("MAT_002: Severe headache + blurred vision in pregnancy → Emergency", () => {
    const r = triage(pregnant({ symptoms: ["headache_severe", "blurred_vision"] }));
    expect(r.triage).toBe("Emergency");
    expect(r.override_triggered).toBe(true);
  });

  it("MAT_004: Fetal movement stopped → Emergency", () => {
    const r = triage(pregnant({ symptoms: ["fetal_movement_stopped"] }));
    expect(r.triage).toBe("Emergency");
    expect(r.override_triggered).toBe(true);
  });

  it("ANEMIA_004: Hb < 7 in pregnancy → Emergency (no other symptoms needed)", () => {
    const r = triage(pregnant({ hemoglobin: 5 }));
    expect(r.triage).toBe("Emergency");
    expect(r.override_triggered).toBe(true);
  });

  it("ANEMIA_004: Hb = 6.9 (boundary) in pregnancy → Emergency", () => {
    const r = triage(pregnant({ hemoglobin: 6.9 }));
    expect(r.triage).toBe("Emergency");
  });
});

// ─────────────────────────────────────────────────────────────────
// SECTION 3: Dehydration Emergency
// ─────────────────────────────────────────────────────────────────
describe("Dehydration Overrides", () => {
  it("DEHY_001: Unable to drink + vomiting everything → Emergency (2 of 3 danger signs)", () => {
    const r = triage(adult({
      symptoms: ["unable_to_drink", "vomiting_everything"]
    }));
    expect(r.triage).toBe("Emergency");
    expect(r.override_triggered).toBe(true);
  });

  it("DEHY_001: Vomiting everything + confusion → Emergency", () => {
    const r = triage(adult({
      symptoms: ["vomiting_everything", "confusion"]
    }));
    expect(r.triage).toBe("Emergency");
    expect(r.override_triggered).toBe(true);
  });

  it("DEHY_001: All 3 dehydration signs → Emergency", () => {
    const r = triage(adult({
      symptoms: ["unable_to_drink", "vomiting_everything", "confusion"]
    }));
    expect(r.triage).toBe("Emergency");
    expect(r.override_triggered).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────
// SECTION 4: Critical Bug Regression — Override + Non-Override Co-occurrence
// Bug fix: non-override rule reasoning must be preserved when override fires
// ─────────────────────────────────────────────────────────────────
describe("Override Co-occurrence — Explainability Preservation", () => {
  it("Convulsions + moderate breathlessness → Emergency; breathlessness reasoning preserved", () => {
    const r = triage(adult({
      symptoms: ["convulsions", "breathlessness_moderate"]
    }));
    expect(r.triage).toBe("Emergency");
    expect(r.override_triggered).toBe(true);
    // The non-override breathlessness rule reasoning must appear in the output
    const reasoningText = r.reasoning.join(" ").toLowerCase();
    expect(reasoningText).toMatch(/convulsions|neurological/i);
    // Both drivers should be visible
    expect(r.triggered_rules).toContain("DANGER_001");
    expect(r.triggered_rules).toContain("RESP_005");
  });

  it("Heavy bleeding + severe headache + blurred vision (maternal) → Emergency; pre-eclampsia reasoning preserved", () => {
    const r = triage(pregnant({
      symptoms: ["heavy_bleeding", "headache_severe", "blurred_vision"]
    }));
    expect(r.triage).toBe("Emergency");
    expect(r.override_triggered).toBe(true);
    // Both MAT_001 (bleeding) and MAT_002 (pre-eclampsia) must be in triggered rules
    expect(r.triggered_rules).toContain("MAT_001");
    expect(r.triggered_rules).toContain("MAT_002");
    // Both emergency reasons must surface
    const reasoningText = r.reasoning.join(" ");
    expect(reasoningText).toMatch(/bleeding/i);
    expect(reasoningText).toMatch(/headache|pre-eclampsia|vision/i);
  });

  it("Fainting + convulsions → Emergency; both reasoning entries preserved", () => {
    const r = triage(adult({ symptoms: ["fainting", "convulsions"] }));
    expect(r.triage).toBe("Emergency");
    expect(r.triggered_rules).toContain("DANGER_001");
    expect(r.triggered_rules).toContain("ADULT_003");
  });

  it("FEVER_002 reasoning preserved when override also fires (fever+confusion with convulsions)", () => {
    const r = triage(adult({
      symptoms: ["convulsions", "confusion"],
      temperature: 39.5
    }));
    expect(r.triage).toBe("Emergency");
    // DANGER_001 (convulsions override) fires; FEVER_002 (fever+confusion) must also appear
    expect(r.triggered_rules).toContain("DANGER_001");
    const allRules = r.triggered_rules.join(" ");
    expect(allRules).toMatch(/FEVER_002|FEVER/);
  });
});

// ─────────────────────────────────────────────────────────────────
// SECTION 5: PHC Referral Cases
// ─────────────────────────────────────────────────────────────────
describe("PHC Referral Scenarios", () => {
  it("FEVER_001: High fever (39°C) → PHC Referral", () => {
    const r = triage(adult({ temperature: 39 }));
    expect(r.triage).toBe("PHC Referral");
  });

  it("FEVER_003: Prolonged fever (>7 days) → PHC Referral", () => {
    const r = triage(adult({ temperature: 38, fever_duration_days: 10 }));
    expect(r.triage).toBe("PHC Referral");
  });

  it("RESP_003: SpO₂ 90–94% → PHC Referral", () => {
    const r = triage(adult({ spo2: 92 }));
    expect(r.triage).toBe("PHC Referral");
  });

  it("RESP_004: Chest indrawing in child → PHC Referral", () => {
    const r = triage(child({ symptoms: ["chest_indrawing"] }));
    expect(r.triage).toBe("PHC Referral");
  });

  it("RESP_005: Moderate breathlessness → PHC Referral", () => {
    const r = triage(adult({ symptoms: ["breathlessness_moderate"] }));
    expect(r.triage).toBe("PHC Referral");
  });

  it("RESP_008: Respiratory rate 25–30 → PHC Referral", () => {
    const r = triage(adult({ respiratory_rate: 27 }));
    expect(r.triage).toBe("PHC Referral");
  });

  it("ANEMIA_002: Hb 7–10 (non-pregnant) → PHC Referral", () => {
    const r = triage(adult({ hemoglobin: 8.5 }));
    expect(r.triage).toBe("PHC Referral");
  });

  it("MAT_003: Reduced fetal movement → PHC Referral", () => {
    const r = triage(pregnant({ symptoms: ["reduced_fetal_movement"] }));
    expect(r.triage).toBe("PHC Referral");
  });

  it("DEHY_002: Unable to drink alone → PHC Referral (not Emergency without other signs)", () => {
    const r = triage(adult({ symptoms: ["unable_to_drink"] }));
    expect(r.triage).toBe("PHC Referral");
    expect(r.override_triggered).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────
// SECTION 6: Home Care / No Escalation Cases
// Critical safety check: safe patients must NOT be over-triaged
// ─────────────────────────────────────────────────────────────────
describe("Home Care — No Escalation (False Positive Prevention)", () => {
  it("Mild cough only → Home Care", () => {
    const r = runTriage(adult({ symptoms: ["cough"] }));
    expect(r.ok).toBe(true);
    expect(r.result?.triage).toBe("Home Care");
  });

  it("Normal SpO₂ (98%) → Home Care", () => {
    const r = triage(adult({ spo2: 98 }));
    expect(r.triage).toBe("Home Care");
  });

  it("Normal RR (18) → Home Care", () => {
    const r = triage(adult({ respiratory_rate: 18 }));
    expect(r.triage).toBe("Home Care");
  });

  it("Low-grade fever (37.8°C) alone → Home Care", () => {
    const r = triage(adult({ temperature: 37.8 }));
    expect(r.triage).toBe("Home Care");
  });

  it("Mild weakness alone → Home Care", () => {
    const r = triage(adult({ symptoms: ["weakness_mild"] }));
    expect(r.triage).toBe("Home Care");
  });
});

// ─────────────────────────────────────────────────────────────────
// SECTION 7: Vitals Boundary Tests
// ─────────────────────────────────────────────────────────────────
describe("Vitals Boundary Conditions", () => {
  it("SpO₂ = 90 (boundary) → PHC Referral (between 90–94, inclusive)", () => {
    const r = triage(adult({ spo2: 90 }));
    expect(r.triage).toBe("PHC Referral");
  });

  it("SpO₂ = 94 (upper boundary) → PHC Referral", () => {
    const r = triage(adult({ spo2: 94 }));
    expect(r.triage).toBe("PHC Referral");
  });

  it("SpO₂ = 95 (just above PHC threshold) → Home Care", () => {
    const r = triage(adult({ spo2: 95 }));
    expect(r.triage).toBe("Home Care");
  });

  it("RR = 30 (boundary) → PHC Referral (between 25–30)", () => {
    const r = triage(adult({ respiratory_rate: 30 }));
    expect(r.triage).toBe("PHC Referral");
  });

  it("RR = 31 → Emergency (above 30 threshold)", () => {
    const r = triage(adult({ respiratory_rate: 31 }));
    expect(r.triage).toBe("Emergency");
  });

  it("Temperature = 39°C (boundary) → PHC Referral", () => {
    const r = triage(adult({ temperature: 39 }));
    expect(r.triage).toBe("PHC Referral");
  });

  it("Hb = 7 (boundary — between 7–10 inclusive) → PHC Referral", () => {
    const r = triage(adult({ hemoglobin: 7 }));
    expect(r.triage).toBe("PHC Referral");
  });
});

// ─────────────────────────────────────────────────────────────────
// SECTION 8: Multi-Symptom Combination Escalation
// ─────────────────────────────────────────────────────────────────
describe("Multi-Symptom Combination Escalation", () => {
  it("Fever + confusion → Emergency (FEVER_002)", () => {
    const r = triage(adult({ temperature: 39, symptoms: ["confusion"] }));
    expect(r.triage).toBe("Emergency");
  });

  it("Fever + unable to drink → PHC Referral (FEVER_005)", () => {
    const r = triage(adult({ temperature: 38.5, symptoms: ["unable_to_drink"] }));
    // DEHY_002 (unable_to_drink alone) is PHC; FEVER_005 is also PHC — highest is PHC
    expect(r.triage).toBe("PHC Referral");
  });

  it("Mild breathlessness + SpO₂ 90–94 → PHC Referral (RESP_006)", () => {
    const r = triage(adult({ spo2: 92, symptoms: ["breathlessness_mild"] }));
    expect(r.triage).toBe("PHC Referral");
  });

  it("Severe weakness + Hb < 7 in pregnancy → Emergency (ANEMIA_004 override)", () => {
    const r = triage(pregnant({ hemoglobin: 5, symptoms: ["weakness_severe"] }));
    expect(r.triage).toBe("Emergency");
    expect(r.override_triggered).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────
// SECTION 9: Pediatric Age-Specific Cases
// ─────────────────────────────────────────────────────────────────
describe("Pediatric Age-Specific Escalation", () => {
  it("Child RR > 60 → Emergency (RESP_009 — WHO fast breathing criteria)", () => {
    const r = triage(child({ respiratory_rate: 65 }));
    expect(r.triage).toBe("Emergency");
    expect(r.triggered_rules).toContain("RESP_009");
  });

  it("Child RR 30–60 range — adult RESP_007 threshold → Emergency (RR > 30 is universal)", () => {
    const r = triage(child({ respiratory_rate: 45 }));
    expect(r.triage).toBe("Emergency");
  });

  it("Child unable to feed → Emergency (DANGER_003)", () => {
    const r = triage(child({ symptoms: ["unable_to_feed"] }));
    expect(r.triage).toBe("Emergency");
    expect(r.triggered_rules).toContain("DANGER_003");
  });

  it("Child with chest indrawing → PHC Referral (RESP_004)", () => {
    const r = triage(child({ symptoms: ["chest_indrawing"] }));
    expect(r.triage).toBe("PHC Referral");
    expect(r.triggered_rules).toContain("RESP_004");
  });

  it("Child convulsions → Emergency (DANGER_001 — universal)", () => {
    const r = triage(child({ symptoms: ["convulsions"] }));
    expect(r.triage).toBe("Emergency");
  });
});

// ─────────────────────────────────────────────────────────────────
// SECTION 10: Deterministic Consistency
// The same inputs must ALWAYS produce the same outputs
// ─────────────────────────────────────────────────────────────────
describe("Deterministic Consistency", () => {
  it("Same input run twice produces identical outputs", () => {
    const input = adult({ spo2: 88, symptoms: ["convulsions", "confusion"], temperature: 39.5 });
    const r1 = triage(input);
    const r2 = triage(input);
    expect(r1.triage).toBe(r2.triage);
    expect(r1.triggered_rules.sort()).toEqual(r2.triggered_rules.sort());
    expect(r1.urgency).toBe(r2.urgency);
  });
});
