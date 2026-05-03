import type { Rule, TriageResult } from "./types";
import { SEVERITY_LEVEL } from "./classifier";

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function buildExplanation(triggered: Rule[]): Pick<TriageResult, "reasoning" | "warning_signs" | "explanations"> {
  // Sort triggered rules by severity level descending so the most critical drivers
  // surface first in reasoning and warning_signs — this is the clinical priority guarantee.
  // The Intelligence Rail will always show the real reason for escalation at the top.
  const sorted = [...triggered].sort(
    (a, b) => SEVERITY_LEVEL[b.severity] - SEVERITY_LEVEL[a.severity]
  );

  const reasoning = uniq(sorted.flatMap((r) => r.reasoning ?? []));
  const warning_signs = uniq(sorted.flatMap((r) => r.warning_signs ?? []));
  const explanations = uniq(sorted.map((r) => r.explanation_template).filter(Boolean));
  return { reasoning, warning_signs, explanations };
}
