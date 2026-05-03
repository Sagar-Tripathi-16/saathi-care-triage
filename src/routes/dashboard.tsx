import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/store/app";
import { t } from "@/i18n/dict";
import { listAssessments, type AssessmentRecord } from "@/storage/db";
import {
  Activity, AlertTriangle, Calendar, Clock, LayoutDashboard, CheckCircle2, ChevronRight, User, HeartPulse, ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Arogya Saathi" },
      { name: "description", content: "Operational overview of triage assessments and active care continuity." },
    ],
  }),
  component: DashboardPage,
});

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function relativeTime(ts: number, lang: import("@/i18n/dict").Lang): string {
  const diff = Math.max(0, Date.now() - ts);
  const hrs = Math.floor(diff / (1000 * 60 * 60));
  if (hrs < 24) return hrs === 0 ? t(lang, "time_just_now") : t(lang, "time_h_ago").replace("%n", String(hrs));
  return t(lang, "time_d_ago").replace("%n", String(Math.floor(hrs / 24)));
}

function DashboardPage() {
  const lang = useApp((s) => s.lang);
  const navigate = useNavigate();
  const setLast = useApp((s) => s.setLast);
  
  const [items, setItems] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [railTarget, setRailTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setRailTarget(document.getElementById("intelligence-rail-target"));
    listAssessments().then((res) => { setItems(res); setLoading(false); });
  }, []);

  const now = Date.now();
  const todayStart = startOfDay(now);

  const { 
    needsReassessment, 
    awaitingReferral, 
    stableMonitoring, 
    highRiskActive,
    gridMetrics 
  } = useMemo(() => {
    const active = items.filter(r => !r.follow_up_completed_at && (now - r.created_at) < 14 * 24 * 60 * 60 * 1000);
    
    // Group only the MOST RECENT assessment per patient to avoid duplicates in the active states
    const patientMap = new Map<string, AssessmentRecord>();
    for (const r of active) {
      const key = `${r.patient_name.toLowerCase()}_${r.age}`;
      if (!patientMap.has(key)) patientMap.set(key, r);
    }
    const uniqueActive = Array.from(patientMap.values());

    const needsReassessment: AssessmentRecord[] = [];
    const awaitingReferral: AssessmentRecord[] = [];
    const stableMonitoring: AssessmentRecord[] = [];
    const highRiskActive: AssessmentRecord[] = [];

    for (const rec of uniqueActive) {
      if (rec.high_risk_pregnancy?.flagged) {
        highRiskActive.push(rec);
      }
      
      const fu = rec.follow_up;
      if (fu) {
        if (startOfDay(fu.due_date) <= todayStart) {
          needsReassessment.push(rec);
        } else {
          stableMonitoring.push(rec);
        }
      } else if (rec.severity === "Emergency" || rec.severity === "PHC Referral") {
        awaitingReferral.push(rec);
      }
    }

    const emergencyCases = uniqueActive.filter(r => r.severity === "Emergency");
    const phcReferrals = uniqueActive.filter(r => r.severity === "PHC Referral");
    const homeCare = uniqueActive.filter(r => r.severity === "Home Care");
    const recentlyResolved = items.filter(r => r.follow_up_completed_at && (now - r.created_at) < 7 * 24 * 60 * 60 * 1000);
    const activeEscalations = emergencyCases.filter(r => !r.follow_up);
    const improvingPatients = stableMonitoring.filter(r => r.severity !== "Emergency");

    return { 
      needsReassessment: needsReassessment.sort((a,b) => (a.follow_up?.due_date ?? 0) - (b.follow_up?.due_date ?? 0)),
      awaitingReferral: awaitingReferral.sort((a,b) => b.created_at - a.created_at),
      stableMonitoring: stableMonitoring.sort((a,b) => (a.follow_up?.due_date ?? 0) - (b.follow_up?.due_date ?? 0)),
      highRiskActive,
      gridMetrics: {
        emergency: emergencyCases.length,
        phc: phcReferrals.length,
        homeCare: homeCare.length,
        improving: improvingPatients.length,
        reassessments: needsReassessment.length,
        escalations: activeEscalations.length,
        awaiting: awaitingReferral.length,
        resolved: recentlyResolved.length
      }
    };
  }, [items, now, todayStart]);

  function onOpen(rec: AssessmentRecord) {
    setLast(rec.input, rec.result, rec.id ?? null);
    navigate({ to: "/result" });
  }

  const StateCard = ({ rec, type }: { rec: AssessmentRecord, type: 'reassess' | 'referral' | 'stable' }) => {
    const isOverdue = type === 'reassess' && rec.follow_up && startOfDay(rec.follow_up.due_date) < todayStart;
    
    return (
      <motion.button 
        variants={{
          hidden: { opacity: 0, y: 15, scale: 0.98 },
          show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 400, damping: 30 } }
        }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onOpen(rec)}
        className="w-full text-left p-6 rounded-[22px] bg-white/86 backdrop-blur-md border border-slate-200/70 hover:bg-white hover:border-[#0F8B8D]/30 transition-all duration-200 ease-out flex items-center justify-between group shadow-[0_8px_24px_rgba(15,23,42,0.04)] hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)]"
      >
        <div className="flex items-center gap-4">
          <div className={`size-12 rounded-full flex items-center justify-center shrink-0 ${
            type === 'referral' ? 'bg-severity-phc/10 text-severity-phc ring-1 ring-severity-phc/20' :
            isOverdue ? 'bg-severity-emergency/10 text-severity-emergency ring-1 ring-severity-emergency/20' :
            'bg-primary/10 text-primary ring-1 ring-primary/20'
          }`}>
            <User className="size-6" />
          </div>
          <div>
            <div className="font-bold text-foreground text-lg flex items-center gap-2">
              {rec.patient_name !== "—" ? rec.patient_name : "Unknown Patient"}
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {rec.age}y
              </span>
            </div>
            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-md text-xs font-medium">
                <Clock className="size-3" /> {relativeTime(rec.created_at, lang)}
              </span>
              <span>•</span>
              <span className="font-semibold">{rec.severity}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {type === 'reassess' && (
            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${isOverdue ? 'bg-severity-emergency/15 text-severity-emergency border border-severity-emergency/20 shadow-[0_0_10px_rgba(255,0,0,0.1)]' : 'bg-primary/15 text-primary border border-primary/20'}`}>
              {isOverdue ? t(lang, "dash_overdue_badge").toUpperCase() : t(lang, "dash_due_today_badge").toUpperCase()}
            </span>
          )}
          {type === 'referral' && (
            <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-severity-phc/15 text-severity-phc border border-severity-phc/20">
              {t(lang, "dash_pending_badge").toUpperCase()}
            </span>
          )}
          <div className="size-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <ChevronRight className="size-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
          </div>
        </div>
      </motion.button>
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.05 }
    }
  };

  const gridCardVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 400, damping: 30 } }
  };

  return (
    <AppShell>
      <div className="pb-24 sm:pb-8 max-w-4xl mx-auto space-y-10">
        
        {/* HERO STRIP */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0F8B8D]/10 via-white to-white border border-slate-200/60 p-6 md:p-10 shadow-[0_12px_32px_rgba(15,23,42,0.06)]"
        >
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
             <motion.div 
               animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.05, 1] }}
               transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
               className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[80px]"
             />
             <motion.div 
               animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.1, 1] }}
               transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
               className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-[80px]"
             />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-card text-primary rounded-xl shadow-sm border border-border/50">
                <LayoutDashboard className="size-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">{t(lang, "dash_community_ops")}</h1>
                <p className="text-sm md:text-base text-muted-foreground font-medium mt-0.5">{t(lang, "dash_live_intel")}</p>
              </div>
            </div>
            
            {!loading && items.length > 0 && (
              <div className="flex gap-4">
                <div className="px-5 py-3 rounded-2xl bg-white/60 backdrop-blur-md border border-slate-200/80 shadow-sm">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{t(lang, "dash_active_cases")}</div>
                  <div className="text-2xl font-black">{needsReassessment.length + awaitingReferral.length + stableMonitoring.length}</div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0.3 }}
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                className="h-28 bg-gradient-to-r from-card/30 via-muted/30 to-card/30 rounded-[1.5rem] border border-border/40 backdrop-blur-sm shadow-sm"
              />
            ))}
          </div>
        ) : (
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="show" 
            className="space-y-12"
          >
            {/* 8-CARD OPERATIONAL INTELLIGENCE GRID */}
            <motion.div variants={containerVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <motion.div variants={gridCardVariants} whileHover={{ y: -2, scale: 1.02 }} className="p-4 rounded-3xl bg-card/60 backdrop-blur-md border border-severity-emergency/20 shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-severity-emergency/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex flex-col justify-between h-full gap-3">
                  <div className="text-xs font-bold text-severity-emergency uppercase tracking-wider">{t(lang, "dash_emergency_cases")}</div>
                  <div className="text-3xl font-black text-foreground">{gridMetrics.emergency}</div>
                </div>
              </motion.div>

              <motion.div variants={gridCardVariants} whileHover={{ y: -2, scale: 1.02 }} className="p-4 rounded-3xl bg-card/60 backdrop-blur-md border border-severity-phc/20 shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-severity-phc/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex flex-col justify-between h-full gap-3">
                  <div className="text-xs font-bold text-severity-phc uppercase tracking-wider">{t(lang, "dash_phc")}</div>
                  <div className="text-3xl font-black text-foreground">{gridMetrics.phc}</div>
                </div>
              </motion.div>

              <motion.div variants={gridCardVariants} whileHover={{ y: -2, scale: 1.02 }} className="p-4 rounded-3xl bg-card/60 backdrop-blur-md border border-primary/20 shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex flex-col justify-between h-full gap-3">
                  <div className="text-xs font-bold text-primary uppercase tracking-wider">{t(lang, "dash_home")}</div>
                  <div className="text-3xl font-black text-foreground">{gridMetrics.homeCare}</div>
                </div>
              </motion.div>

              <motion.div variants={gridCardVariants} whileHover={{ y: -2, scale: 1.02 }} className="p-4 rounded-3xl bg-card/60 backdrop-blur-md border border-[#10b981]/20 shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#10b981]/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex flex-col justify-between h-full gap-3">
                  <div className="text-xs font-bold text-[#10b981] uppercase tracking-wider">{t(lang, "dash_improving")}</div>
                  <div className="text-3xl font-black text-foreground">{gridMetrics.improving}</div>
                </div>
              </motion.div>

              <motion.div variants={gridCardVariants} whileHover={{ y: -2, scale: 1.02 }} className="p-4 rounded-3xl bg-card/60 backdrop-blur-md border border-border/60 shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-muted to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex flex-col justify-between h-full gap-3">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t(lang, "dash_reassessments")}</div>
                  <div className="text-3xl font-black text-foreground">{gridMetrics.reassessments}</div>
                </div>
              </motion.div>

              <motion.div variants={gridCardVariants} whileHover={{ y: -2, scale: 1.02 }} className="p-4 rounded-3xl bg-card/60 backdrop-blur-md border border-severity-emergency/10 shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-severity-emergency/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex flex-col justify-between h-full gap-3">
                  <div className="text-xs font-bold text-severity-emergency/80 uppercase tracking-wider">{t(lang, "dash_escalations")}</div>
                  <div className="text-3xl font-black text-foreground">{gridMetrics.escalations}</div>
                </div>
              </motion.div>

              <motion.div variants={gridCardVariants} whileHover={{ y: -2, scale: 1.02 }} className="p-4 rounded-3xl bg-card/60 backdrop-blur-md border border-severity-phc/10 shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-severity-phc/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex flex-col justify-between h-full gap-3">
                  <div className="text-xs font-bold text-severity-phc/80 uppercase tracking-wider">{t(lang, "dash_awaiting_ref")}</div>
                  <div className="text-3xl font-black text-foreground">{gridMetrics.awaiting}</div>
                </div>
              </motion.div>

              <motion.div variants={gridCardVariants} whileHover={{ y: -2, scale: 1.02 }} className="p-4 rounded-3xl bg-card/60 backdrop-blur-md border border-muted-foreground/10 shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-muted-foreground/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex flex-col justify-between h-full gap-3">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t(lang, "dash_stable_resolved")}</div>
                  <div className="text-3xl font-black text-foreground">{gridMetrics.resolved}</div>
                </div>
              </motion.div>

            </motion.div>
            {/* Needs Reassessment */}
            {needsReassessment.length > 0 && (
              <motion.section variants={containerVariants}>
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80 mb-5 flex items-center gap-2">
                  <Calendar className="size-5 text-primary" /> {t(lang, "dash_needs_reassessment_section")}
                  <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-bold">{needsReassessment.length}</span>
                </h2>
                <div className="space-y-4">
                  {needsReassessment.map(r => <StateCard key={r.id} rec={r} type="reassess" />)}
                </div>
              </motion.section>
            )}

            {/* Awaiting Referral */}
            {awaitingReferral.length > 0 && (
              <motion.section variants={containerVariants}>
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80 mb-5 flex items-center gap-2">
                  <ShieldAlert className="size-5 text-severity-phc" /> {t(lang, "dash_awaiting_ref_section")}
                  <span className="bg-severity-phc/10 text-severity-phc px-2.5 py-0.5 rounded-full text-xs font-bold">{awaitingReferral.length}</span>
                </h2>
                <div className="space-y-4">
                  {awaitingReferral.map(r => <StateCard key={r.id} rec={r} type="referral" />)}
                </div>
              </motion.section>
            )}

            {/* Stable Monitoring */}
            {stableMonitoring.length > 0 && (
              <motion.section variants={containerVariants}>
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80 mb-5 flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-muted-foreground/60" /> {t(lang, "dash_stable_monitoring_section")}
                  <span className="bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full text-xs font-bold">{stableMonitoring.length}</span>
                </h2>
                <div className="space-y-4">
                  {stableMonitoring.map(r => <StateCard key={r.id} rec={r} type="stable" />)}
                </div>
              </motion.section>
            )}

            {items.length === 0 && (
              <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }} className="text-center py-20 border border-slate-200/50 rounded-[32px] bg-slate-50/50 shadow-[0_4px_14px_rgba(15,23,42,0.02)]">
                <Activity className="size-12 text-slate-300 mx-auto mb-5" />
                <h3 className="text-xl font-bold text-[#1E293B]">{t(lang, "dash_no_active")}</h3>
                <p className="text-base text-slate-500 mt-2 max-w-sm mx-auto">{t(lang, "dash_no_active_desc")}</p>
              </motion.div>
            )}
            
            {items.length > 0 && needsReassessment.length === 0 && awaitingReferral.length === 0 && stableMonitoring.length === 0 && (
              <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }} className="text-center py-20 border border-[#0F8B8D]/20 rounded-[32px] bg-[#E8F7F5]/50 shadow-[0_4px_14px_rgba(15,139,141,0.03)]">
                <CheckCircle2 className="size-12 text-[#0F8B8D]/50 mx-auto mb-5" />
                <h3 className="text-xl font-bold text-[#1E293B]">{t(lang, "dash_all_resolved")}</h3>
                <p className="text-base text-slate-500 mt-2 max-w-sm mx-auto">{t(lang, "dash_all_resolved_desc")}</p>
              </motion.div>
            )}
          </motion.div>
        )}

      </div>

      {/* CONTINUITY INTELLIGENCE RAIL */}
      {railTarget && createPortal(
        <AnimatePresence mode="popLayout">
          {!loading && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative p-6 flex flex-col h-full overflow-y-auto"
            >
              {/* Severity Aura */}
              {highRiskActive.length > 0 && (
                <motion.div
                  className="absolute inset-0 pointer-events-none z-[-1]"
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: [0.03, 0.1, 0.03],
                    backgroundColor: "hsl(var(--severity-emergency))"
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
              )}

              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-6 flex items-center gap-2">
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0F8B8D] opacity-30"></span>
                  <span className="relative inline-flex rounded-full size-2 bg-[#0F8B8D]/70"></span>
                </span>
                {t(lang, "dash_ops_intel")}
              </h3>

              <div className="space-y-4">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="p-5 rounded-[1.5rem] bg-card/80 backdrop-blur-md border border-border/50 shadow-sm"
                >
                  <div className="text-xs font-bold uppercase tracking-wider mb-2 text-muted-foreground">{t(lang, "dash_pending_tasks_rail")}</div>
                  <div className="text-3xl font-black tracking-tight text-foreground">
                    {needsReassessment.length + awaitingReferral.length}
                  </div>
                </motion.div>

                {highRiskActive.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="p-5 rounded-[1.5rem] border border-severity-emergency/30 bg-severity-emergency/10 text-severity-emergency shadow-sm relative overflow-hidden"
                  >
                    <motion.div 
                      className="absolute inset-0 bg-severity-emergency/5"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <div className="relative z-10 flex items-center gap-2 mb-3">
                      <HeartPulse className="size-4" />
                      <div className="text-xs font-bold uppercase tracking-wider">{t(lang, "dash_high_risk_rail")}</div>
                    </div>
                    <div className="relative z-10 text-2xl font-black tracking-tight">
                      {highRiskActive.length} {t(lang, "dash_patients_suffix")}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        railTarget
      )}
    </AppShell>
  );
}

