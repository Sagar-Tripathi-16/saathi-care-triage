export type Severity = "Emergency" | "PHC Referral" | "Home Care";
export type PatientCategory = "pediatric" | "adult" | "maternal" | "universal";
export type RuleType = "single_condition" | "combination_rule" | "multi_condition" | "override_rule";
export type TriggerLogic = "ALL" | "ANY" | "MINIMUM_MATCH";
export type Operator = "==" | "!=" | "<" | ">" | "<=" | ">=" | "between" | "in";

export interface Condition {
  field: string;
  operator: Operator;
  value: unknown;
}

export interface Rule {
  rule_id: string;
  module: string;
  priority: number;
  severity: Severity;
  rule_type: RuleType;
  patient_category: PatientCategory[];
  conditions: Condition[];
  trigger_logic: TriggerLogic;
  minimum_conditions_required?: number;
  urgency: string;
  recommended_action: string;
  reasoning: string[];
  warning_signs: string[];
  explanation_template: string;
}

export interface PatientInput {
  // basics
  age?: number;
  sex?: "male" | "female" | "other";
  pregnant?: boolean;
  pregnancy_weeks?: number;
  // vitals
  temperature?: number;
  spo2?: number;
  hemoglobin?: number;
  respiratory_rate?: number;
  fever_duration_days?: number;
  // symptom flags (booleans)
  symptoms?: string[]; // free-form symptom labels
  // patient ref
  patient_name?: string;
  // allow arbitrary boolean symptom fields
  [key: string]: unknown;
}

export interface ValidationIssue {
  field?: string;
  level: "error" | "warning";
  message: string;
}

export interface TriageResult {
  triage: Severity;
  severity_level: number; // 3 Emergency, 2 PHC, 1 Home
  patient_category: PatientCategory;
  triggered_rules: string[];
  reasoning: string[];
  warning_signs: string[];
  urgency: string;
  recommended_action: string;
  explanations: string[]; // explanation_template per rule
  validation_issues: ValidationIssue[];
  ai_explanation_allowed: boolean;
  timestamp: number;
}
