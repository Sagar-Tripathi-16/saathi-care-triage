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

  // 5. Sort by priority (1 = highest)
  candidates.sort((a, b) => a.priority - b.priority);

  // 6. Override pass
  const overrides = candidates.filter((r) => r.rule_type === "override_rule");
  const triggered: Rule[] = [];
  let overrideHit = false;
  for (const r of overrides) {
    if (ruleMatches(r, input)) {
      triggered.push(r);
      overrideHit = true;
    }
  }

  // 7. If override hit Emergency, we still gather other override matches but skip non-overrides (per spec: stop lower-priority)
  if (!overrideHit) {
    for (const r of candidates) {
      if (r.rule_type === "override_rule") continue;
      if (ruleMatches(r, input)) triggered.push(r);
    }
  }

  // 8. Resolve severity
  let severity: Severity = "Home Care";
  for (const r of triggered) severity = highest(severity, r.severity);

  // 9. Pick best urgency / action from highest-severity rule (first one with that severity)
  const top = triggered.find((r) => r.severity === severity);
  const urgency = top?.urgency ?? "Routine";
  const recommended_action = top?.recommended_action ?? "Monitor at home and re-assess if symptoms change.";

  // 10. Explainability
  const explain = buildExplanation(triggered);

  // 11. If no rules triggered (Home Care), still build a baseline explanation
  if (triggered.length === 0) {
    explain.reasoning = ["No danger signs detected based on the information provided."];
    explain.warning_signs = [
      "Re-assess if symptoms worsen, fever rises, breathing becomes difficult, or new danger signs appear.",
    ];
    explain.explanations = ["Patient appears stable based on current inputs. Continue routine home care."];
  }

  const overrideMatches = triggered.filter((r) => r.rule_type === "override_rule");
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
