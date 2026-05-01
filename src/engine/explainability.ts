import type { Rule, TriageResult } from "./types";

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function buildExplanation(triggered: Rule[]): Pick<TriageResult, "reasoning" | "warning_signs" | "explanations"> {
  const reasoning = uniq(triggered.flatMap((r) => r.reasoning ?? []));
  const warning_signs = uniq(triggered.flatMap((r) => r.warning_signs ?? []));
  const explanations = uniq(triggered.map((r) => r.explanation_template).filter(Boolean));
  return { reasoning, warning_signs, explanations };
}
