import type { Condition, PatientInput, Rule } from "./types";

function evalCondition(c: Condition, input: PatientInput): boolean {
  const v = (input as Record<string, unknown>)[c.field];
  if (v === undefined || v === null) return false;
  switch (c.operator) {
    case "==":
      return v === c.value;
    case "!=":
      return v !== c.value;
    case "<":
      return typeof v === "number" && typeof c.value === "number" && v < c.value;
    case ">":
      return typeof v === "number" && typeof c.value === "number" && v > c.value;
    case "<=":
      return typeof v === "number" && typeof c.value === "number" && v <= c.value;
    case ">=":
      return typeof v === "number" && typeof c.value === "number" && v >= c.value;
    case "between": {
      if (typeof v !== "number" || !Array.isArray(c.value) || c.value.length !== 2) return false;
      const [lo, hi] = c.value as [number, number];
      return v >= lo && v <= hi;
    }
    case "in":
      return Array.isArray(c.value) && (c.value as unknown[]).includes(v);
    default:
      return false;
  }
}

export function ruleMatches(rule: Rule, input: PatientInput): boolean {
  const results = rule.conditions.map((c) => evalCondition(c, input));
  switch (rule.trigger_logic) {
    case "ALL":
      return results.every(Boolean);
    case "ANY":
      return results.some(Boolean);
    case "MINIMUM_MATCH": {
      const need = rule.minimum_conditions_required ?? rule.conditions.length;
      return results.filter(Boolean).length >= need;
    }
    default:
      return false;
  }
}
