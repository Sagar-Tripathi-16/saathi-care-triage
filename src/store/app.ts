import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "@/i18n/dict";
import type { TriageResult, PatientInput } from "@/engine/types";

interface AppState {
  lang: Lang;
  setLang: (l: Lang) => void;
  lastResult: TriageResult | null;
  lastInput: PatientInput | null;
  setLast: (input: PatientInput, result: TriageResult) => void;
  clearLast: () => void;
  online: boolean;
  setOnline: (online: boolean) => void;
}

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      lang: "en",
      setLang: (lang) => set({ lang }),
      lastResult: null,
      lastInput: null,
      setLast: (lastInput, lastResult) => set({ lastInput, lastResult }),
      clearLast: () => set({ lastInput: null, lastResult: null }),
      online: typeof navigator === "undefined" ? true : navigator.onLine,
      setOnline: (online) => set({ online }),
    }),
    { name: "arogya-app", partialize: (s) => ({ lang: s.lang }) },
  ),
);
