import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/store/app";
import { t } from "@/i18n/dict";
import { severityClasses, severityLabel } from "@/lib/severity";
import {
  clearAssessments,
  listAssessments,
  matchPatientHistory,
  markFollowUpComplete,
  type AssessmentRecord,
} from "@/storage/db";
import { loadAllRules } from "@/engine/rules";
import { SEVERITY_LEVEL } from "@/engine/classifier";
import type { Severity } from "@/engine/types";
import {
  Trash2,
  ChevronDown,
  AlertTriangle,
  RotateCcw,
  Activity,
  Calendar,
  HeartPulse,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Play,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — Arogya Saathi" },
      { name: "description", content: "Past triage assessments saved on this device." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const lang = useApp((s) => s.lang);
  const setLast = useApp((s) => s.setLast);
  const setPendingPreviousId = useApp((s) => s.setPendingPreviousId);
  const navigate = useNavigate();
  const [items, setItems] = useState<AssessmentRecord[]>([]);

  const overrideIds = useMemo(() => {
    const set = new Set<string>();
    for (const r of loadAllRules()) if (r.rule_type === "override_rule") set.add(r.rule_id);
    return set;
  }, []);

  async function refresh() {
    setItems(await listAssessments());
  }

  useEffect(() => {
    refresh();
  }, []);

  // Compute trend (vs prior assessment for the same patient) for each item
  const trends = useMemo(() => {
    const map = new Map<number, { prev: AssessmentRecord; delta: number } | null>();
    for (const it of items) {
      if (it.id == null) continue;
      const prior = matchPatientHistory(items, it.patient_name, it.age, it.created_at);
      const prev = prior[0]; // already newest-first
      if (!prev) {
        map.set(it.id, null);
        continue;
      }
      const curLevel = SEVERITY_LEVEL[it.severity as Severity] ?? 0;
      const prevLevel = SEVERITY_LEVEL[prev.severity as Severity] ?? 0;
      map.set(it.id, { prev, delta: curLevel - prevLevel });
    }
    return map;
  }, [items]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  async function onClear() {
    if (typeof window !== "undefined" && !window.confirm(t(lang, "confirm_clear"))) return;
    await clearAssessments();
    refresh();
  }

  function onReopen(rec: AssessmentRecord) {
    setLast(rec.input, rec.result, rec.id ?? null);
    navigate({ to: "/result" });
  }

  async function onMarkComplete(rec: AssessmentRecord) {
    if (rec.id == null) return;
    await markFollowUpComplete(rec.id);
    refresh();
  }

  function onStartRevisit(rec: AssessmentRecord) {
    if (rec.id != null) setPendingPreviousId(rec.id);
    navigate({ to: "/" });
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-4 gap-3">
        <h1 className="text-xl font-semibold text-foreground">{t(lang, "nav_history")}</h1>
        {items.length > 0 && (
          <button
            onClick={onClear}
            className="text-sm text-destructive flex items-center gap-1 hover:underline min-h-[36px]"
          >
            <Trash2 className="size-4" /> {t(lang, "clear_history")}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <Activity className="size-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground text-sm">{t(lang, "no_history")}</p>
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-3">
          {items.map((it) => {
            const sev = it.severity as Severity;
            const sevCls = severityClasses(sev);
            const borderClr =
              sev === "Emergency"
                ? "border-l-severity-emergency"
                : sev === "PHC Referral"
                  ? "border-l-severity-phc"
                  : "border-l-severity-home";
            const isOverride =
              !!it.result?.override_triggered ||
              it.triggered_rules.some((id) => overrideIds.has(id));
            const isHR = !!it.high_risk_pregnancy?.flagged;
            const trend = it.id != null ? trends.get(it.id) : null;
            const fu = it.follow_up;
            const fuPending = !!fu && !it.follow_up_completed_at;
            const fuDueLabel: { label: string; tone: "overdue" | "today" | "scheduled" } | null = (() => {
              if (!fuPending || !fu) return null;
              const dueDay = (() => { const d = new Date(fu.due_date); d.setHours(0,0,0,0); return d.getTime(); })();
              if (dueDay < today) return { label: t(lang, "follow_up_overdue"), tone: "overdue" };
              if (dueDay === today) return { label: t(lang, "follow_up_today"), tone: "today" };
              return { label: t(lang, "follow_up_due"), tone: "scheduled" };
            })();

            const vitals: Array<[string, string]> = [];
            const inp = it.input;
            if (inp.temperature != null) vitals.push([t(lang, "temperature_c"), `${inp.temperature}`]);
            if (inp.spo2 != null) vitals.push([t(lang, "spo2"), `${inp.spo2}`]);
            if (inp.hemoglobin != null) vitals.push([t(lang, "hemoglobin"), `${inp.hemoglobin}`]);
            if (inp.respiratory_rate != null) vitals.push([t(lang, "resp_rate"), `${inp.respiratory_rate}`]);
            if (inp.fever_duration_days != null) vitals.push([t(lang, "fever_duration"), `${inp.fever_duration_days}`]);

            return (
              <AccordionItem
                key={it.id}
                value={String(it.id)}
                className={`bg-card border border-border border-l-4 ${borderClr} rounded-2xl overflow-hidden shadow-sm`}
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline [&[data-state=open]>svg]:rotate-180 gap-2">
                  <div className="flex-1 flex items-center gap-3 min-w-0 text-left">
                    <span className={`px-2 py-1 rounded-md text-[11px] font-bold whitespace-nowrap tracking-wide ${sevCls.chip}`}>
                      {severityLabel(sev, lang)}
                    </span>
                    {isOverride && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-severity-emergency-soft text-severity-emergency border border-severity-emergency/30">
                        <AlertTriangle className="size-3" /> {t(lang, "override_badge")}
                      </span>
                    )}
                    {isHR && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-severity-emergency-soft text-severity-emergency border border-severity-emergency/30">
                        <HeartPulse className="size-3" /> {t(lang, "high_risk_pregnancy")}
                      </span>
                    )}
                    {fuDueLabel && (
                      <span
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                          fuDueLabel.tone === "overdue"
                            ? "bg-severity-emergency-soft text-severity-emergency"
                            : fuDueLabel.tone === "today"
                              ? "bg-severity-phc-soft text-severity-phc-foreground"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Calendar className="size-3" /> {fuDueLabel.label}
                      </span>
                    )}
                    {trend && (
                      <span
                        className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-medium ${
                          trend.delta > 0
                            ? "bg-severity-emergency-soft text-severity-emergency"
                            : trend.delta < 0
                              ? "bg-severity-home-soft text-severity-home"
                              : "bg-muted text-muted-foreground"
                        }`}
                        title={`${t(lang, "trend_previous")}: ${severityLabel(trend.prev.severity as Severity, lang)}`}
                      >
                        {trend.delta > 0 ? (
                          <TrendingUp className="size-3" />
                        ) : trend.delta < 0 ? (
                          <TrendingDown className="size-3" />
                        ) : (
                          <Minus className="size-3" />
                        )}
                        {trend.delta > 0
                          ? t(lang, "trend_escalated")
                          : trend.delta < 0
                            ? t(lang, "trend_deescalated")
                            : t(lang, "trend_stable")}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground truncate text-sm">
                        {it.patient_name || "—"}
                        {typeof it.age === "number" && (
                          <span className="text-muted-foreground font-normal"> · {it.age}y</span>
                        )}
                        {it.pregnant && (
                          <span className="text-muted-foreground font-normal"> · {t(lang, "pregnant")}</span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {new Date(it.created_at).toLocaleString()} · {it.urgency}
                      </div>
                    </div>
                  </div>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform" />
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-0">
                  <div className="space-y-3 text-sm">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1 font-medium">
                        {t(lang, "recommended_action")}
                      </div>
                      <p className="text-foreground">{it.result.recommended_action}</p>
                    </div>

                    {vitals.length > 0 ? (
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5 font-medium">
                          {t(lang, "vitals")}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {vitals.map(([k, v]) => (
                            <div key={k} className="rounded-md border border-border bg-background px-2 py-1.5">
                              <div className="text-[10px] text-muted-foreground">{k}</div>
                              <div className="font-semibold text-foreground">{v}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground italic">{t(lang, "no_vitals")}</div>
                    )}

                    {(inp.symptoms?.length ?? 0) > 0 && (
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5 font-medium">
                          {t(lang, "selected_symptoms")}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(inp.symptoms ?? []).map((s) => (
                            <span key={s} className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">
                              {s.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {it.pregnant && typeof inp.pregnancy_weeks === "number" && (
                      <div className="text-xs text-muted-foreground">
                        {t(lang, "pregnancy_weeks")}: <span className="text-foreground font-medium">{inp.pregnancy_weeks}</span>
                      </div>
                    )}

                    {it.result.warning_signs.length > 0 && (
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5 font-medium flex items-center gap-1">
                          <AlertTriangle className="size-3" /> {t(lang, "warning_signs")}
                        </div>
                        <ul className="list-disc pl-5 space-y-0.5 text-foreground">
                          {it.result.warning_signs.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                      </div>
                    )}

                    {it.triggered_rules.length > 0 && (
                      <div className="text-[11px] text-muted-foreground">
                        {t(lang, "triggered_rules")}: <span className="font-mono">{it.triggered_rules.join(", ")}</span>
                      </div>
                    )}

                    {it.ai_simplified && (
                      <div className="rounded-lg bg-accent/40 border border-accent p-3 space-y-1.5">
                        <div className="text-[11px] uppercase tracking-wide text-accent-foreground/70 font-medium">
                          {t(lang, "ai_label")}
                        </div>
                        <p className="font-medium text-accent-foreground">{it.ai_simplified.payload.headline}</p>
                        {it.ai_simplified.payload.why?.length > 0 && (
                          <ul className="list-disc pl-5 text-accent-foreground space-y-0.5">
                            {it.ai_simplified.payload.why.map((w, i) => <li key={i}>{w}</li>)}
                          </ul>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => onReopen(it)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium min-h-[44px]"
                      >
                        <RotateCcw className="size-4" /> {t(lang, "reopen_assessment")}
                      </button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </AppShell>
  );
}
