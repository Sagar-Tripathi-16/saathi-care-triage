import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/store/app";
import { t } from "@/i18n/dict";
import { severityClasses, severityLabel } from "@/lib/severity";
import { listAssessments, type AssessmentRecord } from "@/storage/db";
import type { Severity } from "@/engine/types";
import {
  Calendar, HeartPulse, ShieldAlert, ListChecks, Filter, Clock, ArrowRight, User, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/queue")({
  head: () => ({
    meta: [
      { title: "Continuity Workspace — Arogya Saathi" },
      { name: "description", content: "Priority continuity cases requiring immediate action." },
    ],
  }),
  component: QueuePage,
});

const SEVERITIES: Severity[] = ["Emergency", "PHC Referral", "Home Care"];
const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function relativeTime(ts: number): string {
  const diff = Math.max(0, Date.now() - ts);
  const hrs = Math.floor(diff / (1000 * 60 * 60));
  if (hrs < 24) return hrs === 0 ? "Just now" : `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function priorityScore(rec: AssessmentRecord, now: number): number {
  const sev = rec.severity as Severity;
  const isHR = !!rec.high_risk_pregnancy?.flagged;
  const isResolved = !!rec.follow_up_completed_at;
  const fu = !rec.follow_up_completed_at && rec.follow_up;
  const due = fu ? startOfDay(fu.due_date) : Infinity;
  const today = startOfDay(now);

  if (isHR && sev === "Emergency" && !isResolved) return 0;
  if (sev === "Emergency" && !isResolved) return 1;
  if (fu && due < today) return 2;                      // overdue follow-up
  if (isHR && sev === "PHC Referral" && !isResolved) return 3; 
  if (sev === "PHC Referral" && !isResolved) return 4;
  if (fu && due === today) return 5;
  if (isHR && !isResolved) return 6;                   // active unresolved HR (Home Care)
  if (fu) return 7;
  return 8;
}

function QueuePage() {
  const lang = useApp((s) => s.lang);
  const filters = useApp((s) => s.queueFilters);
  const setFilters = useApp((s) => s.setQueueFilters);
  const setLast = useApp((s) => s.setLast);
  const navigate = useNavigate();

  const [items, setItems] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [railTarget, setRailTarget] = useState<HTMLElement | null>(null);
  
  const now = Date.now();
  const todayStart = startOfDay(now);

  useEffect(() => {
    setRailTarget(document.getElementById("intelligence-rail-target"));
    listAssessments().then((res) => {
      setItems(res);
      setLoading(false);
    });
  }, []);

  const active = useMemo(() => {
    // Only get active items (within 14 days, unresolved)
    const activeItems = items.filter(r => !r.follow_up_completed_at && (now - r.created_at) < FOURTEEN_DAYS);
    
    // Group by patient to avoid duplicates
    const patientMap = new Map<string, AssessmentRecord>();
    for (const r of activeItems) {
      const key = `${r.patient_name.toLowerCase()}_${r.age}`;
      if (!patientMap.has(key)) patientMap.set(key, r);
    }
    const uniqueActive = Array.from(patientMap.values());

    const filterByUI = uniqueActive.filter((r) => {
      if (filters.severities.length > 0 && !filters.severities.includes(r.severity as Severity)) return false;
      if (filters.pendingFollowUpOnly && !(r.follow_up && !r.follow_up_completed_at)) return false;
      if (filters.highRiskOnly && !r.high_risk_pregnancy?.flagged) return false;
      return true;
    });

    return filterByUI.sort((a, b) => {
      const pa = priorityScore(a, now);
      const pb = priorityScore(b, now);
      if (pa !== pb) return pa - pb;
      return b.created_at - a.created_at;
    });
  }, [items, filters, now]);

  function toggleSeverity(s: Severity) {
    const next = filters.severities.includes(s)
      ? filters.severities.filter((x) => x !== s)
      : [...filters.severities, s];
    setFilters({ severities: next });
  }

  function onOpen(rec: AssessmentRecord) {
    setLast(rec.input, rec.result, rec.id ?? null);
    navigate({ to: "/result" });
  }

  const ContinuityCard = ({ rec }: { rec: AssessmentRecord }) => {
    const isEmergency = rec.severity === "Emergency";
    const isPHC = rec.severity === "PHC Referral";
    const isOverdue = rec.follow_up && startOfDay(rec.follow_up.due_date) < todayStart;
    const isDueToday = rec.follow_up && startOfDay(rec.follow_up.due_date) === todayStart;

    let nextAction = t(lang, "queue_review_patient");
    if (isEmergency) nextAction = t(lang, "queue_verify_emergency_ref");
    else if (isPHC) nextAction = t(lang, "queue_check_phc_status");
    else if (rec.follow_up?.revisit_reason) nextAction = `${t(lang, "start_revisit")}: ${t(lang, rec.follow_up.revisit_reason as any)}`;

    return (
      <div className="group relative bg-white/86 border border-slate-200/70 rounded-[22px] p-6 sm:p-8 shadow-[0_8px_24px_rgba(15,23,42,0.04)] hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)] hover:-translate-y-[2px] transition-all duration-200 ease-out backdrop-blur-md">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-[22px] pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
          <div className="flex gap-4">
            <div className={`size-12 rounded-full flex items-center justify-center shrink-0 border-2 ${
              isEmergency ? 'bg-severity-emergency/10 border-severity-emergency/30 text-severity-emergency' :
              isPHC ? 'bg-severity-phc/10 border-severity-phc/30 text-severity-phc' :
              isOverdue ? 'bg-severity-emergency/10 border-severity-emergency/30 text-severity-emergency' :
              'bg-primary/10 border-primary/30 text-primary'
            }`}>
              <User className="size-6" />
            </div>
            
            <div>
              <div className="font-bold text-lg text-foreground flex items-center gap-2 mb-1">
                {rec.patient_name !== "—" ? rec.patient_name : "Unknown Patient"}
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {rec.age}y
                </span>
                {rec.high_risk_pregnancy?.flagged && (
                  <HeartPulse className="size-4 text-severity-emergency" />
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium flex-wrap">
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                  isEmergency ? 'bg-severity-emergency text-severity-emergency-foreground' : 
                  isPHC ? 'bg-severity-phc text-severity-phc-foreground' : 
                  'bg-muted text-muted-foreground'
                }`}>
                  {rec.severity}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" /> Assessed {relativeTime(rec.created_at)}
                </span>
              </div>

              <div className="mt-4 p-3 bg-muted/30 border border-border/50 rounded-xl">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-1 flex items-center gap-1.5">
                  <ArrowRight className="size-3.5" /> {t(lang, "queue_next_action")}
                </div>
                <div className="text-sm font-semibold text-foreground/90 flex justify-between items-center">
                  <span>{nextAction}</span>
                  {(isOverdue || isDueToday) && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${
                      isOverdue ? 'bg-severity-emergency/20 text-severity-emergency' : 'bg-primary/20 text-primary'
                    }`}>
                      {isOverdue ? 'Overdue' : 'Due Today'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex sm:flex-col gap-2 mt-2 sm:mt-0">
            <button 
              onClick={() => onOpen(rec)}
              className="flex-1 sm:flex-none h-[54px] px-[30px] rounded-2xl bg-[#0F8B8D] text-white text-[15px] font-bold shadow-[0_12px_24px_rgba(15,139,141,0.20)] hover:shadow-[0_16px_32px_rgba(15,139,141,0.25)] hover:-translate-y-[2px] transition-all duration-200 ease-out"
            >
              {t(lang, "queue_action_case")}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AppShell>
      <div className="space-y-8 pb-24 sm:pb-8 animate-fade-in max-w-4xl mx-auto">
        <div className="flex items-center gap-3 border-b border-border/40 pb-4">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <ListChecks className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Continuity Workspace</h1>
            <p className="text-sm text-muted-foreground">Priority cases requiring immediate operational action.</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-[22px] p-6 mb-10 shadow-[0_8px_32px_rgba(15,23,42,0.04)] sticky top-4 z-20 print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/80 mb-4">
            <Filter className="size-3.5" /> Workspace Filters
          </div>
          <div className="flex flex-wrap gap-2.5 mb-4">
            <button
              onClick={() => setFilters({ severities: [] })}
              className={`h-10 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ease-out shadow-sm ${
                filters.severities.length === 0
                  ? "bg-[#E8F7F5] border-[1.5px] border-[#0F8B8D] text-[#0F8B8D] shadow-[0_4px_10px_rgba(15,139,141,0.10)]"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:-translate-y-[2px]"
              }`}
            >
              All Severities
            </button>
            {SEVERITIES.map((s) => {
              const on = filters.severities.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggleSeverity(s)}
                  className={`h-10 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ease-out shadow-sm ${
                    on 
                      ? s === 'Emergency' ? 'bg-severity-emergency text-white border-[1.5px] border-severity-emergency shadow-[0_4px_10px_hsl(var(--severity-emergency)/0.2)]' :
                        s === 'PHC Referral' ? 'bg-severity-phc text-white border-[1.5px] border-severity-phc shadow-[0_4px_10px_hsl(var(--severity-phc)/0.2)]' :
                        'bg-severity-home text-white border-[1.5px] border-severity-home shadow-[0_4px_10px_hsl(var(--severity-home)/0.2)]'
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:-translate-y-[2px]"
                  }`}
                >
                  {severityLabel(s, lang)}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-4 pt-4 border-t border-border/50">
            <label className="inline-flex items-center gap-2 text-sm font-semibold cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input type="checkbox" checked={filters.pendingFollowUpOnly} onChange={(e) => setFilters({ pendingFollowUpOnly: e.target.checked })} className="peer sr-only" />
                <div className="size-5 rounded-md border-[1.5px] border-slate-300 peer-checked:bg-[#0F8B8D] peer-checked:border-[#0F8B8D] transition-all" />
                <div className="absolute opacity-0 peer-checked:opacity-100 text-white pointer-events-none">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2.5 6 5.5 9 10 3" /></svg>
                </div>
              </div>
              <Calendar className="size-4 text-primary" /> Follow-up Required
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-semibold cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input type="checkbox" checked={filters.highRiskOnly} onChange={(e) => setFilters({ highRiskOnly: e.target.checked })} className="peer sr-only" />
                <div className="size-5 rounded-md border-[1.5px] border-slate-300 peer-checked:bg-[#B91C1C] peer-checked:border-[#B91C1C] transition-all" />
                <div className="absolute opacity-0 peer-checked:opacity-100 text-white pointer-events-none">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2.5 6 5.5 9 10 3" /></svg>
                </div>
              </div>
              <HeartPulse className="size-4 text-severity-emergency" /> High Risk Maternal
            </label>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0.3 }}
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                className="h-36 bg-gradient-to-r from-card/30 via-muted/30 to-card/30 rounded-[1.5rem] border border-border/40 backdrop-blur-sm shadow-sm"
              />
            ))}
          </div>
        ) : active.length === 0 ? (
          <div className="text-center py-20 border border-slate-200/50 rounded-[32px] bg-slate-50/50 shadow-[0_4px_14px_rgba(15,23,42,0.02)]">
            <ListChecks className="size-12 text-slate-300 mx-auto mb-5" />
            <h3 className="font-bold text-[#1E293B] text-xl mb-2">No pending tasks</h3>
            <p className="text-base text-slate-500 max-w-sm mx-auto">There are no urgent continuity tasks pending at this time.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {active.map((rec) => <ContinuityCard key={rec.id} rec={rec} />)}
          </div>
        )}
      </div>

      {railTarget && createPortal(
        <AnimatePresence mode="popLayout">
          {!loading && (
            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="p-6 flex flex-col h-full overflow-y-auto"
            >
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-5 flex items-center gap-2">
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0F8B8D] opacity-30"></span>
                  <span className="relative inline-flex rounded-full size-2 bg-[#0F8B8D]/70"></span>
                </span>
                Workspace Intel
              </h3>

              <div className="space-y-4">
                <div className="p-5 rounded-[22px] bg-[#DDF8EE] border border-[#BBF7D0] shadow-[0_4px_12px_rgba(15,23,42,0.02)] text-[#065F46]">
                  <div className="text-[10px] font-bold uppercase tracking-[0.1em] mb-1.5 opacity-70">Actionable Cases</div>
                  <div className="text-3xl font-black tracking-tight leading-none">
                    {active.length}
                  </div>
                  <div className="text-xs font-semibold mt-1.5 opacity-80">
                    {active.length === 0 ? "No pending tasks" : "Requiring clinical action"}
                  </div>
                </div>

                {active.some(r => r.severity === 'Emergency') && (
                  <div className="p-5 rounded-[22px] border border-[#FECACA] bg-[#FEE2E2] text-[#991B1B] shadow-[0_4px_12px_rgba(15,23,42,0.02)]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <AlertTriangle className="size-4" />
                      <div className="text-[10px] font-bold uppercase tracking-[0.1em]">Unresolved Emergencies</div>
                    </div>
                    <div className="text-2xl font-black tracking-tight">
                      {active.filter(r => r.severity === 'Emergency').length} Cases
                    </div>
                  </div>
                )}

                <div className="p-3.5 bg-[#F8FAFC] border border-slate-200/60 rounded-[14px] shadow-[0_2px_8px_rgba(15,23,42,0.02)]">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="size-4 shrink-0 mt-0.5 text-[#0F8B8D]" />
                    <div className="text-xs font-semibold text-slate-600 leading-relaxed">
                      {active.length === 0
                        ? "No escalation indicators detected. Continuity monitoring nominal."
                        : active.some(r => r.severity === 'Emergency')
                        ? "High escalation indicators present. Immediate clinical review required."
                        : "Continuity follow-up monitoring in progress."}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        railTarget
      )}
    </AppShell>
  );
}
