import { openDB, type IDBPDatabase } from "idb";
import type { PatientInput, TriageResult } from "@/engine/types";
import type { Lang } from "@/i18n/dict";

export interface SimplifiedAI {
  headline: string;
  why: string[];
  warning_signs: string[];
  recommended_action: string;
}

export interface FollowUpPlan {
  due_date: number;
  notes: string;
  revisit_reason: string;
  created_at: number;
}

export interface HighRiskPregnancyFlag {
  flagged: boolean;
  reasons: string[]; // i18n keys
}

export interface AssessmentRecord {
  id?: number;
  patient_name: string;
  age?: number;
  pregnant: boolean;
  category: string;
  severity: string;
  urgency: string;
  triggered_rules: string[];
  input: PatientInput;
  result: TriageResult;
  created_at: number;
  ai_simplified?: { lang: Lang; payload: SimplifiedAI };
  follow_up?: FollowUpPlan;
  follow_up_completed_at?: number;
  previous_assessment_id?: number;
  high_risk_pregnancy?: HighRiskPregnancyFlag;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (typeof window === "undefined") return null;
  if (!dbPromise) {
    dbPromise = openDB("arogya-saathi", 2, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("assessments")) {
          const store = db.createObjectStore("assessments", { keyPath: "id", autoIncrement: true });
          store.createIndex("created_at", "created_at");
          store.createIndex("severity", "severity");
        }
        // v2: additive optional fields only — no schema migration required.
      },
    });
  }
  return dbPromise;
}

export async function saveAssessment(rec: Omit<AssessmentRecord, "id">): Promise<number | null> {
  try {
    const db = await getDB();
    if (!db) return null;
    const id = await db.add("assessments", rec);
    return id as number;
  } catch (e) {
    console.error("saveAssessment failed", e);
    return null;
  }
}

export async function listAssessments(): Promise<AssessmentRecord[]> {
  try {
    const db = await getDB();
    if (!db) return [];
    const all = await db.getAllFromIndex("assessments", "created_at");
    return (all as AssessmentRecord[]).reverse();
  } catch (e) {
    console.error("listAssessments failed", e);
    return [];
  }
}

export async function getAssessment(id: number): Promise<AssessmentRecord | null> {
  try {
    const db = await getDB();
    if (!db) return null;
    return ((await db.get("assessments", id)) as AssessmentRecord) ?? null;
  } catch {
    return null;
  }
}

export async function updateAssessment(id: number, patch: Partial<AssessmentRecord>): Promise<void> {
  try {
    const db = await getDB();
    if (!db) return;
    const existing = (await db.get("assessments", id)) as AssessmentRecord | undefined;
    if (!existing) return;
    await db.put("assessments", { ...existing, ...patch, id });
  } catch (e) {
    console.error("updateAssessment failed", e);
  }
}

export async function setFollowUp(id: number, plan: FollowUpPlan): Promise<void> {
  await updateAssessment(id, { follow_up: plan, follow_up_completed_at: undefined });
}

export async function clearFollowUp(id: number): Promise<void> {
  try {
    const db = await getDB();
    if (!db) return;
    const existing = (await db.get("assessments", id)) as AssessmentRecord | undefined;
    if (!existing) return;
    const next: AssessmentRecord = { ...existing };
    delete next.follow_up;
    delete next.follow_up_completed_at;
    await db.put("assessments", next);
  } catch (e) {
    console.error("clearFollowUp failed", e);
  }
}

export async function markFollowUpComplete(id: number, when: number = Date.now()): Promise<void> {
  await updateAssessment(id, { follow_up_completed_at: when });
}

export async function linkRevisit(prevId: number, newId: number): Promise<void> {
  await markFollowUpComplete(prevId);
  await updateAssessment(newId, { previous_assessment_id: prevId });
}

export async function clearAssessments(): Promise<void> {
  try {
    const db = await getDB();
    if (!db) return;
    await db.clear("assessments");
  } catch (e) {
    console.error("clearAssessments failed", e);
  }
}

/**
 * Best-effort patient match for trend lookup.
 * Matches by case-insensitive name (when present) and ±1 year age tolerance.
 * Returns assessments older than `before` (exclusive), newest first.
 */
export function matchPatientHistory(
  all: AssessmentRecord[],
  patient_name: string | undefined,
  age: number | undefined,
  before: number,
): AssessmentRecord[] {
  const name = (patient_name ?? "").trim().toLowerCase();
  if (!name || name === "—") return [];
  return all
    .filter((r) => r.created_at < before)
    .filter((r) => (r.patient_name ?? "").trim().toLowerCase() === name)
    .filter((r) => {
      if (typeof age !== "number" || typeof r.age !== "number") return true;
      return Math.abs(r.age - age) <= 1;
    });
}
