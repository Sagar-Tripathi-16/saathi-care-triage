import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/store/app";
import { t } from "@/i18n/dict";
import { severityClasses, severityLabel } from "@/lib/severity";
import { simplifyExplanation } from "@/lib/ai.functions";
import { loadAllRules } from "@/engine/rules";
import { listAssessments, getAssessment, updateAssessment, type SimplifiedAI, type AssessmentRecord } from "@/storage/db";
import { compareAssessments, type ConditionStatus } from "@/lib/comparison";
import { FollowUpPlanner } from "@/components/FollowUpPlanner";
import { NarrationBar } from "@/components/NarrationBar";
import { useVoice, buildNarrationScript } from "@/hooks/useVoice";
import { downloadTriageSlip } from "@/lib/pdfSlip";
import {
  Sparkles, AlertTriangle, ArrowLeft, Info, ListChecks, ShieldAlert,
  ShieldCheck, Stethoscope, ArrowRight, HeartPulse, FileDown, Clock, Activity,
  AlertCircle, ChevronRight, Download, Printer, WifiOff,
  TrendingUp, TrendingDown, Minus, History
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const SECTION_ICONS: Record<string, any> = {
  // EN
  situation: Stethoscope, "what to do now": Activity, "watch carefully": AlertCircle, "follow-up": Clock,
  // HI
  "स्थिति": Stethoscope, "अभी क्या करें": Activity, "ध्यान से देखें": AlertCircle, "अनुवर्ती कार्रवाई": Clock,
  // KN
  "ಪರಿಸ್ಥಿತಿ": Stethoscope, "ಈಗ ಏನು ಮಾಡಬೇಕು": Activity, "ಗಮನಿಸಿ": AlertCircle, "ಮುಂದಿನ ಭೇಟಿ": Clock,
};

function getSectionIcon(heading: string) {
  const Icon = SECTION_ICONS[heading.toLowerCase()] || ShieldCheck;
  return Icon;
}

// ─── Editorial Narrative Renderer ──────────────────────────────────────────────
function EditorialNarrativeRenderer({ text, isEmergency }: { text: string, isEmergency: boolean }) {
  if (!text) return null;
  const parts = text.split(/\[([^\]]+)\]/g).filter((p) => p.trim());
  const elements: { heading?: string; body: string }[] = [];
  
  for (let i = 0; i < parts.length; i++) {
    const raw = parts[i].trim();
    if (!raw) continue;
    if (i % 2 === 1) {
      elements.push({ heading: raw, body: parts[i + 1]?.trim() || "" });
      i++;
    } else {
      elements.push({ body: raw });
    }
  }

  if (elements.length === 0) {
    return <p className="text-base text-foreground/80 leading-relaxed whitespace-pre-line px-2">{text}</p>;
  }

  return (
    <motion.div
      className="space-y-6 sm:space-y-8"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
    >
      {elements.map((el, i) => {
        const Icon = el.heading ? getSectionIcon(el.heading) : null;
        const isWatchCarefully = el.heading?.toLowerCase() === "watch carefully" || el.heading?.toLowerCase() === "ध्यान से देखें" || el.heading?.toLowerCase() === "ಗಮನಿಸಿ";
        
        return (
          <motion.div
            key={i}
            variants={{
              hidden: { opacity: 0, y: 15 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
            }}
            className={`group relative p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border transition-all duration-500 overflow-hidden ${
              isWatchCarefully 
                ? "bg-severity-phc/5 border-severity-phc/20 hover:bg-severity-phc/10 hover:border-severity-phc/30" 
                : "bg-card/40 border-border/50 hover:bg-card/80 hover:shadow-lg hover:border-border/80"
            }`}
          >
            {/* Subtle background glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <div className="relative z-10 space-y-4">
              {el.heading && (
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${isWatchCarefully ? "bg-severity-phc/20 text-severity-phc" : "bg-primary/10 text-primary"}`}>
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-foreground/90">
                    {el.heading}
                  </h3>
                </div>
              )}
              {el.body && (
                <p className="text-base sm:text-lg text-foreground/80 leading-[1.8] whitespace-pre-line font-medium pl-0 sm:pl-[3.25rem]">
                  {el.body.replace(/\b([A-Z]{4,})\b/g, (m) => m.charAt(0) + m.slice(1).toLowerCase())}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export const Route = createFileRoute("/result")({
  head: () => ({
    meta: [
      { title: "Triage Result — Arogya Saathi" },
      { name: "description", content: "Explainable triage result with reasoning, warning signs, and recommended action." },
    ],
  }),
  component: ResultPage,
});

function ResultPage() {
  const lang = useApp((s) => s.lang);
  const result = useApp((s) => s.lastResult);
  const input = useApp((s) => s.lastInput);
  const lastRecordId = useApp((s) => s.lastRecordId);
  const online = useApp((s) => s.online);
  const navigate = useNavigate();

  const [simplifying, setSimplifying] = useState(false);
  const [simplified, setSimplified] = useState<SimplifiedAI | null>(null);
  const [aiMode, setAiMode] = useState<"ai" | "fallback" | null>(null);
  const [aiSaved, setAiSaved] = useState(false);
  const [record, setRecord] = useState<AssessmentRecord | null>(null);
  const [previousRecord, setPreviousRecord] = useState<AssessmentRecord | null>(null);
  const [comparison, setComparison] = useState<ConditionStatus | null>(null);

  const { speak, stop, pause, resume, speaking, paused, isSupported } = useVoice();

  useEffect(() => {
    if (!result) navigate({ to: "/" });
  }, [result, navigate]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!result) return;
      const all = await listAssessments();
      const match =
        (lastRecordId != null ? all.find((a) => a.id === lastRecordId) : undefined) ??
        all.find((a) => a.result?.timestamp === result.timestamp);
      if (!cancel) {
        setRecord(match ?? null);
        // Pre-load saved AI summary if exists
        if (match?.ai_simplified?.payload) {
          setSimplified(match.ai_simplified.payload);
          setAiMode("ai");
        }
        // Load previous assessment and compute comparison
        if (match?.previous_assessment_id != null) {
          const prev = await getAssessment(match.previous_assessment_id);
          if (!cancel && prev && match) {
            setPreviousRecord(prev);
            setComparison(compareAssessments(prev, match));
          }
        }
      }
    })();
    return () => { cancel = true; };
  }, [result, lastRecordId]);

  if (!result) return null;

  const isEmergency = result.triage === "Emergency";
  const isPHC = result.triage === "PHC Referral";
  const isOverride = !!result.override_triggered && (result.override_rule_ids?.length ?? 0) > 0;
  const highRisk = result.high_risk_pregnancy;
  const isHighRisk = !!highRisk?.flagged;

  // ─── Narration script assembler ──────────────────────────────────────────
  const handleNarrate = useCallback(() => {
    if (paused) { resume(); return; }
    const script = buildNarrationScript({
      lang,
      severityLabel: severityLabel(result.triage, lang),
      recommendedAction: result.recommended_action || "",
      warningSign: result.warning_signs || [],
      comparisonTrend: comparison?.trend,
      comparisonReasons: comparison?.reasons,
      previousDate: previousRecord
        ? new Date(previousRecord.created_at).toLocaleDateString([], { dateStyle: "medium" })
        : undefined,
      guidance: simplified ? (simplified as unknown as string) : undefined,
      followUpDate: record?.follow_up?.due_date
        ? new Date(record.follow_up.due_date).toLocaleDateString([], { dateStyle: "medium" })
        : undefined,
    });
    speak(script, lang);
  }, [lang, result, comparison, previousRecord, simplified, record, speaking, paused, speak, resume]);

  async function onSimplify() {
    if (!result) return;
    setSimplified(null);
    setAiSaved(false);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      applyDeterministicFallback();
      return;
    }

    setSimplifying(true);
    try {
      const payload = {
        severity: result.triage,
        urgency: result.urgency,
        recommended_action: result.recommended_action || "Monitor and reassess if symptoms worsen.",
        reasoning: result.reasoning || [],
        warning_signs: result.warning_signs || [],
        explanations: [],
        patient_category: isHighRisk ? "Pregnant (High Risk)" : record?.pregnant ? "Pregnant" : "General",
        language: lang,
      };

      const out = await simplifyExplanation({ data: payload });

      if (out.ok && out.simplified) {
        setSimplified(out.simplified as SimplifiedAI);
        setAiMode("ai");
        saveAiResult(out.simplified as SimplifiedAI, lang);
      } else {
        applyDeterministicFallback();
      }
    } catch (e) {
      applyDeterministicFallback();
    } finally {
      setSimplifying(false);
    }
  }

  function applyDeterministicFallback() {
    const sev = result?.triage;
    const isHindi = lang === "hi";
    const isKannada = lang === "kn";

    const labels = {
      situation: isHindi ? "स्थिति" : isKannada ? "ಪರಿಸ್ಥಿತಿ" : "Situation",
      todo: isHindi ? "अभी क्या करें" : isKannada ? "ಈಗ ಏನು ಮಾಡಬೇಕು" : "What To Do Now",
      watch: isHindi ? "ध्यान से देखें" : isKannada ? "ಗಮನಿಸಿ" : "Watch Carefully",
      followup: isHindi ? "अनुवर्ती कार्रवाई" : isKannada ? "ಮುಂದಿನ ಭೇಟಿ" : "Follow-up",
    };

    let situation = "The health assessment has been completed. Based on the information provided, our clinical system has determined the appropriate level of care.";
    if (sev === "Emergency") situation = "The assessment has identified signs that require immediate medical attention. Please act quickly and stay calm — help is available.";
    if (sev === "PHC Referral") situation = "The assessment suggests that a visit to the Primary Health Centre would be beneficial. The health worker will guide you through the next steps.";

    const todo = result?.recommended_action || "Please follow the guidance provided by your health worker.";
    const warningLines = (result?.warning_signs || []).map(w => `• ${w}`).join("\n");
    const followup = isHindi ? "यदि लक्षण बिगड़ते हैं, तो तुरंत नज़दीकी स्वास्थ्य केंद्र से संपर्क करें।" :
      isKannada ? "ಲಕ್ಷಣಗಳು ಉಲ್ಬಣಗೊಂಡರೆ ತಕ್ಷಣ ಸ್ಥಳೀಯ ಆರೋಗ್ಯ ಕೇಂದ್ರವನ್ನು ಸಂಪರ್ಕಿಸಿ." :
      "If symptoms worsen at any time, contact your nearest health facility immediately. Your health worker will schedule a follow-up check.";

    const narrative = `[${labels.situation}]\n${situation}\n\n[${labels.todo}]\n${todo}\n\n[${labels.watch}]\n${warningLines || "Monitor for any new or worsening symptoms."}\n\n[${labels.followup}]\n${followup}`;

    setSimplified(narrative as unknown as SimplifiedAI);
    setAiMode("fallback");
    saveAiResult(narrative as unknown as SimplifiedAI, lang);
  }

  async function saveAiResult(payload: SimplifiedAI, modeLang: import("@/i18n/dict").Lang) {
    if (!result) return;
    try {
      const all = await listAssessments();
      const match = all.find((a) => a.result?.timestamp === result.timestamp);
      if (match?.id != null) {
        await updateAssessment(match.id, { ai_simplified: { lang: modeLang, payload } });
        setAiSaved(true);
      }
    } catch {}
  }

  return (
    <AppShell>
      <div className="space-y-12 pb-24 sm:pb-8 animate-fade-in relative z-10 max-w-4xl mx-auto">
        
        <div className="flex items-center justify-between print:hidden">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors min-h-[44px] px-2 -ml-2">
            <ArrowLeft className="size-4" /> {t(lang, "back")}
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { if (result && input) downloadTriageSlip({ input, result, record, lang }); window.print(); }}
              className="h-[54px] px-6 rounded-2xl bg-white border border-slate-200 text-slate-600 text-[15px] font-bold shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:shadow-[0_6px_16px_rgba(15,23,42,0.06)] hover:-translate-y-[2px] hover:text-[#1E293B] transition-all duration-200 ease-out flex items-center justify-center gap-2"
            >
              <Printer className="size-4" /> {t(lang, "result_print")}
            </button>
          </div>
        </div>

        {/* ─── SECTION 1: HERO SEVERITY EXPERIENCE ──────────────────────── */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`relative overflow-hidden rounded-[2rem] p-8 sm:p-12 shadow-[0_8px_24px_rgba(15,23,42,0.04)] print:shadow-none print:border-black print:rounded-none ${
            isEmergency 
              ? "bg-gradient-to-b from-[#FEF2F2] to-[#FEE2E2] border border-[#FECACA] text-[#991B1B]" 
              : isPHC 
                ? "bg-gradient-to-b from-[#FEFCE8] to-[#FEF3C7] border border-[#FDE68A] text-[#92400E]"
                : "bg-gradient-to-b from-[#ECFDF5] to-[#DDF8EE] border border-[#BBF7D0] text-[#065F46]"
          }`}
        >
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border ${
              isEmergency ? "bg-white/80 border-[#FECACA] text-[#991B1B]" : 
              isPHC ? "bg-white/80 border-[#FDE68A] text-[#92400E]" : 
              "bg-white/80 border-[#BBF7D0] text-[#065F46]"
            }`}>
              <Activity className="size-3.5" /> {result.urgency}
            </div>
            
            <h1 className="text-[56px] sm:text-[64px] font-extrabold tracking-tight leading-[1.1] mb-6">
              {severityLabel(result.triage, lang)}
            </h1>
            
            <p className="text-[20px] sm:text-[22px] font-medium opacity-90 max-w-2xl leading-relaxed">
              {result.recommended_action}
            </p>
          </div>
        </motion.div>

        {/* ─── CONTINUITY COMPARISON PANEL ──────────────────────────────── */}
        <AnimatePresence>
          {comparison && previousRecord && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className={`rounded-[22px] border p-6 sm:p-8 shadow-[0_8px_24px_rgba(15,23,42,0.04)] ${
                comparison.trend === "improving"
                  ? "bg-[#F0FBF8] border-[#0F8B8D]/20"
                  : comparison.trend === "worsening"
                  ? "bg-[#FFF5F5] border-red-200/60"
                  : "bg-slate-50/60 border-slate-200/60"
              }`}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className={`p-2.5 rounded-xl ${
                  comparison.trend === "improving" ? "bg-[#0F8B8D]/10 text-[#0F8B8D]" :
                  comparison.trend === "worsening" ? "bg-red-100 text-red-600" :
                  "bg-slate-200/60 text-slate-500"
                }`}>
                  {comparison.trend === "improving" ? <TrendingDown className="size-5" /> :
                   comparison.trend === "worsening" ? <TrendingUp className="size-5" /> :
                   <Minus className="size-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#1E293B]">{t(lang, "result_progression_intel")}</h3>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      comparison.trend === "improving" ? "bg-[#0F8B8D]/10 text-[#0F8B8D]" :
                      comparison.trend === "worsening" ? "bg-red-100 text-red-600" :
                      "bg-slate-200 text-slate-500"
                    }`}>
                      {comparison.trend === "improving" ? t(lang, "timeline_improving") :
                       comparison.trend === "worsening" ? t(lang, "timeline_worsening") : t(lang, "timeline_stable")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <History className="size-3" />
                    {t(lang, "result_compared_to")} {new Date(previousRecord.created_at).toLocaleDateString([], { dateStyle: "medium" })}
                  </p>
                </div>
              </div>

              {/* Comparison Reasons */}
              <div className="space-y-2">
                {comparison.reasons.map((reason, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    className={`flex items-start gap-3 p-3 rounded-[14px] text-sm font-medium ${
                      comparison.trend === "improving" ? "bg-[#0F8B8D]/5 text-[#1E293B]" :
                      comparison.trend === "worsening" ? "bg-red-50 text-[#1E293B]" :
                      "bg-white/80 text-[#1E293B]"
                    }`}
                  >
                    <div className={`size-1.5 rounded-full shrink-0 mt-1.5 ${
                      comparison.trend === "improving" ? "bg-[#0F8B8D]" :
                      comparison.trend === "worsening" ? "bg-red-500" :
                      "bg-slate-400"
                    }`} />
                    {reason}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── REFERRAL READINESS CARD (PHC/Emergency Only) ─────────────── */}
        {(isEmergency || isPHC) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-[22px] bg-white/86 border border-slate-200/70 p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
          >
            <div className={`p-4 rounded-full ${isEmergency ? "bg-severity-emergency/10 text-severity-emergency" : "bg-severity-phc/10 text-severity-phc"}`}>
              <ShieldAlert className="size-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-foreground mb-1">{t(lang, "result_referral_readiness")}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {isEmergency ? t(lang, "result_referral_emergency") : t(lang, "result_referral_phc")}
              </p>
            </div>
          </motion.div>
        )}

        {/* ─── HIGH RISK PREGNANCY WARNING ─────────────────────────────── */}
        {isHighRisk && (
          <div className="rounded-[22px] border border-slate-200/50 border-l-4 border-l-[#B91C1C] bg-[#FFF5F5] p-6 sm:p-8 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-severity-emergency/20 rounded-full">
                <HeartPulse className="size-6 text-severity-emergency" />
              </div>
              <div className="flex-1">
                <div className="text-lg font-bold text-severity-emergency tracking-wide mb-1">
                  {t(lang, "high_risk_pregnancy")}
                </div>
                <div className="text-sm font-semibold text-foreground mb-4">
                  {t(lang, "maternal_risk_warning")}
                </div>
                <ul className="space-y-2 mb-6">
                  {(highRisk?.reasons ?? []).map((rk) => (
                    <li key={rk} className="flex gap-3 text-sm text-foreground/90 bg-card/50 p-3 rounded-xl border border-border/50">
                      <AlertTriangle className="size-4 text-severity-emergency shrink-0 mt-0.5" />
                      <span className="font-medium">{t(lang, rk as Parameters<typeof t>[1])}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ─── AI COMMUNICATION PANEL REBUILD ──────────────────────────── */}
        <div className="pt-12 border-t-[3px] border-slate-200/40 print:hidden">
          {/* ── Narration Bar ── */}
          <div className="mb-6">
            <NarrationBar
              lang={lang}
              speaking={speaking}
              paused={paused}
              isSupported={isSupported}
              onPlay={handleNarrate}
              onPause={pause}
              onStop={stop}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Sparkles className="size-6 text-primary" /> {t(lang, "result_healthcare_guidance")}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">{t(lang, "result_guidance_subtitle")}</p>
            </div>
            
            {!simplified && (
              <button
                onClick={onSimplify}
                disabled={simplifying}
                className="h-[54px] px-[30px] rounded-2xl bg-[#0F8B8D] text-white text-[15px] font-bold shadow-[0_12px_24px_rgba(15,139,141,0.20)] hover:shadow-[0_16px_32px_rgba(15,139,141,0.25)] hover:-translate-y-[2px] transition-all duration-200 ease-out flex items-center justify-center gap-2 disabled:opacity-80 disabled:hover:translate-y-0 disabled:hover:shadow-[0_12px_24px_rgba(15,139,141,0.20)]"
              >
                {simplifying ? (
                  <><div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t(lang, "result_generating")}</>
                ) : (
                  <><Sparkles className="size-4" /> {t(lang, "result_generate_guidance")}</>
                )}
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {simplified && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {aiMode === "fallback" && (
                  <div className="px-4 py-3 rounded-xl bg-muted/60 border border-border flex items-center gap-3 text-sm font-bold text-foreground w-fit shadow-sm">
                    <WifiOff className="size-4 opacity-70" /> {t(lang, "result_offline_guidance")}
                  </div>
                )}
                <EditorialNarrativeRenderer text={simplified as unknown as string} isEmergency={isEmergency} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── FOLLOW-UP / CARE CONTINUITY ─────────────────────────────── */}
        <div className="pt-12 border-t-[3px] border-slate-200/40">
          <FollowUpPlanner recordId={record?.id ?? null} severity={result.triage} highRisk={isHighRisk} />
        </div>

      </div>
    </AppShell>
  );
}
