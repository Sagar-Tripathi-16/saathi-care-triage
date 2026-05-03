import type { AssessmentRecord } from "@/storage/db";

export interface ConditionStatus {
  trend: "improving" | "stable" | "worsening";
  label: "🟢 Improving" | "🟠 Stable" | "🔴 Worsening";
  reasons: string[];
}

export function compareAssessments(prev: AssessmentRecord, curr: AssessmentRecord): ConditionStatus {
  const reasons: string[] = [];
  
  let score = 0; // Positive = worsening, Negative = improving

  // 1. Severity level escalation
  const severityValue = (triage: string) => {
    if (triage === "Emergency") return 3;
    if (triage === "PHC Referral") return 2;
    return 1; // Home Care
  };

  const prevSev = severityValue(prev.result.triage);
  const currSev = severityValue(curr.result.triage);

  if (currSev > prevSev) {
    score += 3;
    reasons.push(`Severity escalated from ${prev.result.triage} to ${curr.result.triage}`);
  } else if (currSev < prevSev) {
    score -= 3;
    reasons.push(`Severity improved from ${prev.result.triage} to ${curr.result.triage}`);
  }

  // 2. Emergency Override
  if (curr.result.override_triggered && !prev.result.override_triggered) {
    score += 3;
    reasons.push("New emergency override condition triggered");
  }

  // 3. SpO2 changes
  const prevSpo2 = prev.input.spo2;
  const currSpo2 = curr.input.spo2;
  if (prevSpo2 !== undefined && currSpo2 !== undefined) {
    if (currSpo2 <= prevSpo2 - 3) {
      score += 3;
      reasons.push(`Oxygen saturation decreased significantly from ${prevSpo2}% to ${currSpo2}%`);
    } else if (currSpo2 <= prevSpo2 - 1) {
      score += 1;
      reasons.push(`Oxygen saturation decreased slightly from ${prevSpo2}% to ${currSpo2}%`);
    } else if (currSpo2 >= prevSpo2 + 3) {
      score -= 3;
      reasons.push(`Oxygen saturation improved significantly from ${prevSpo2}% to ${currSpo2}%`);
    } else if (currSpo2 >= prevSpo2 + 1) {
      score -= 1;
      reasons.push(`Oxygen saturation improved slightly from ${prevSpo2}% to ${currSpo2}%`);
    }
  }

  // 4. Temperature changes
  const prevTemp = prev.input.temperature;
  const currTemp = curr.input.temperature;
  if (prevTemp !== undefined && currTemp !== undefined) {
    if (currTemp >= prevTemp + 1) { // Rising fever
      score += 1;
      reasons.push(`Temperature increased from ${prevTemp} to ${currTemp}`);
    } else if (currTemp <= prevTemp - 1) { // Reduced fever
      score -= 1;
      reasons.push(`Temperature decreased from ${prevTemp} to ${currTemp}`);
    }
  }

  // 5. Danger signs / Warning signs
  const prevWarnings = prev.result.warning_signs || [];
  const currWarnings = curr.result.warning_signs || [];
  const newWarnings = currWarnings.filter(w => !prevWarnings.includes(w));
  const resolvedWarnings = prevWarnings.filter(w => !currWarnings.includes(w));
  
  if (newWarnings.length > 0) {
    // If accompanied by severity escalation, severity already added +3.
    // Isolated new warnings get +1.
    if (currSev <= prevSev) {
      score += 1;
    }
    reasons.push(`New warning signs detected: ${newWarnings.join(", ")}`);
  }
  
  if (resolvedWarnings.length > 0) {
    if (currSev >= prevSev) {
      score -= 1;
    }
    reasons.push(`Previous warning signs resolved (${resolvedWarnings.length})`);
  }

  // Evaluate final status based on score
  if (score >= 2) {
    return { trend: "worsening", label: "🔴 Worsening", reasons };
  }
  
  if (score <= -2) {
    return { trend: "improving", label: "🟢 Improving", reasons };
  }

  // Between -1 and 1
  // Append a balancing reason if there were mixed signals
  if (reasons.length > 0 && score > 0 && currSev !== 3) {
    reasons.push("Minor negative changes do not indicate overall worsening");
  } else if (reasons.length > 0 && score < 0) {
    reasons.push("Minor positive changes do not indicate overall improvement");
  } else if (reasons.length === 0) {
    reasons.push("No significant changes in vitals or severity");
  }

  return { trend: "stable", label: "🟠 Stable", reasons };
}
