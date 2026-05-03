import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/store/app";
import { t } from "@/i18n/dict";
import { runTriage } from "@/engine";
import type { PatientInput } from "@/engine/types";
import { saveAssessment, listAssessments, matchPatientHistory, linkRevisit, getAssessment } from "@/storage/db";
import { computeHighRiskPregnancy } from "@/engine/maternalRisk";
import { 
  AlertTriangle, ChevronDown, ChevronUp, ShieldAlert, Activity, Baby, 
  Stethoscope, ShieldCheck, User, PersonStanding, Thermometer, Wind, AlertCircle, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "New Assessment — Arogya Saathi" },
      { name: "description", content: "Run an offline household triage assessment for a patient." },
    ],
  }),
  component: IndexPage,
});

// Severity options for graded symptoms
interface SeverityOption {
  value: string;
  label_en: string;
  label_hi: string;
  label_kn: string;
}

interface SymptomDef {
  key: string;
  label_en: string;
  label_hi: string;
  label_kn: string;
  group: "danger" | "breathing" | "fever" | "maternal" | "adult" | "pediatric";
  category?: "pediatric" | "maternal" | "adult" | "all";
  severities?: SeverityOption[];
}

const SYMPTOMS: SymptomDef[] = [
  // --- DANGER (direct / critical) ---
  { key: "convulsions", label_en: "Convulsions", label_hi: "दौरे", label_kn: "ಜರ್ಕಗಳು", group: "danger" },
  { key: "unconscious", label_en: "Unconscious", label_hi: "बेहोश", label_kn: "ಪ್ರಜ್ಞಾಹೀನ", group: "danger" },
  // --- BREATHING ---
  {
    key: "breathlessness",
    label_en: "Breathlessness", label_hi: "सांस की तकलीफ", label_kn: "ಉಸಿರಾಟದ ತೊಂದರೆ",
    group: "breathing",
    severities: [
      { value: "breathlessness_mild",     label_en: "Mild",     label_hi: "हल्की",   label_kn: "ಸಣ್ಣ" },
      { value: "breathlessness_moderate", label_en: "Moderate", label_hi: "मध्यम",  label_kn: "ಮಧ್ಯಮ" },
      { value: "breathlessness_severe",   label_en: "Severe",   label_hi: "गंभीर",  label_kn: "ತೀವ್ರ" },
    ],
  },
  { key: "chest_indrawing", label_en: "Chest indrawing", label_hi: "छाती धंसना", label_kn: "ಎದೆ ಒಳಗೆಳೆಯುವಿಕೆ", group: "breathing", category: "pediatric" },
  { key: "fast_breathing",  label_en: "Fast breathing",  label_hi: "तेज़ श्वास",  label_kn: "ವೇಗದ ಉಸಿರಾಟ",       group: "breathing", category: "pediatric" },
  // --- FEVER / DEHYDRATION ---
  {
    key: "headache",
    label_en: "Headache", label_hi: "सिरदर्द", label_kn: "ತಲೆನೋವು",
    group: "fever",
    severities: [
      { value: "headache_mild",       label_en: "Mild",       label_hi: "हल्का",     label_kn: "ಸಣ್ಣ" },
      { value: "headache_persistent", label_en: "Persistent", label_hi: "लगातार",   label_kn: "ನಿರಂತರ" },
      { value: "headache_severe",     label_en: "Severe",     label_hi: "गंभीर",    label_kn: "ತೀವ್ರ" },
    ],
  },
  {
    key: "weakness",
    label_en: "Weakness", label_hi: "कमज़ोरी", label_kn: "ದೌರ್ಬಲ್ಯ",
    group: "fever",
    severities: [
      { value: "weakness_mild",     label_en: "Mild",     label_hi: "हल्की",  label_kn: "ಸಣ್ಣ" },
      { value: "weakness_moderate", label_en: "Moderate", label_hi: "मध्यम", label_kn: "ಮಧ್ಯಮ" },
      { value: "weakness_severe",   label_en: "Severe",   label_hi: "गंभीर", label_kn: "ತೀವ್ರ" },
    ],
  },
  { key: "confusion",         label_en: "Confusion",         label_hi: "भ्रम",           label_kn: "ಗೊಂದಲ",          group: "fever" },
  { key: "unable_to_drink",   label_en: "Unable to drink",   label_hi: "पी नहीं सकते",  label_kn: "ಕುಡಿಯಲು ಆಗದು",  group: "fever" },
  { key: "vomiting_everything",label_en: "Vomiting everything",label_hi: "सब उल्टी",    label_kn: "ಎಲ್ಲವೂ ವಾಂತಿ",  group: "fever" },
  // --- MATERNAL ---
  { key: "heavy_bleeding",         label_en: "Heavy bleeding",          label_hi: "भारी रक्तस्राव",   label_kn: "ಭಾರೀ ರಕ್ತಸ್ರಾವ",      group: "maternal", category: "maternal" },
  { key: "fetal_movement_stopped", label_en: "Fetal movement stopped",  label_hi: "गर्भ हलचल बंद",  label_kn: "ಗರ್ಭದ ಚಲನೆ ನಿಂತಿದೆ", group: "maternal", category: "maternal" },
  { key: "reduced_fetal_movement", label_en: "Reduced fetal movement",  label_hi: "गर्भ हलचल कम",  label_kn: "ಕಡಿಮೆ ಗರ್ಭ ಚಲನೆ",    group: "maternal", category: "maternal" },
  { key: "blurred_vision",         label_en: "Blurred vision",          label_hi: "धुंधली दृष्टि",  label_kn: "ಮಸುಕು ದೃಷ್ಟಿ",       group: "maternal", category: "maternal" },
  // --- ADULT (direct / critical) ---
  { key: "severe_chest_pain", label_en: "Severe chest pain", label_hi: "गंभीर सीने में दर्द", label_kn: "ತೀವ್ರ ಎದೆ ನೋವು", group: "adult", category: "adult" },
  { key: "fainting",          label_en: "Fainting",          label_hi: "बेहोशी",                label_kn: "ಮೂರ್ಛೆ",          group: "adult", category: "adult" },
  // --- PEDIATRIC (direct / critical) ---
  { key: "unable_to_feed", label_en: "Unable to feed (child)", label_hi: "नहीं खा सकते (बच्चा)", label_kn: "ಆಹಾರ ತೆಗೆದುಕೊಳ್ಳಲಾಗದು", group: "pediatric", category: "pediatric" },
];

