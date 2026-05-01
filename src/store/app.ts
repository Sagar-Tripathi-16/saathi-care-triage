import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "@/i18n/dict";
import type { TriageResult, PatientInput, Severity } from "@/engine/types";

interface QueueFilters {
  severities: Severity[]; // empty = all
  pendingFollowUpOnly: boolean;
  highRiskOnly: boolean;
}

interface AppState {
  lang: Lang;
  setLang: (l: Lang) => void;
  lastResult: TriageResult | null;
  lastInput: PatientInput | null;
  lastRecordId: number | null;
  setLast: (input: PatientInput, result: TriageResult, recordId?: number | null) => void;
  clearLast: () => void;
  online: boolean;
  setOnline: (online: boolean) => void;
  // Pre-link a new assessment to a previous one (for revisits)
  pendingPreviousId: number | null;
  setPendingPreviousId: (id: number | null) => void;
  // Queue filters (session-scoped)
  queueFilters: QueueFilters;
  setQueueFilters: (f: Partial<QueueFilters>) => void;
}

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      lang: "en",
      setLang: (lang) => set({ lang }),
      lastResult: null,
      lastInput: null,
      lastRecordId: null,
      setLast: (lastInput, lastResult, recordId = null) =>
        set({ lastInput, lastResult, lastRecordId: recordId }),
      clearLast: () => set({ lastInput: null, lastResult: null, lastRecordId: null }),
      online: typeof navigator === "undefined" ? true : navigator.onLine,
      setOnline: (online) => set({ online }),
      pendingPreviousId: null,
      setPendingPreviousId: (pendingPreviousId) => set({ pendingPreviousId }),
      queueFilters: { severities: [], pendingFollowUpOnly: false, highRiskOnly: false },
      setQueueFilters: (f) =>
        set((s) => ({ queueFilters: { ...s.queueFilters, ...f } })),
    }),
    { name: "arogya-app", partialize: (s) => ({ lang: s.lang }) },
  ),
);
