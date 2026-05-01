import { openDB, type IDBPDatabase } from "idb";
import type { PatientInput, TriageResult } from "@/engine/types";
import type { Lang } from "@/i18n/dict";

export interface SimplifiedAI {
  headline: string;
  why: string[];
  warning_signs: string[];
  recommended_action: string;
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
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (typeof window === "undefined") return null;
  if (!dbPromise) {
    dbPromise = openDB("arogya-saathi", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("assessments")) {
          const store = db.createObjectStore("assessments", { keyPath: "id", autoIncrement: true });
          store.createIndex("created_at", "created_at");
          store.createIndex("severity", "severity");
        }
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
    return all.reverse() as AssessmentRecord[];
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

export async function clearAssessments(): Promise<void> {
  try {
    const db = await getDB();
    if (!db) return;
    await db.clear("assessments");
  } catch (e) {
    console.error("clearAssessments failed", e);
  }
}