function symptomLabel(s: SymptomDef | SeverityOption, lang: string) {
  return lang === "hi" ? s.label_hi : lang === "kn" ? s.label_kn : s.label_en;
}

function buildSymptomsArray(sel: Map<string, string | true>): string[] {
  const arr: string[] = [];
  for (const [key, val] of sel) {
    if (val === true) arr.push(key);
    else arr.push(val as string);
  }
  return arr;
}

const MATERNAL_SYMPTOM_KEYS = new Set(
  SYMPTOMS.filter((s) => s.category === "maternal").map((s) => s.key)
);

type LiveIntelligencePortalProps = { liveResult: ReturnType<typeof import("@/engine").runTriage> | null };

function LiveIntelligencePortal({ liveResult }: LiveIntelligencePortalProps) {
  const [contextMsg, setContextMsg] = useState<string | null>(null);
  const prevTriage = useState<string | null>(null);

  // Contextual update when severity changes
  useEffect(() => {
    if (!liveResult?.ok || !liveResult.result) return;
    const triage = liveResult.result.triage;
    const prev = prevTriage[0];
    if (prev && prev !== triage) {
      const msg =
        triage === "Emergency" ? "Escalation probability increasing" :
        triage === "PHC Referral" ? "Referral indicators detected" :
        "Continuity monitoring advised";
      setContextMsg(msg);
      const t = setTimeout(() => setContextMsg(null), 3000);
      return () => clearTimeout(t);
    }
    // Update ref
    (prevTriage as any)[1](triage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveResult?.result?.triage]);

  if (!liveResult?.ok || !liveResult.result) return null;

  const result = liveResult.result;

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key="live-rail"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative p-6 flex flex-col h-full overflow-y-auto"
      >
        {/* Very subtle tonal aura */}
        <motion.div
          className="absolute inset-0 pointer-events-none z-[-1] rounded-r-none"
          animate={{
            opacity: [0.03, 0.08, 0.03],
            backgroundColor:
              result.triage === "Emergency" ? "#FEF2F2" :
              result.triage === "PHC Referral" ? "#FEFCE8" :
              "#ECFDF5",
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />

        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-5 flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0F8B8D] opacity-40"></span>
            <span className="relative inline-flex rounded-full size-2 bg-[#0F8B8D]/80"></span>
          </span>
          Live Intelligence
        </h3>

        <AnimatePresence mode="wait">
          {contextMsg ? (
            <motion.div
              key="context"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mb-5 px-4 py-3 rounded-[16px] bg-[#FEF9EC] border border-amber-200/70 flex items-center gap-2.5"
            >
              <span className="size-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
              <span className="text-xs font-bold text-amber-800">{contextMsg}</span>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="space-y-6">
          {/* Severity Card */}
          <motion.div
            key={result.triage}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={`p-5 rounded-[22px] border shadow-[0_4px_12px_rgba(15,23,42,0.02)] ${
              result.triage === "Emergency" ? "bg-[#FEE2E2] border-[#FECACA] text-[#991B1B]" :
              result.triage === "PHC Referral" ? "bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]" :
              "bg-[#DDF8EE] border-[#BBF7D0] text-[#065F46]"
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.1em] mb-1.5 opacity-70">Current Severity</div>
            <div className="text-xl font-black tracking-tight leading-none mb-1.5">{result.triage}</div>
            <div className="text-xs font-semibold opacity-80">{result.urgency}</div>
          </motion.div>

          {/* Active Concerns */}
          {result.reasoning.length > 0 && (
            <div className="space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Active Concerns</div>
              {result.reasoning.map((reason, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06, duration: 0.3, ease: "easeOut" }}
                  className="p-3.5 bg-white border border-slate-200/70 rounded-[14px] shadow-[0_2px_8px_rgba(15,23,42,0.03)]"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className={`size-4 shrink-0 mt-0.5 ${result.triage === "Emergency" ? "text-red-400" : "text-amber-400"}`} />
                    <div className="text-xs font-semibold text-[#1E293B] leading-relaxed">{reason}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Operational Insights */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Operational Insights</div>
            <div className="p-3.5 bg-[#F8FAFC] border border-slate-200/60 rounded-[14px] shadow-[0_2px_8px_rgba(15,23,42,0.02)]">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="size-4 shrink-0 mt-0.5 text-[#0F8B8D]" />
                <div className="text-xs font-semibold text-slate-600 leading-relaxed">
                  {result.triage === "Emergency"
                    ? "High escalation probability detected. Immediate action required."
                    : result.triage === "PHC Referral"
                    ? "Continuity follow-up recommended post-referral."
                    : "Low escalation probability. Routine continuity monitoring advised."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function IndexPage() {
  const lang = useApp((s) => s.lang);
  const setLast = useApp((s) => s.setLast);
  const pendingPreviousId = useApp((s) => s.pendingPreviousId);
  const setPendingPreviousId = useApp((s) => s.setPendingPreviousId);
  const navigate = useNavigate();

  // Progressive Assessment State
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [patientCategory, setPatientCategory] = useState<"child" | "pregnant" | "adult" | "elderly" | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [age, setAge] = useState<string>("");
  const [sex, setSex] = useState<"male" | "female" | "other">("female");
  const [pregnant, setPregnant] = useState(false);
  const [weeks, setWeeks] = useState("");
  const [temp, setTemp] = useState("");
  const [spo2, setSpo2] = useState("");
  const [hb, setHb] = useState("");
  const [rr, setRr] = useState("");
  const [feverDays, setFeverDays] = useState("");
  const [selected, setSelected] = useState<Map<string, string | true>>(new Map());
  const [expandedSymptom, setExpandedSymptom] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showAllVitals, setShowAllVitals] = useState(false);

  const [railTarget, setRailTarget] = useState<HTMLElement | null>(null);
  const [draftPrompt, setDraftPrompt] = useState(false);

  useEffect(() => {
    setRailTarget(document.getElementById("intelligence-rail-target"));
  }, []);

  // Draft recovery check on mount
  useEffect(() => {
    if (pendingPreviousId != null) return;
    const saved = sessionStorage.getItem("arogya_draft");
    if (saved) {
      setDraftPrompt(true);
    }
  }, [pendingPreviousId]);

  function restoreDraft() {
    try {
      const data = JSON.parse(sessionStorage.getItem("arogya_draft") || "{}");
      if (data.name) setName(data.name);
      if (data.age) setAge(data.age);
      if (data.sex) setSex(data.sex);
      if (data.pregnant) setPregnant(data.pregnant);
      if (data.weeks) setWeeks(data.weeks);
      if (data.temp) setTemp(data.temp);
      if (data.spo2) setSpo2(data.spo2);
      if (data.hb) setHb(data.hb);
      if (data.rr) setRr(data.rr);
      if (data.feverDays) setFeverDays(data.feverDays);
      if (data.selected) setSelected(new Map(data.selected));
      if (data.stage) setStage(data.stage);
    } catch {}
    setDraftPrompt(false);
  }

  function discardDraft() {
    sessionStorage.removeItem("arogya_draft");
    setDraftPrompt(false);
  }

  // Pre-fill on revisit
  useEffect(() => {
    if (pendingPreviousId == null) return;
    let cancelled = false;
    (async () => {
      const prev = await getAssessment(pendingPreviousId);
      if (cancelled || !prev) return;
      if (prev.input.patient_name) setName(prev.input.patient_name);
      if (prev.age != null) {
        setAge(String(prev.age));
        if (prev.age < 18) setPatientCategory("child");
        else if (prev.age >= 65) setPatientCategory("elderly");
        else setPatientCategory("adult");
      }
      if (prev.input.sex) setSex(prev.input.sex as "male" | "female" | "other");
      if (prev.pregnant) {
        setPregnant(true);
        setPatientCategory("pregnant");
        if (prev.input.pregnancy_weeks != null) setWeeks(String(prev.input.pregnancy_weeks));
      }
    })();
    return () => { cancelled = true; };
  }, [pendingPreviousId]);

  // Clean maternal symptoms if pregnancy is unchecked
  useEffect(() => {
    if (pregnant) return;
    setSelected((prev) => {
      let changed = false;
      const next = new Map(prev);
      for (const key of MATERNAL_SYMPTOM_KEYS) {
        if (next.has(key)) { next.delete(key); changed = true; }
      }
      return changed ? next : prev;
    });
    setExpandedSymptom((cur) =>
      cur && MATERNAL_SYMPTOM_KEYS.has(cur) ? null : cur
    );
  }, [pregnant]);

  const ageNum = parseFloat(age);
  const isPed = !pregnant && !Number.isNaN(ageNum) && ageNum < 18;
  const isMat = pregnant;

  const groups = useMemo(() => {
    const all: Record<string, SymptomDef[]> = {
      danger: [], breathing: [], fever: [], maternal: [], adult: [], pediatric: [],
    };
    for (const s of SYMPTOMS) {
      if (s.category === "maternal" && !isMat) continue;
      if (s.category === "pediatric" && !isPed) continue;
      if (s.category === "adult" && isPed) continue;
      all[s.group].push(s);
    }
    return all;
  }, [isMat, isPed]);

  function handleCategorySelect(cat: "child" | "pregnant" | "adult" | "elderly") {
    setPatientCategory(cat);
    if (cat === "child") {
      setPregnant(false);
      setSex("other"); // Neutral default
      if (age === "" || parseFloat(age) >= 18) setAge("");
    } else if (cat === "pregnant") {
      setPregnant(true);
      setSex("female");
      if (age === "" || parseFloat(age) < 10 || parseFloat(age) > 60) setAge("25");
    } else if (cat === "adult") {
      setPregnant(false);
      if (age === "" || parseFloat(age) < 18 || parseFloat(age) >= 65) setAge("30");
    } else if (cat === "elderly") {
      setPregnant(false);
      if (age === "" || parseFloat(age) < 65) setAge("70");
    }
  }

  function toggleDirect(key: string) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(key)) next.delete(key);
      else next.set(key, true);
      return next;
    });
  }

  function selectGradedSeverity(baseKey: string, severityValue: string) {
    setSelected((prev) => {
      const next = new Map(prev);
      next.set(baseKey, severityValue);
      return next;
    });
    setExpandedSymptom(null);
  }

  function toggleGraded(key: string) {
    if (selected.has(key)) {
      setExpandedSymptom((cur) => (cur === key ? null : key));
    } else {
      setExpandedSymptom(key);
    }
  }

  function clearSymptom(key: string) {
    setSelected((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
    setExpandedSymptom((cur) => (cur === key ? null : cur));
  }

  // --- Live Intelligence Calculation ---
  const liveInput = useMemo((): PatientInput => {
    return {
      patient_name: name.trim() || "Patient",
      age: isNaN(ageNum) ? (patientCategory === "child" ? 5 : patientCategory === "elderly" ? 70 : 30) : ageNum,
      sex: sex,
      pregnant: pregnant,
      pregnancy_weeks: pregnant && weeks !== "" ? parseFloat(weeks) : undefined,
      temperature: temp === "" ? undefined : parseFloat(temp),
      spo2: spo2 === "" ? undefined : parseFloat(spo2),
      hemoglobin: hb === "" ? undefined : parseFloat(hb),
      respiratory_rate: rr === "" ? undefined : parseFloat(rr),
      fever_duration_days: feverDays === "" ? undefined : parseFloat(feverDays),
      symptoms: buildSymptomsArray(selected),
    };
  }, [name, ageNum, patientCategory, sex, pregnant, weeks, temp, spo2, hb, rr, feverDays, selected]);

  const liveResult = useMemo(() => {
    try { return runTriage(liveInput); } catch { return null; }
  }, [liveInput]);

  // Save draft on change
  useEffect(() => {
    if (liveInput.patient_name || selected.size > 0) {
      sessionStorage.setItem("arogya_draft", JSON.stringify({
        name, age, sex, pregnant, weeks, temp, spo2, hb, rr, feverDays, 
        selected: Array.from(selected.entries()), stage
      }));
    }
  }, [liveInput, name, age, sex, pregnant, weeks, temp, spo2, hb, rr, feverDays, selected, stage]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors([]);

    const out = runTriage(liveInput);
    if (!out.ok || !out.result) {
      setErrors(out.validation_issues.filter((i) => i.level === "error").map((i) => i.message));
      setSubmitting(false);
      return;
    }

    let highRisk;
    try {
      const all = await listAssessments();
      const prior = matchPatientHistory(all, liveInput.patient_name, liveInput.age, Date.now());
      highRisk = computeHighRiskPregnancy(liveInput, out.result, prior);
    } catch {
      highRisk = computeHighRiskPregnancy(liveInput, out.result, []);
    }

    const newId = await saveAssessment({
      patient_name: liveInput.patient_name || "—",
      age: liveInput.age,
      pregnant,
      category: out.result.patient_category,
      severity: out.result.triage,
      urgency: out.result.urgency,
      triggered_rules: out.result.triggered_rules,
      input: liveInput,
      result: out.result,
      created_at: Date.now(),
      high_risk_pregnancy: highRisk,
      previous_assessment_id: pendingPreviousId ?? undefined,
    });

    if (newId != null && pendingPreviousId != null) {
      await linkRevisit(pendingPreviousId, newId);
      setPendingPreviousId(null);
    }

    const annotatedResult = { ...out.result, high_risk_pregnancy: highRisk };
    setLast(liveInput, annotatedResult, newId);
    sessionStorage.removeItem("arogya_draft");
    navigate({ to: "/result" });
  }

  // Vitals relevance logic
  const hasBreathing = Array.from(selected.keys()).some(k => SYMPTOMS.find(s => s.key === k)?.group === "breathing" || k === "convulsions" || k === "unconscious");
  const hasFever = Array.from(selected.keys()).some(k => SYMPTOMS.find(s => s.key === k)?.group === "fever");

  const labelCls = "block text-sm font-semibold text-foreground/80 mb-1.5";
  const inputCls = "w-full h-[52px] px-4 rounded-[14px] bg-white/92 border border-slate-200 text-[#1E293B] text-[15px] font-medium placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0F8B8D] focus:ring-[4px] focus:ring-[#0F8B8D]/12 transition-all duration-200 ease-out shadow-[0_2px_4px_rgba(0,0,0,0.02)]";

  function chipClass(on: boolean, isDanger: boolean) {
    const base = "min-h-[48px] px-4 py-2.5 rounded-[1.25rem] text-sm transition-all duration-200 ease-out inline-flex items-center gap-2 relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary hover:-translate-y-[2px]";
    if (on) {
      return isDanger
        ? `${base} font-bold bg-severity-emergency/10 text-severity-emergency border-2 border-severity-emergency shadow-[0_6px_14px_hsl(var(--severity-emergency)/0.15),0_0_0_4px_hsl(var(--severity-emergency)/0.05)]`
        : `${base} font-bold bg-[#E8F7F5] text-[#0F8B8D] border-2 border-[#0F8B8D] shadow-[0_6px_14px_rgba(15,139,141,0.10),0_0_0_4px_rgba(15,139,141,0.06)]`;
    }
    return isDanger
      ? `${base} font-semibold bg-card text-foreground border border-severity-emergency/30 hover:border-severity-emergency/50 hover:bg-severity-emergency/5 hover:shadow-sm`
      : `${base} font-semibold bg-card text-foreground border border-border/80 hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm`;
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10, filter: "blur(2px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 300, damping: 25 } },
  };

  return (
    <AppShell>
      <form onSubmit={onSubmit} className="space-y-12 pb-24 sm:pb-4 relative">
        
        {/* DRAFT RECOVERY PROMPT */}
        {draftPrompt && (
          <div className="mb-6 p-4 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in shadow-sm">
            <div className="flex items-center gap-3 text-primary">
              <ShieldCheck className="size-5 shrink-0" />
              <div className="text-sm font-medium">
                <span className="font-bold block">Unfinished assessment found</span>
                Would you like to resume where you left off?
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button type="button" onClick={discardDraft} className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-bold text-muted-foreground hover:bg-background transition-colors min-h-[48px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">
                Start Over
              </button>
              <button type="button" onClick={restoreDraft} className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-bold bg-primary text-primary-foreground shadow-md transition-colors min-h-[48px] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:outline-none">
                Resume Draft
              </button>
            </div>
          </div>
        )}

        {/* PROGRESS TABS */}
        <div className="flex items-center gap-2 mb-8 border-b border-slate-200/50 pb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStage(s as 1|2|3)}
                className={`size-10 min-w-[40px] rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary ${
                  stage === s 
                    ? "bg-[#E8F7F5] text-[#0F8B8D] border-2 border-[#0F8B8D] shadow-[0_4px_10px_rgba(15,139,141,0.10)]" 
                    : stage > s
                    ? "bg-[#0F8B8D]/10 text-[#0F8B8D] border border-[#0F8B8D]/20 hover:bg-[#0F8B8D]/20"
                    : "bg-slate-100 text-slate-400 border border-transparent"
                }`}
              >
                {stage > s ? <ShieldCheck className="size-5" /> : s}
              </button>
              {s !== 3 && <div className={`w-10 h-1 rounded-full transition-colors duration-300 ${stage > s ? "bg-[#0F8B8D]/20" : "bg-slate-200"}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* STAGE 1: PATIENT CONTEXT */}
          {stage === 1 && (
            <motion.div key="stage1" variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0, y: -10 }} className="space-y-8">
              <motion.h2 variants={itemVariants} className="text-2xl font-bold tracking-tight text-[#1E293B] flex items-center gap-3">
                <User className="size-6 text-[#0F8B8D]" />
                Who needs care today?
              </motion.h2>

              <div className="p-6 sm:p-8 rounded-[32px] bg-slate-50/50 border border-slate-200/50 space-y-8">
                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 sm:gap-4">
                {[
                  { id: "child", icon: Baby, label: "Child (<18)" },
                  { id: "pregnant", icon: Baby, label: "Pregnant Woman" },
                  { id: "adult", icon: PersonStanding, label: "Adult (18-64)" },
                  { id: "elderly", icon: Activity, label: "Elderly (65+)" }
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleCategorySelect(c.id as any)}
                    className={`p-4 rounded-[22px] flex flex-col items-center justify-center gap-2 transition-all duration-200 ease-out min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary hover:-translate-y-[2px] border-2 ${
                      patientCategory === c.id
                        ? "bg-[#E8F7F5] border-[#0F8B8D] shadow-[0_6px_14px_rgba(15,139,141,0.10),0_0_0_4px_rgba(15,139,141,0.06)]"
                        : "bg-white border-slate-200 hover:border-[#0F8B8D]/40 hover:bg-[#F6FFFE] hover:shadow-[0_4px_12px_rgba(15,139,141,0.06)]"
                    }`}
                  >
                    <c.icon className={`size-6 transition-colors ${patientCategory === c.id ? "text-[#0F8B8D]" : "text-muted-foreground"}`} />
                    <span className={`transition-colors ${patientCategory === c.id ? "text-[#0F8B8D] font-bold" : "text-foreground font-semibold"}`}>
                      {c.label}
                    </span>
                  </button>
                ))}
              </motion.div>

              <AnimatePresence>
                {patientCategory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 sm:p-8 rounded-[22px] bg-white/86 border border-slate-200/70 shadow-[0_8px_24px_rgba(15,23,42,0.04)] space-y-5 mt-6 backdrop-blur-md">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className={labelCls}>{t(lang, "patient_name")}</label>
                          <input className={inputCls} placeholder="Optional" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div>
                          <label className={labelCls}>
                            {t(lang, "age")} ({t(lang, "age_years")}) <span className="text-destructive">*</span>
                          </label>
                          <input className={inputCls} type="number" inputMode="numeric" min={0} max={120} value={age} onChange={(e) => setAge(e.target.value)} required />
                        </div>
                        <div>
                          <label className={labelCls}>{t(lang, "sex")}</label>
                          <select className={inputCls} value={sex} onChange={(e) => setSex(e.target.value as "male"|"female"|"other")} disabled={patientCategory === "pregnant"}>
                            <option value="female">{t(lang, "female")}</option>
                            <option value="male">{t(lang, "male")}</option>
                            <option value="other">{t(lang, "other")}</option>
                          </select>
                        </div>
                        {patientCategory === "pregnant" && (
                          <div className="sm:col-span-2 pt-2">
                            <label className={labelCls}>{t(lang, "pregnancy_weeks")}</label>
                            <input className={inputCls} type="number" inputMode="numeric" min={0} max={45} value={weeks} onChange={(e) => setWeeks(e.target.value)} />
                          </div>
                        )}
                      </div>
                      
                      <div className="pt-4 flex justify-end">
                        <button type="button" onClick={() => setStage(2)} className="h-[54px] px-[30px] rounded-2xl bg-[#0F8B8D] text-white text-[15px] font-bold shadow-[0_12px_24px_rgba(15,139,141,0.20)] hover:shadow-[0_16px_32px_rgba(15,139,141,0.25)] hover:-translate-y-[2px] transition-all duration-200 ease-out flex items-center justify-center gap-2">
                          Continue to Symptoms <ArrowRight className="size-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* STAGE 2: SYMPTOMS */}
          {stage === 2 && (
            <motion.div key="stage2" variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0, y: -10 }} className="space-y-8">
              <motion.h2 variants={itemVariants} className="text-2xl font-bold tracking-tight text-[#1E293B] flex items-center gap-3">
                <Activity className="size-6 text-[#0F8B8D]" />
                What are the primary symptoms?
              </motion.h2>

              <div className="p-6 sm:p-8 rounded-[32px] bg-slate-50/50 border border-slate-200/50 space-y-6">
                {[
                  ["danger", "group_danger", true],
                  ["breathing", "group_breathing", false],
                  ["fever", "group_fever_dehy", false],
                  ...(isMat ? [["maternal", "group_maternal", false]] : []),
                  ...(!isPed ? [["adult", "group_adult", false]] : []),
                  ...(isPed ? [["pediatric", "group_pediatric", false]] : []),
                ].map(([gKey, label, isDanger]) => {
                  const items = groups[gKey as keyof typeof groups];
                  if (!items || items.length === 0) return null;
                  return (
                    <motion.div variants={itemVariants} key={gKey as string} className={`p-6 sm:p-8 rounded-[22px] border backdrop-blur-md ${isDanger ? "bg-[#FFF5F5]/80 border-l-4 border-l-[#B91C1C] border-y-slate-200/70 border-r-slate-200/70 shadow-[0_8px_24px_rgba(15,23,42,0.04)]" : "bg-white/86 border-slate-200/70 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"}`}>
                      <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${isDanger ? "text-severity-emergency" : "text-muted-foreground/80"}`}>
                        {isDanger && <ShieldAlert className="size-4" />}
                        {t(lang, label as any)}
                      </h3>
                      <div className="flex flex-wrap gap-2.5">
                        {items.map((s) => {
                          const isGraded = !!s.severities;
                          const isSelected = selected.has(s.key);
                          const isExpanded = expandedSymptom === s.key;
                          const selectedSevValue = selected.get(s.key);
                          const selectedSevLabel = isGraded && typeof selectedSevValue === "string" ? s.severities!.find(sv => sv.value === selectedSevValue) : null;

                          if (!isGraded) {
                            return (
                              <button key={s.key} type="button" onClick={() => toggleDirect(s.key)} className={chipClass(isSelected, isDanger as boolean)}>
                                {symptomLabel(s, lang)}
                              </button>
                            );
                          }

                          return (
                            <div key={s.key} className="w-full sm:w-auto">
                              <div className={`inline-flex flex-col w-full sm:w-auto rounded-[1.25rem] border transition-all duration-200 ease-out ${isSelected ? "border-2 border-[#0F8B8D] bg-[#E8F7F5] shadow-[0_6px_14px_rgba(15,139,141,0.10),0_0_0_4px_rgba(15,139,141,0.06)]" : isExpanded ? "border-border bg-muted/40 shadow-sm" : "border-transparent"}`}>
                                <div className="flex items-center gap-1">
                                  <button type="button" onClick={() => toggleGraded(s.key)} className={`flex-1 px-4 py-2.5 text-sm transition-all duration-200 ease-out min-h-[48px] inline-flex items-center gap-2 ${isSelected ? "text-[#0F8B8D] font-bold" : "text-foreground font-medium"} ${isSelected || isExpanded ? "" : "rounded-[1rem] border border-border/80 bg-card/80 hover:bg-muted/50 hover:shadow-sm hover:border-primary/40 hover:-translate-y-[2px]"}`}>
                                    {symptomLabel(s, lang)}
                                    {selectedSevLabel ? (
                                      <span className="ml-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border-2 border-[#0F8B8D] text-[#0F8B8D] bg-white shadow-sm">{symptomLabel(selectedSevLabel, lang)}</span>
                                    ) : (
                                      <span className={`text-[10px] ml-auto transition-transform ${isExpanded ? "rotate-180" : ""}`}>▾</span>
                                    )}
                                  </button>
                                  {isSelected && (
                                    <button type="button" onClick={() => clearSymptom(s.key)} className="mr-2 size-6 rounded-full bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex items-center justify-center text-sm transition-colors shrink-0">×</button>
                                  )}
                                </div>
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="px-2.5 pb-2.5 pt-1 flex flex-wrap gap-2 border-t border-border/50 overflow-hidden">
                                      {s.severities!.map((sv) => (
                                        <button key={sv.value} type="button" onClick={() => selectGradedSeverity(s.key, sv.value)} className={`px-4 py-2 rounded-xl text-xs transition-all duration-200 ease-out min-h-[40px] hover:-translate-y-[2px] ${selectedSevValue === sv.value ? "font-bold bg-[#E8F7F5] text-[#0F8B8D] border-2 border-[#0F8B8D] shadow-[0_4px_10px_rgba(15,139,141,0.10)]" : "font-semibold bg-card/80 text-foreground border border-border hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm"}`}>
                                          {symptomLabel(sv, lang)}
                                        </button>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="pt-6 flex justify-between items-center border-t border-slate-200/50">
                <button type="button" onClick={() => setStage(1)} className="h-[54px] px-6 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-[15px] font-bold hover:bg-slate-100 hover:text-slate-900 transition-all duration-200 ease-out">
                  Back
                </button>
                <button type="button" onClick={() => setStage(3)} className="h-[54px] px-[30px] rounded-2xl bg-[#0F8B8D] text-white text-[15px] font-bold shadow-[0_12px_24px_rgba(15,139,141,0.20)] hover:shadow-[0_16px_32px_rgba(15,139,141,0.25)] hover:-translate-y-[2px] transition-all duration-200 ease-out flex items-center justify-center gap-2">
                  Continue to Vitals <ArrowRight className="size-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STAGE 3: CONTEXTUAL VITALS */}
          {stage === 3 && (
            <motion.div key="stage3" variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0, y: -10 }} className="space-y-8">
              <motion.div variants={itemVariants}>
                <h2 className="text-2xl font-bold tracking-tight text-[#1E293B] flex items-center gap-3">
                  <Thermometer className="size-6 text-[#0F8B8D]" />
                  Let's check relevant vitals
                </h2>
                <p className="text-slate-500 text-sm mt-2">Based on the symptoms selected, please measure the following:</p>
              </motion.div>

              <div className="p-6 sm:p-8 rounded-[32px] bg-slate-50/50 border border-slate-200/50 space-y-6">
                {(hasBreathing || showAllVitals) && (
                  <motion.div variants={itemVariants} className="p-6 sm:p-8 rounded-[22px] bg-white/86 border border-slate-200/70 shadow-[0_8px_24px_rgba(15,23,42,0.04)] backdrop-blur-md flex flex-col sm:flex-row sm:items-center gap-6">
                    <div className="flex-1">
                      <h4 className="font-bold flex items-center gap-2"><Wind className="size-4 text-primary" /> Oxygen & Breathing</h4>
                      <p className="text-xs text-muted-foreground mt-1">Can you measure the patient's SpO₂ level and count breaths per minute?</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-24">
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">SpO₂ (%)</label>
                        <input className={inputCls} type="number" inputMode="numeric" value={spo2} onChange={(e) => setSpo2(e.target.value)} />
                      </div>
                      <div className="w-24">
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">Resp. Rate</label>
                        <input className={inputCls} type="number" inputMode="numeric" value={rr} onChange={(e) => setRr(e.target.value)} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {(hasFever || showAllVitals) && (
                  <motion.div variants={itemVariants} className="p-6 sm:p-8 rounded-[22px] bg-white/86 border border-slate-200/70 shadow-[0_8px_24px_rgba(15,23,42,0.04)] backdrop-blur-md flex flex-col sm:flex-row sm:items-center gap-6">
                    <div className="flex-1">
                      <h4 className="font-bold flex items-center gap-2"><Thermometer className="size-4 text-primary" /> Body Temperature</h4>
                      <p className="text-xs text-muted-foreground mt-1">Check temperature and note how many days the fever has lasted.</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-24">
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">Temp (°F/°C)</label>
                        <input className={inputCls} type="number" step="0.1" inputMode="decimal" value={temp} onChange={(e) => setTemp(e.target.value)} />
                      </div>
                      <div className="w-24">
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">Days</label>
                        <input className={inputCls} type="number" inputMode="numeric" value={feverDays} onChange={(e) => setFeverDays(e.target.value)} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {showAllVitals && (
                  <motion.div variants={itemVariants} className="p-6 sm:p-8 rounded-[22px] bg-white/86 border border-slate-200/70 shadow-[0_8px_24px_rgba(15,23,42,0.04)] backdrop-blur-md flex flex-col sm:flex-row sm:items-center gap-6">
                    <div className="flex-1">
                      <h4 className="font-bold flex items-center gap-2"><Activity className="size-4 text-primary" /> Other Metrics</h4>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-24">
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">Hemoglobin</label>
                        <input className={inputCls} type="number" step="0.1" inputMode="decimal" value={hb} onChange={(e) => setHb(e.target.value)} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {!hasBreathing && !hasFever && !showAllVitals && (
                  <motion.div variants={itemVariants} className="p-8 text-center border-2 border-dashed border-slate-200/70 rounded-[22px] bg-slate-50/50">
                    <p className="text-sm text-muted-foreground">No specific vitals required based on selected symptoms.</p>
                  </motion.div>
                )}

                <div className="pt-2 text-center">
                  <button type="button" onClick={() => setShowAllVitals(!showAllVitals)} className="text-xs font-semibold text-primary hover:underline">
                    {showAllVitals ? "Hide non-relevant vitals" : "Show all vitals"}
                  </button>
                </div>
              </div>

              {errors.length > 0 && (
                <motion.div variants={itemVariants} className="rounded-xl border border-destructive/30 bg-destructive/5 text-destructive p-4 text-sm mt-6">
                  <div className="flex items-center gap-2 font-bold mb-2">
                    <AlertTriangle className="size-4" /> {t(lang, "validation_blocked")}
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    {errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </motion.div>
              )}

              <div className="pt-8 flex justify-between items-center border-t border-slate-200/50">
                <button type="button" onClick={() => setStage(2)} className="h-[54px] px-6 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-[15px] font-bold hover:bg-slate-100 hover:text-slate-900 transition-all duration-200 ease-out">
                  Back
                </button>
                <button type="submit" disabled={submitting} className="h-[54px] px-[30px] rounded-2xl bg-[#0F8B8D] text-white text-[15px] font-bold shadow-[0_12px_24px_rgba(15,139,141,0.20)] hover:shadow-[0_16px_32px_rgba(15,139,141,0.25)] hover:-translate-y-[2px] transition-all duration-200 ease-out flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[0_12px_24px_rgba(15,139,141,0.20)]">
                  {t(lang, "run_triage")}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* --- LIVE INTELLIGENCE PORTAL --- */}
      {railTarget && createPortal(
        <LiveIntelligencePortal liveResult={liveResult} />,
        railTarget
      )}
    </AppShell>
  );
}
