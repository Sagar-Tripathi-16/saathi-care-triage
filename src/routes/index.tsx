import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/store/app";
import { t } from "@/i18n/dict";
import { runTriage } from "@/engine";
import type { PatientInput } from "@/engine/types";
import { saveAssessment, listAssessments, matchPatientHistory, linkRevisit } from "@/storage/db";
import { computeHighRiskPregnancy } from "@/engine/maternalRisk";
import { AlertTriangle, ChevronDown, ChevronUp, ShieldAlert, Activity, Baby } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "New Assessment — Arogya Saathi" },
      {
        name: "description",
        content: "Run an offline household triage assessment for a patient.",
      },
    ],
  }),
  component: IndexPage,
});

interface SymptomDef {
  key: string;
  label_en: string;
  label_hi: string;
  label_kn: string;
  group: "danger" | "breathing" | "fever" | "maternal" | "adult" | "pediatric";
  category?: "pediatric" | "maternal" | "adult" | "all";
}

const SYMPTOMS: SymptomDef[] = [
  { key: "convulsions", label_en: "Convulsions", label_hi: "दौरे", label_kn: "ಜರ್ಕಗಳು", group: "danger" },
  { key: "unconscious", label_en: "Unconscious", label_hi: "बेहोश", label_kn: "ಪ್ರಜ್ಞಾಹೀನ", group: "danger" },
  { key: "severe_breathlessness", label_en: "Severe breathlessness", label_hi: "गंभीर श्वास", label_kn: "ತೀವ್ರ ಉಸಿರಾಟದ ತೊಂದರೆ", group: "breathing" },
  { key: "breathlessness", label_en: "Mild breathlessness", label_hi: "हल्की श्वास", label_kn: "ಸಣ್ಣ ಉಸಿರಾಟದ ತೊಂದರೆ", group: "breathing" },
  { key: "chest_indrawing", label_en: "Chest indrawing", label_hi: "छाती धंसना", label_kn: "ಎದೆ ಒಳಗೆಳೆಯುವಿಕೆ", group: "breathing", category: "pediatric" },
  { key: "fast_breathing", label_en: "Fast breathing", label_hi: "तेज़ श्वास", label_kn: "ವೇಗದ ಉಸಿರಾಟ", group: "breathing", category: "pediatric" },
  { key: "confusion", label_en: "Confusion", label_hi: "भ्रम", label_kn: "ಗೊಂದಲ", group: "fever" },
  { key: "unable_to_drink", label_en: "Unable to drink", label_hi: "पी नहीं सकते", label_kn: "ಕುಡಿಯಲು ಆಗದು", group: "fever" },
  { key: "vomiting_everything", label_en: "Vomiting everything", label_hi: "सब उल्टी", label_kn: "ಎಲ್ಲವೂ ವಾಂತಿ", group: "fever" },
  { key: "heavy_bleeding", label_en: "Heavy bleeding", label_hi: "भारी रक्तस्राव", label_kn: "ಭಾರೀ ರಕ್ತಸ್ರಾವ", group: "maternal", category: "maternal" },
  { key: "fetal_movement_stopped", label_en: "Fetal movement stopped", label_hi: "गर्भ हलचल बंद", label_kn: "ಗರ್ಭದ ಚಲನೆ ನಿಂತಿದೆ", group: "maternal", category: "maternal" },
  { key: "reduced_fetal_movement", label_en: "Reduced fetal movement", label_hi: "गर्भ हलचल कम", label_kn: "ಕಡಿಮೆ ಗರ್ಭ ಚಲನೆ", group: "maternal", category: "maternal" },
  { key: "severe_headache", label_en: "Severe headache", label_hi: "गंभीर सिरदर्द", label_kn: "ತೀವ್ರ ತಲೆನೋವು", group: "maternal", category: "maternal" },
  { key: "blurred_vision", label_en: "Blurred vision", label_hi: "धुंधली दृष्टि", label_kn: "ಮಸುಕು ದೃಷ್ಟಿ", group: "maternal", category: "maternal" },
  { key: "severe_weakness", label_en: "Severe weakness", label_hi: "गंभीर कमज़ोरी", label_kn: "ತೀವ್ರ ದೌರ್ಬಲ್ಯ", group: "maternal" },
  { key: "severe_chest_pain", label_en: "Severe chest pain", label_hi: "गंभीर सीने में दर्द", label_kn: "ತೀವ್ರ ಎದೆ ನೋವು", group: "adult", category: "adult" },
  { key: "fainting", label_en: "Fainting", label_hi: "बेहोशी", label_kn: "ಮೂರ್ಛೆ", group: "adult", category: "adult" },
  { key: "unable_to_feed", label_en: "Unable to feed (child)", label_hi: "नहीं खा सकते (बच्चा)", label_kn: "ಆಹಾರ ತೆಗೆದುಕೊಳ್ಳಲಾಗದು", group: "pediatric", category: "pediatric" },
];

function symptomLabel(s: SymptomDef, lang: string) {
  return lang === "hi" ? s.label_hi : lang === "kn" ? s.label_kn : s.label_en;
}

