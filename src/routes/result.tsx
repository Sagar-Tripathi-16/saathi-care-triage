import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/store/app";
import { t } from "@/i18n/dict";
import { severityClasses, severityLabel } from "@/lib/severity";
import { simplifyExplanation } from "@/server/ai.functions";
import { loadAllRules } from "@/engine/rules";
import { listAssessments, updateAssessment, type SimplifiedAI, type AssessmentRecord } from "@/storage/db";
import { FollowUpPlanner } from "@/components/FollowUpPlanner";
import { downloadTriageSlip } from "@/lib/pdfSlip";
import {
  Sparkles,
  AlertTriangle,
  ArrowLeft,
  Info,
  ListChecks,
  ShieldAlert,
  Stethoscope,
  ArrowRight,
  HeartPulse,
  FileDown,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSaved, setAiSaved] = useState(false);
  const [record, setRecord] = useState<AssessmentRecord | null>(null);

  const rulesById = useMemo(() => {
    const map = new Map<string, ReturnType<typeof loadAllRules>[number]>();
    for (const r of loadAllRules()) map.set(r.rule_id, r);
    return map;
  }, []);

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
      if (!cancel) setRecord(match ?? null);
    })();
    return () => {
      cancel = true;
    };
  }, [result, lastRecordId]);

  if (!result) return null;

  const sev = severityClasses(result.triage);
  const isEmergency = result.triage === "Emergency";
  const isOverride = !!result.override_triggered && (result.override_rule_ids?.length ?? 0) > 0;
  const highRisk = result.high_risk_pregnancy;
  const isHighRisk = !!highRisk?.flagged;

  async function onSimplify() {
    if (!result) return;
    setAiError(null);
    setSimplified(null);
    setAiSaved(false);
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setAiError(t(lang, "ai_disabled_offline"));
      return;
    }
    setSimplifying(true);
    try {
      const out = await simplifyExplanation({
        data: {
          severity: result.triage,
          urgency: result.urgency,
          recommended_action: result.recommended_action,
          reasoning: result.reasoning,
          warning_signs: result.warning_signs,
          explanations: result.explanations,
          patient_category: result.patient_category,
          language: lang,
        },
      });
      if (out.ok && out.simplified) {
        const payload = out.simplified as SimplifiedAI;
        setSimplified(payload);
        // Persist to most recent matching assessment (by timestamp)
        try {
          const all = await listAssessments();
          const match = all.find((a) => a.result?.timestamp === result.timestamp);
          if (match?.id != null) {
            await updateAssessment(match.id, { ai_simplified: { lang, payload } });
            setAiSaved(true);
          }
        } catch {
          /* best-effort */
        }
      } else {
        setAiError(t(lang, "ai_failed"));
      }
    } catch {
      setAiError(t(lang, "ai_failed"));
    } finally {
      setSimplifying(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-4 pb-24 sm:pb-0 animate-fade-in">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground min-h-[36px]">
          <ArrowLeft className="size-4" /> {t(lang, "back")}
        </Link>

        {/* Severity banner */}
        <div className={`rounded-2xl p-5 ${isEmergency ? "shadow-lg" : "shadow-sm"} ${sev.banner} relative overflow-hidden`}>
          <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold opacity-90 bg-black/10 px-2 py-0.5 rounded-full">
            {t(lang, "urgency")} · {result.urgency}
          </div>
          <div className="text-3xl sm:text-4xl font-bold mt-2 leading-tight">{severityLabel(result.triage, lang)}</div>
          <div className="mt-3 text-sm sm:text-base opacity-95 leading-relaxed">{result.recommended_action}</div>
        </div>

        {/* PDF triage slip — deterministic, offline */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <FileDown className="size-4 text-primary shrink-0 mt-0.5" />
            <span>{t(lang, "pdf_slip_hint")}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!result || !input) return;
              downloadTriageSlip({ input, result, record, lang });
            }}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm min-h-[44px] shadow-sm ${
              result.triage === "Home Care"
                ? "bg-card border border-border text-foreground hover:bg-accent"
                : "bg-primary text-primary-foreground hover:opacity-95"
            }`}
            aria-label={t(lang, "generate_pdf_slip")}
          >
            <FileDown className="size-4" />
            {t(lang, "generate_pdf_slip")}
          </button>
        </div>

        {/* Override banner */}
        {isOverride && (
          <div className="rounded-xl border border-severity-emergency/40 bg-severity-emergency-soft p-3 flex items-start gap-2.5 animate-fade-in">
            <ShieldAlert className="size-5 text-severity-emergency shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold text-severity-emergency">{t(lang, "override_banner_title")}</div>
              <div className="text-foreground/80 mt-0.5">{t(lang, "override_banner_desc")}</div>
              {result.override_rule_ids && result.override_rule_ids.length > 0 && (
                <div className="text-[11px] mt-1.5 font-mono text-muted-foreground">
                  {result.override_rule_ids.join(", ")}
                </div>
              )}
            </div>
          </div>
        )}

        {/* High-risk pregnancy banner */}
        {isHighRisk && (
          <div className="rounded-xl border-2 border-severity-emergency/60 bg-severity-emergency-soft p-4 animate-fade-in">
            <div className="flex items-start gap-2.5">
              <HeartPulse className="size-6 text-severity-emergency shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-base font-bold text-severity-emergency tracking-wide">
                  {t(lang, "high_risk_pregnancy")}
                </div>
                <div className="text-sm font-medium text-foreground mt-1">
                  {t(lang, "maternal_risk_warning")}
                </div>
                <ul className="mt-2 space-y-1 text-sm text-foreground">
                  {(highRisk?.reasons ?? []).map((rk) => (
                    <li key={rk} className="flex gap-2">
                      <span className="size-1.5 rounded-full bg-severity-emergency shrink-0 mt-2" />
                      <span>{t(lang, rk as Parameters<typeof t>[1])}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 rounded-lg bg-card/60 border border-border px-3 py-2 text-sm text-foreground flex items-start gap-2">
                  <ArrowRight className="size-4 text-severity-emergency shrink-0 mt-0.5" />
                  <span>{t(lang, "maternal_risk_action")}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {result.validation_issues.filter((i) => i.level === "warning").length > 0 && (
          <div className="rounded-xl border border-severity-phc/40 bg-severity-phc-soft text-severity-phc-foreground p-3 text-sm">
            <div className="flex items-center gap-2 font-medium mb-1">
              <AlertTriangle className="size-4" /> {t(lang, "validation_warnings")}
            </div>
            <ul className="list-disc pl-5 space-y-0.5">
              {result.validation_issues
                .filter((i) => i.level === "warning")
                .map((i, idx) => <li key={idx}>{i.message}</li>)}
            </ul>
          </div>
        )}

        {/* Why */}
        <section className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <Stethoscope className="size-4 text-primary" /> {t(lang, "why")}
          </h2>
          <ul className="space-y-1.5 text-sm text-foreground">
            {result.reasoning.map((r, i) => (
              <li key={i} className="flex gap-2">
                <Info className="size-3.5 text-primary shrink-0 mt-1" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
          {result.explanations.length > 0 && (
            <div className="mt-3 space-y-1.5 pt-3 border-t border-border">
              {result.explanations.map((e, i) => (
                <p key={i} className="text-sm text-muted-foreground leading-relaxed">{e}</p>
              ))}
            </div>
          )}
        </section>

        {/* Warning signs */}
        <section className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <AlertTriangle className="size-4 text-severity-phc" /> {t(lang, "warning_signs")}
          </h2>
          <ul className="space-y-1.5 text-sm text-foreground">
            {result.warning_signs.map((w, i) => (
              <li key={i} className="flex gap-2">
                <span className="size-1.5 rounded-full bg-severity-phc shrink-0 mt-2" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* AI simplify */}
        <section className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="size-4 text-primary" /> {t(lang, "explain_simple")}
            </h2>
            <button
              onClick={onSimplify}
              disabled={simplifying || !online}
              title={!online ? t(lang, "ai_disabled_offline") : undefined}
              className="px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed min-h-[40px] inline-flex items-center gap-1.5"
            >
              <Sparkles className="size-3.5" />
              {simplifying ? "…" : t(lang, "explain_simple")}
            </button>
          </div>
          {!online && (
            <p className="mt-2 text-sm text-muted-foreground flex items-center gap-1.5">
              <Info className="size-3.5" /> {t(lang, "ai_offline_notice")}
            </p>
          )}
          {aiError && <p className="mt-2 text-sm text-muted-foreground">{aiError}</p>}
          {simplified && (
            <div className="mt-3 rounded-xl bg-accent/50 border border-accent p-4 space-y-3 text-sm text-accent-foreground animate-fade-in">
              <div className="flex items-start gap-2">
                <Sparkles className="size-4 text-primary mt-0.5 shrink-0" />
                <p className="font-semibold text-base leading-snug">{simplified.headline}</p>
              </div>
              {simplified.why?.length > 0 && (
                <div className="pl-6">
                  <ul className="space-y-1">
                    {simplified.why.map((w, i) => (
                      <li key={i} className="flex gap-2">
                        <Info className="size-3.5 shrink-0 mt-1 opacity-70" />
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {simplified.warning_signs?.length > 0 && (
                <div className="pl-6 rounded-lg bg-severity-phc-soft/60 p-2.5 border border-severity-phc/20">
                  <div className="font-medium flex items-center gap-1.5 mb-1 text-severity-phc-foreground">
                    <AlertTriangle className="size-3.5" /> {t(lang, "warning_signs")}
                  </div>
                  <ul className="space-y-0.5 text-severity-phc-foreground">
                    {simplified.warning_signs.map((w, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="size-1.5 rounded-full bg-severity-phc shrink-0 mt-2" />
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="pl-6 flex items-start gap-2 rounded-lg bg-primary/10 p-2.5">
                <ArrowRight className="size-4 text-primary shrink-0 mt-0.5" />
                <p>
                  <span className="font-medium">{t(lang, "recommended_action")}: </span>
                  {simplified.recommended_action}
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1 text-[11px] opacity-70 italic border-t border-accent/60">
                <Sparkles className="size-3" /> {t(lang, "ai_label")}
                {aiSaved && <span className="ml-auto not-italic">· {t(lang, "ai_saved")}</span>}
              </div>
            </div>
          )}
        </section>

        {/* Follow-up planner */}
        <FollowUpPlanner
          recordId={record?.id ?? lastRecordId}
          severity={result.triage}
          highRisk={isHighRisk}
          existing={record?.follow_up}
        />

        {/* Triggered rules */}
        {result.triggered_rules.length > 0 && (
          <section className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <h2 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <ListChecks className="size-4 text-primary" /> {t(lang, "triggered_rules")}
            </h2>
            <Accordion type="multiple" className="space-y-2">
              {result.triggered_rules.map((id) => {
                const rule = rulesById.get(id);
                const isOv = rule?.rule_type === "override_rule";
                return (
                  <AccordionItem key={id} value={id} className="border border-border rounded-lg overflow-hidden">
                    <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0 text-left">
                        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                          {id}
                        </span>
                        {isOv && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-severity-emergency-soft text-severity-emergency font-semibold">
                            {t(lang, "override_badge")}
                          </span>
                        )}
                        <span className="truncate text-muted-foreground text-xs">
                          {rule?.module}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3 pt-0 text-sm space-y-2">
                      {rule?.explanation_template && (
                        <p className="text-foreground">{rule.explanation_template}</p>
                      )}
                      {rule?.warning_signs && rule.warning_signs.length > 0 && (
                        <div>
                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1 font-medium">
                            {t(lang, "warning_signs")}
                          </div>
                          <ul className="list-disc pl-5 space-y-0.5 text-foreground/90">
                            {rule.warning_signs.map((w, i) => <li key={i}>{w}</li>)}
                          </ul>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </section>
        )}

        {/* Desktop actions */}
        <div className="hidden sm:flex gap-3">
          <Link
            to="/"
            className="flex-1 text-center px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold"
          >
            {t(lang, "save_and_new")}
          </Link>
          <Link
            to="/history"
            className="flex-1 text-center px-4 py-3 rounded-xl border border-border bg-card text-foreground font-semibold"
          >
            {t(lang, "view_history")}
          </Link>
        </div>
      </div>

      {/* Sticky mobile action bar */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-card/95 backdrop-blur border-t border-border px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-3xl flex gap-2">
          <Link
            to="/"
            className="flex-1 text-center px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold min-h-[48px] inline-flex items-center justify-center"
          >
            {t(lang, "save_and_new")}
          </Link>
          <Link
            to="/history"
            className="flex-1 text-center px-4 py-3 rounded-xl border border-border bg-card text-foreground font-semibold min-h-[48px] inline-flex items-center justify-center"
          >
            {t(lang, "view_history")}
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
