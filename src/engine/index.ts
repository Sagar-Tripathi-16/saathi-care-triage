import { applicableCategories, detectCategory } from "./categorize";
import { highest, SEVERITY_LEVEL } from "./classifier";
import { ruleMatches } from "./evaluator";
import { buildExplanation } from "./explainability";
import { normalize } from "./normalization";
import { loadAllRules } from "./rules";
import type { PatientInput, Rule, Severity, TriageResult, ValidationIssue } from "./types";
import { validate } from "./validation";

export interface EngineOutput {
  ok: boolean;
  result?: TriageResult;
  validation_issues: ValidationIssue[];
}

export function runTriage(rawInput: PatientInput): EngineOutput {
  // 1. Validate
  const v = validate(rawInput);
  if (!v.canProceed) {
    return { ok: false, validation_issues: v.issues };
  }

  // 2. Normalize
  const input = normalize(rawInput);

  // 3. Categorize
  const category = detectCategory(input);
  const applicable = new Set(applicableCategories(category));

  // 4. Load + filter rules
  const all = loadAllRules();
  const candidates = all.filter((r) => r.patient_category.some((pc) => applicable.has(pc)));

  // 5. Sort by priority (1 = highest), then by severity level descending within same priority
  candidates.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return SEVERITY_LEVEL[b.severity] - SEVERITY_LEVEL[a.severity];
  });

  // 6. Override pass — find all matching override rules
  const overrides = candidates.filter((r) => r.rule_type === "override_rule");
  const triggeredOverrides: Rule[] = [];
  for (const r of overrides) {
    if (ruleMatches(r, input)) {
      triggeredOverrides.push(r);
    }
  }
  const overrideHit = triggeredOverrides.length > 0;

  // 7. Non-override pass — always collect ALL matching non-override rules.
  //    When an override has fired:
  //    - Overrides set the AUTHORITY severity (non-overrides cannot reduce it)
  //    - Non-overrides still contribute their reasoning and warning_signs for explainability
  //    This is the critical fix: previously, non-overrides were silently dropped when an
  //    override fired, causing the Intelligence Rail to miss key clinical drivers.
  const triggeredNonOverrides: Rule[] = [];
  for (const r of candidates) {
    if (r.rule_type === "override_rule") continue;
    if (ruleMatches(r, input)) triggeredNonOverrides.push(r);
  }

  // 8. Combine: overrides first (highest authority), then supporting non-overrides
  const triggered: Rule[] = [...triggeredOverrides, ...triggeredNonOverrides];

  // 9. Resolve severity
  //    If override(s) fired: severity is the highest override severity — non-overrides cannot lower it.
  //    If no override fired: severity is the highest among all matching non-override rules.
  let severity: Severity = "Home Care";
  if (overrideHit) {
    for (const r of triggeredOverrides) severity = highest(severity, r.severity);
  } else {
    for (const r of triggeredNonOverrides) severity = highest(severity, r.severity);
  }

  // 10. Pick urgency / action from the highest-severity triggered rule
  //     Prefer overrides if they match the final severity; otherwise fall through to non-overrides
  const top =
    triggeredOverrides.find((r) => r.severity === severity) ??
    triggeredNonOverrides.find((r) => r.severity === severity);
  const urgency = top?.urgency ?? "Routine";
  const recommended_action = top?.recommended_action ?? "Continuity monitoring advised. Reassess if new or worsening indicators emerge.";

  // 11. Build explainability from ALL triggered rules (overrides + non-overrides)
  //     Sorted: higher-severity rules surface their reasoning first
  const explain = buildExplanation(triggered);

  // 12. If no rules triggered (Home Care), build a baseline explanation
  if (triggered.length === 0) {
    explain.reasoning = ["No escalation indicators detected based on current clinical inputs."];
    explain.warning_signs = [
      "Initiate continuity monitoring. Reassess if fever rises, breathing worsens, or new danger signs appear.",
    ];
    explain.explanations = ["Low escalation probability. Patient appears stable. Routine continuity monitoring advised."];
  }

  const overrideMatches = triggeredOverrides;
  const result: TriageResult = {
    triage: severity,
    severity_level: SEVERITY_LEVEL[severity],
    patient_category: category,
    triggered_rules: triggered.map((r) => r.rule_id),
    reasoning: explain.reasoning,
    warning_signs: explain.warning_signs,
    explanations: explain.explanations,
    urgency,
    recommended_action,
    validation_issues: v.issues,
    ai_explanation_allowed: true,
    timestamp: Date.now(),
    override_triggered: overrideMatches.length > 0,
    override_rule_ids: overrideMatches.map((r) => r.rule_id),
  };

  return { ok: true, result, validation_issues: v.issues };
}

export type { TriageResult, PatientInput, ValidationIssue } from "./types";