function IndexPage() {
  const lang = useApp((s) => s.lang);
  const setLast = useApp((s) => s.setLast);
  const pendingPreviousId = useApp((s) => s.pendingPreviousId);
  const setPendingPreviousId = useApp((s) => s.setPendingPreviousId);
  const navigate = useNavigate();

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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showMoreVitals, setShowMoreVitals] = useState(false);

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

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function reset() {
    setName(""); setAge(""); setSex("female"); setPregnant(false); setWeeks("");
    setTemp(""); setSpo2(""); setHb(""); setRr(""); setFeverDays("");
    setSelected(new Set()); setErrors([]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors([]);

    const symptoms = Array.from(selected);
    const input: PatientInput = {
      patient_name: name.trim(),
      age: age === "" ? undefined : parseFloat(age),
      sex, pregnant,
      pregnancy_weeks: weeks === "" ? undefined : parseFloat(weeks),
      temperature: temp === "" ? undefined : parseFloat(temp),
      spo2: spo2 === "" ? undefined : parseFloat(spo2),
      hemoglobin: hb === "" ? undefined : parseFloat(hb),
      respiratory_rate: rr === "" ? undefined : parseFloat(rr),
      fever_duration_days: feverDays === "" ? undefined : parseFloat(feverDays),
      symptoms,
    };

    const out = runTriage(input);
    if (!out.ok || !out.result) {
      setErrors(out.validation_issues.filter((i) => i.level === "error").map((i) => i.message));
      setSubmitting(false);
      return;
    }

    // Post-engine advisory: high-risk pregnancy flag (does NOT alter triage)
    let highRisk;
    try {
      const all = await listAssessments();
      const prior = matchPatientHistory(all, input.patient_name, input.age, Date.now());
      highRisk = computeHighRiskPregnancy(input, out.result, prior);
    } catch {
      highRisk = computeHighRiskPregnancy(input, out.result, []);
    }

    const newId = await saveAssessment({
      patient_name: name.trim() || "—",
      age: input.age,
      pregnant,
      category: out.result.patient_category,
      severity: out.result.triage,
      urgency: out.result.urgency,
      triggered_rules: out.result.triggered_rules,
      input,
      result: out.result,
      created_at: Date.now(),
      high_risk_pregnancy: highRisk,
      previous_assessment_id: pendingPreviousId ?? undefined,
    });

    if (newId != null && pendingPreviousId != null) {
      await linkRevisit(pendingPreviousId, newId);
      setPendingPreviousId(null);
    }

    // Attach the new annotated result (with high-risk) so Result can show it
    const annotatedResult = { ...out.result, high_risk_pregnancy: highRisk };
    setLast(input, annotatedResult, newId);

    navigate({ to: "/result" });
  }

  const labelCls = "block text-sm font-medium text-foreground mb-1";
  const inputCls =
    "w-full px-3 py-2.5 text-base sm:text-sm rounded-lg border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px]";

  function renderChip(s: SymptomDef, isDanger: boolean) {
    const on = selected.has(s.key);
    const base = "px-3.5 py-2 rounded-full border text-sm transition-all min-h-[44px] inline-flex items-center";
    if (on) {
      return isDanger
        ? `${base} bg-severity-emergency text-severity-emergency-foreground border-severity-emergency ring-2 ring-severity-emergency/30`
        : `${base} bg-primary text-primary-foreground border-primary`;
    }
    return isDanger
      ? `${base} bg-card text-foreground border-severity-emergency/40 hover:bg-severity-emergency-soft`
      : `${base} bg-card text-foreground border-border hover:bg-muted`;
  }

  const groupOrder: Array<[keyof typeof groups, Parameters<typeof t>[1], boolean]> = [
    ["danger", "group_danger", true],
    ["breathing", "group_breathing", false],
    ["fever", "group_fever_dehy", false],
    ...(isMat ? [["maternal", "group_maternal", false] as [keyof typeof groups, Parameters<typeof t>[1], boolean]] : []),
    ...(!isPed ? [["adult", "group_adult", false] as [keyof typeof groups, Parameters<typeof t>[1], boolean]] : []),
    ...(isPed ? [["pediatric", "group_pediatric", false] as [keyof typeof groups, Parameters<typeof t>[1], boolean]] : []),
  ];

  return (
    <AppShell>
      <form onSubmit={onSubmit} className="space-y-5 pb-24 sm:pb-0">
        {/* Patient info */}
        <section className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Activity className="size-4 text-primary" /> {t(lang, "patient_info")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={labelCls}>{t(lang, "patient_name")}</label>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>
                {t(lang, "age")} ({t(lang, "age_years")}) <span className="text-destructive">*</span>
              </label>
              <input
                className={inputCls}
                type="number" inputMode="numeric" min={0} max={120}
                value={age} onChange={(e) => setAge(e.target.value)} required
              />
            </div>
            <div>
              <label className={labelCls}>{t(lang, "sex")}</label>
              <select className={inputCls} value={sex} onChange={(e) => setSex(e.target.value as "male"|"female"|"other")}>
                <option value="female">{t(lang, "female")}</option>
                <option value="male">{t(lang, "male")}</option>
                <option value="other">{t(lang, "other")}</option>
              </select>
            </div>
            {sex === "female" && !Number.isNaN(ageNum) && ageNum >= 10 && ageNum <= 60 && (
              <div className="sm:col-span-2 rounded-xl border border-border bg-muted/40 p-3 space-y-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox" checked={pregnant}
                    onChange={(e) => setPregnant(e.target.checked)}
                    className="size-5 accent-primary"
                  />
                  <Baby className="size-4 text-primary" />
                  <span className="font-medium">{t(lang, "pregnant")}</span>
                </label>
                {pregnant && (
                  <div>
                    <label className={labelCls}>{t(lang, "pregnancy_weeks")}</label>
                    <input
                      className={inputCls}
                      type="number" inputMode="numeric" min={0} max={45}
                      value={weeks} onChange={(e) => setWeeks(e.target.value)}
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">{t(lang, "weeks_helper")}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Vitals */}
        <section className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-foreground mb-3">{t(lang, "vitals")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>{t(lang, "temperature_c")}</label>
              <input className={inputCls} type="number" step="0.1" inputMode="decimal" value={temp} onChange={(e) => setTemp(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>{t(lang, "spo2")}</label>
              <input className={inputCls} type="number" inputMode="numeric" value={spo2} onChange={(e) => setSpo2(e.target.value)} />
            </div>
            <div className={`${showMoreVitals ? "" : "hidden sm:block"}`}>
              <label className={labelCls}>{t(lang, "hemoglobin")}</label>
              <input className={inputCls} type="number" step="0.1" inputMode="decimal" value={hb} onChange={(e) => setHb(e.target.value)} />
            </div>
            <div className={`${showMoreVitals ? "" : "hidden sm:block"}`}>
              <label className={labelCls}>{t(lang, "resp_rate")}</label>
              <input className={inputCls} type="number" inputMode="numeric" value={rr} onChange={(e) => setRr(e.target.value)} />
            </div>
            <div className={`${showMoreVitals ? "" : "hidden sm:block"}`}>
              <label className={labelCls}>{t(lang, "fever_duration")}</label>
              <input className={inputCls} type="number" inputMode="numeric" value={feverDays} onChange={(e) => setFeverDays(e.target.value)} />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowMoreVitals((v) => !v)}
            className="sm:hidden mt-3 text-sm text-primary inline-flex items-center gap-1 min-h-[36px]"
          >
            {showMoreVitals ? (
              <>
                <ChevronUp className="size-4" /> {t(lang, "vitals_less")}
              </>
            ) : (
              <>
                <ChevronDown className="size-4" /> {t(lang, "vitals_more")}
              </>
            )}
          </button>
        </section>

        {/* Symptoms */}
        <section className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-foreground mb-3">{t(lang, "symptoms")}</h2>
          <div className="space-y-4">
            {groupOrder.map(([gKey, label, isDanger]) => {
              const items = groups[gKey];
              if (!items || items.length === 0) return null;
              return (
                <div
                  key={gKey}
                  className={
                    isDanger
                      ? "rounded-xl border border-severity-emergency/40 bg-severity-emergency-soft/40 p-3"
                      : ""
                  }
                >
                  <h3 className={`text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5 ${isDanger ? "text-severity-emergency" : "text-muted-foreground"}`}>
                    {isDanger && <ShieldAlert className="size-3.5" />}
                    {t(lang, label)}
                    {isDanger && (
                      <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-severity-emergency text-severity-emergency-foreground">
                        {t(lang, "critical_label")}
                      </span>
                    )}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {items.map((s) => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => toggle(s.key)}
                        className={renderChip(s, isDanger)}
                      >
                        {symptomLabel(s, lang)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {errors.length > 0 && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 text-destructive p-3 text-sm">
            <div className="flex items-center gap-2 font-medium mb-1">
              <AlertTriangle className="size-4" /> {t(lang, "validation_blocked")}
            </div>
            <ul className="list-disc pl-5 space-y-0.5">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        {/* Desktop submit row */}
        <div className="hidden sm:flex gap-3">
          <button
            type="button" onClick={reset}
            className="px-4 py-3 rounded-xl border border-border bg-card text-foreground min-h-[48px]"
          >
            {t(lang, "reset")}
          </button>
          <button
            type="submit" disabled={submitting}
            className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-sm disabled:opacity-60 min-h-[48px]"
          >
            {t(lang, "run_triage")}
          </button>
        </div>

        {/* Sticky mobile submit bar */}
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-card/95 backdrop-blur border-t border-border px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto max-w-3xl flex gap-2">
            <button
              type="button" onClick={reset}
              className="px-4 py-3 rounded-xl border border-border bg-card text-foreground min-h-[48px]"
            >
              {t(lang, "reset")}
            </button>
            <button
              type="submit" disabled={submitting}
              className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-sm disabled:opacity-60 min-h-[48px]"
            >
              {t(lang, "run_triage")}
            </button>
          </div>
        </div>
      </form>
    </AppShell>
  );
}
