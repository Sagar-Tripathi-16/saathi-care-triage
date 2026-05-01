import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/store/app";
import { t } from "@/i18n/dict";
import { severityClasses, severityLabel } from "@/lib/severity";
import { simplifyExplanation } from "@/server/ai.functions";
import { Sparkles, AlertTriangle, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/result")({
  head: () => ({
    meta: [
      { title: "Triage Result — Arogya Saathi" },
      { name: "description", content: "Explainable triage result with reasoning, warning signs, and recommended action." },
    ],
  }),
  component: ResultPage,
});

interface Simplified {
  headline: string;
  why: string[];
  warning_signs: string[];
  recommended_action: string;
}

function ResultPage() {
  const lang = useApp((s) => s.lang);
  const result = useApp((s) => s.lastResult);
  const navigate = useNavigate();

  const [simplifying, setSimplifying] = useState(false);
  const [simplified, setSimplified] = useState<Simplified | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (!result) navigate({ to: "/" });
  }, [result, navigate]);

  if (!result) return null;

  const sev = severityClasses(result.triage);

  async function onSimplify() {
    if (!result) return;
    setAiError(null);
    setSimplified(null);
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
      if (out.ok && out.simplified) setSimplified(out.simplified as Simplified);
      else setAiError(t(lang, "ai_failed"));
    } catch {
      setAiError(t(lang, "ai_failed"));
    } finally {
      setSimplifying(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-4">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> {t(lang, "back")}
        </Link>

        {/* Severity banner */}
        <div className={`rounded-2xl p-5 shadow-sm ${sev.banner}`}>
          <div className="text-xs uppercase tracking-wider opacity-80">{t(lang, "urgency")}: {result.urgency}</div>
          <div className="text-3xl font-bold mt-1">{severityLabel(result.triage, lang)}</div>
          <div className="mt-3 text-sm opacity-95">{result.recommended_action}</div>
        </div>

        {/* Validation warnings */}
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
        <section className="bg-card border border-border rounded-2xl p-4">
          <h2 className="font-semibold text-foreground mb-2">{t(lang, "why")}</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
            {result.reasoning.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
          {result.explanations.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {result.explanations.map((e, i) => (
                <p key={i} className="text-sm text-muted-foreground">{e}</p>
              ))}
            </div>
          )}
        </section>

        {/* Warning signs */}
        <section className="bg-card border border-border rounded-2xl p-4">
          <h2 className="font-semibold text-foreground mb-2">{t(lang, "warning_signs")}</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
            {result.warning_signs.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </section>

        {/* AI simplify */}
        <section className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="size-4 text-primary" /> {t(lang, "simplify_with_ai")}
            </h2>
            <button
              onClick={onSimplify}
              disabled={simplifying}
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-60"
            >
              {simplifying ? "…" : t(lang, "simplify_with_ai")}
            </button>
          </div>
          {aiError && <p className="mt-2 text-sm text-muted-foreground">{aiError}</p>}
          {simplified && (
            <div className="mt-3 rounded-xl bg-accent p-3 space-y-2 text-sm text-accent-foreground">
              <p className="font-medium">{simplified.headline}</p>
              {simplified.why?.length > 0 && (
                <ul className="list-disc pl-5 space-y-0.5">
                  {simplified.why.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              )}
              {simplified.warning_signs?.length > 0 && (
                <div>
                  <div className="font-medium mt-1">{t(lang, "warning_signs")}</div>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {simplified.warning_signs.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}
              <p><span className="font-medium">{t(lang, "recommended_action")}: </span>{simplified.recommended_action}</p>
              <p className="text-xs opacity-70 italic">AI-simplified explanation</p>
            </div>
          )}
        </section>

        {/* Triggered rules */}
        {result.triggered_rules.length > 0 && (
          <section className="text-xs text-muted-foreground">
            {t(lang, "triggered_rules")}: {result.triggered_rules.join(", ")}
          </section>
        )}

        <div className="flex gap-3">
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
    </AppShell>
  );
}
