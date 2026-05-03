import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/store/app";
import { t } from "@/i18n/dict";
import { clearAssessments, listAssessments, type AssessmentRecord } from "@/storage/db";
import { SEVERITY_LEVEL } from "@/engine/classifier";
import type { Severity } from "@/engine/types";
import {
  Trash2, RotateCcw, Activity, Calendar, HeartPulse, User, MapPin, 
  ChevronRight, ArrowRight, ArrowDownRight, ArrowUpRight, CheckCircle2, ShieldCheck, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Patient Journeys — Arogya Saathi" },
      { name: "description", content: "Longitudinal patient care histories and assessment progression." },
    ],
  }),
  component: HistoryPage,
});

function formatTime(ts: number) {
  return new Date(ts).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
}

function HistoryPage() {
  const lang = useApp((s) => s.lang);
  const setLast = useApp((s) => s.setLast);
  const setPendingPreviousId = useApp((s) => s.setPendingPreviousId);
  const navigate = useNavigate();
  
  const [items, setItems] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const res = await listAssessments();
    setItems(res);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const patientJourneys = useMemo(() => {
    const journeys = new Map<string, AssessmentRecord[]>();
    for (const r of items) {
      const key = `${r.patient_name.toLowerCase()}_${r.age}`;
      if (!journeys.has(key)) journeys.set(key, []);
      journeys.get(key)!.push(r);
    }
    // Sort each journey oldest to newest internally
    const sortedJourneys = Array.from(journeys.values()).map(journey => 
      journey.sort((a,b) => a.created_at - b.created_at)
    );
    // Sort all journeys by the latest assessment descending
    return sortedJourneys.sort((a,b) => b[b.length-1].created_at - a[a.length-1].created_at);
  }, [items]);

  async function onClear() {
    if (typeof window !== "undefined" && !window.confirm(t(lang, "confirm_clear"))) return;
    await clearAssessments();
    refresh();
  }

  function onReopen(rec: AssessmentRecord) {
    setLast(rec.input, rec.result, rec.id ?? null);
    navigate({ to: "/result" });
  }

  function onStartRevisit(rec: AssessmentRecord) {
    if (rec.id != null) setPendingPreviousId(rec.id);
    navigate({ to: "/" });
  }

  const PatientTimeline = ({ journey }: { journey: AssessmentRecord[] }) => {
    const latest = journey[journey.length - 1];
    const isHR = !!latest.high_risk_pregnancy?.flagged;

    return (
      <div className="bg-white/86 backdrop-blur-md border border-slate-200/70 rounded-[22px] p-6 sm:p-8 shadow-[0_8px_24px_rgba(15,23,42,0.04)] print:break-inside-avoid print:border-black print:shadow-none mb-8">
        {/* Patient Header */}
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-border/50">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <User className="size-6" />
            </div>
            <div>
              <div className="font-bold text-xl text-foreground flex items-center gap-2">
                {latest.patient_name !== "—" ? latest.patient_name : t(lang, "history_unknown_patient")}
                <span className="text-sm font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {latest.age}y
                </span>
                {isHR && <HeartPulse className="size-5 text-severity-emergency" />}
              </div>
              <div className="text-sm text-muted-foreground font-medium flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1"><MapPin className="size-3.5" /> {latest.category}</span>
                <span>•</span>
                <span>{journey.length} {t(lang, "history_assessments")}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => onStartRevisit(latest)}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-sm font-bold transition-colors print:hidden"
          >
            <RotateCcw className="size-4" /> {t(lang, "history_start_reassessment")}
          </button>
        </div>

        {/* Timeline */}
        <div className="relative pl-6 sm:pl-8 space-y-10 before:absolute before:inset-0 before:ml-6 sm:before:ml-8 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[3px] before:bg-slate-200">
          {journey.map((rec, i) => {
            const isFirst = i === 0;
            const prev = isFirst ? null : journey[i - 1];
            
            let TrendIcon = ArrowRight;
            let trendColor = "text-muted-foreground";
            if (prev) {
              const curLevel = SEVERITY_LEVEL[rec.severity as Severity] ?? 0;
              const prevLevel = SEVERITY_LEVEL[prev.severity as Severity] ?? 0;
              if (curLevel > prevLevel) { TrendIcon = ArrowUpRight; trendColor = "text-severity-emergency"; }
              else if (curLevel < prevLevel) { TrendIcon = ArrowDownRight; trendColor = "text-severity-home"; }
            }

            const isEmergency = rec.severity === "Emergency";
            const isPHC = rec.severity === "PHC Referral";
            
            return (
              <div key={rec.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className={`absolute left-0 sm:left-0 size-4 rounded-full border-[3px] border-white -translate-x-[6.5px] z-10 ${
                  isEmergency ? 'bg-severity-emergency shadow-[0_0_12px_rgba(239,68,68,0.5)]' : isPHC ? 'bg-severity-phc shadow-[0_0_12px_rgba(245,158,11,0.5)]' : 'bg-[#0F8B8D] shadow-[0_0_12px_rgba(15,139,141,0.5)]'
                }`} />
                
                <button 
                  onClick={() => onReopen(rec)}
                  className="w-full text-left bg-white border border-slate-200/60 rounded-[18px] p-5 ml-6 sm:ml-8 shadow-[0_4px_14px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)] hover:-translate-y-[2px] transition-all duration-200 ease-out group-hover:border-[#0F8B8D]/30 print:border-black/20 print:ml-0 print:pl-8"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                        isEmergency ? 'bg-severity-emergency text-severity-emergency-foreground' : 
                        isPHC ? 'bg-severity-phc text-severity-phc-foreground' : 
                        'bg-severity-home text-severity-home-foreground'
                      }`}>
                        {rec.severity}
                      </span>
                      {!isFirst && (
                        <div className={`flex items-center gap-1 text-[11px] font-bold uppercase ${trendColor}`}>
                          <TrendIcon className="size-3" />
                        </div>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Clock className="size-3.5" /> {formatTime(rec.created_at)}
                    </div>
                  </div>
                  
                  <div className="text-sm font-medium text-foreground/90 leading-relaxed mb-3">
                    {rec.result.recommended_action}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {rec.triggered_rules.slice(0, 2).map((rule, idx) => (
                      <span key={idx} className="text-[10px] font-semibold text-muted-foreground bg-card border border-border/60 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                        {rule}
                      </span>
                    ))}
                    {rec.triggered_rules.length > 2 && (
                      <span className="text-[10px] font-semibold text-muted-foreground bg-card border border-border/60 px-2 py-0.5 rounded-md">
                        +{rec.triggered_rules.length - 2} more
                      </span>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
        
        {/* Mobile action button */}
        <button 
          onClick={() => onStartRevisit(latest)}
          className="mt-6 w-full sm:hidden flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-muted text-foreground text-sm font-bold print:hidden"
        >
          <RotateCcw className="size-4" /> {t(lang, "history_start_reassessment")}
        </button>
      </div>
    );
  };

  return (
    <AppShell>
      <div className="space-y-8 pb-24 sm:pb-8 animate-fade-in max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <Activity className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Patient Journeys</h1>
              <p className="text-sm text-muted-foreground">Longitudinal care histories and progression.</p>
            </div>
          </div>
          {items.length > 0 && (
            <button
              onClick={onClear}
              className="px-4 py-2 rounded-xl text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors"
            >
              Clear Device History
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-8">
            {Array.from({ length: 2 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0.3 }}
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                className="h-56 bg-gradient-to-r from-card/30 via-muted/30 to-card/30 rounded-[1.5rem] border border-border/40 backdrop-blur-sm shadow-sm"
              />
            ))}
          </div>
        ) : patientJourneys.length === 0 ? (
          <div className="text-center py-20 border border-slate-200/50 rounded-[32px] bg-slate-50/50 print:hidden shadow-[0_4px_14px_rgba(15,23,42,0.02)]">
            <ShieldCheck className="size-12 text-slate-300 mx-auto mb-5" />
            <h3 className="font-bold text-[#1E293B] text-xl mb-2">{t(lang, "history_no_records")}</h3>
            <p className="text-base text-slate-500 max-w-sm mx-auto">{t(lang, "history_no_records_desc")}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {patientJourneys.map((journey, i) => (
              <PatientTimeline key={i} journey={journey} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
