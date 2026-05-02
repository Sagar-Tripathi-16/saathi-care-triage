import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/store/app";
import { t } from "@/i18n/dict";
import { severityClasses, severityLabel } from "@/lib/severity";
import { listAssessments, type AssessmentRecord } from "@/storage/db";
import type { Severity } from "@/engine/types";
import {
  Calendar,
  HeartPulse,
  AlertTriangle,
  ListChecks,
  Filter,
} from "lucide-react";

export const Route = createFileRoute("/queue")({
  head: () => ({
    meta: [
      { title: "Priority Queue — Arogya Saathi" },
      { name: "description", content: "Today's priority cases sorted by severity and follow-up urgency." },
    ],
  }),
  component: QueuePage,
});

const SEVERITIES: Severity[] = ["Emergency", "PHC Referral", "Home Care"];
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function relativeTime(ts: number, now: number, lang: string): string {
  const diff = Math.max(0, now - ts);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return lang === "hi" ? "अभी" : lang === "kn" ? "ಈಗ" : "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function followUpStatus(rec: AssessmentRecord, now: number, lang: string): {
  label: string;
  tone: "overdue" | "today" | "scheduled" | "none";
} {
  if (!rec.follow_up || rec.follow_up_completed_at) return { label: "", tone: "none" };
  const due = startOfDay(rec.follow_up.due_date);
  const today = startOfDay(now);
  if (due < today) {
    const days = Math.ceil((today - due) / (24 * 60 * 60 * 1000));
    return { label: `${t(lang as "en", "follow_up_overdue")} ${days}d`, tone: "overdue" };
  }
  if (due === today) return { label: t(lang as "en", "follow_up_today"), tone: "today" };
  return {
    label: `${t(lang as "en", "follow_up_scheduled")}: ${new Date(rec.follow_up.due_date).toLocaleDateString()}`,
    tone: "scheduled",
  };
}

function priorityScore(rec: AssessmentRecord, now: number): number {
  const sev = rec.severity as Severity;
  const isHR = !!rec.high_risk_pregnancy?.flagged;
  const fu = !rec.follow_up_completed_at && rec.follow_up;
  const due = fu ? startOfDay(fu.due_date) : Infinity;
  const today = startOfDay(now);

  // Lower number = higher priority
  if (isHR && sev === "Emergency") return 0;
  if (sev === "Emergency") return 1;
  if (fu && due < today) return 2; // overdue
  if (sev === "PHC Referral") return 3;
  if (fu && due === today) return 4;
  if (isHR) return 5;
  if (fu) return 6;
  return 7;
}

function QueuePage() {
  const lang = useApp((s) => s.lang);
  const filters = useApp((s) => s.queueFilters);
  const setFilters = useApp((s) => s.setQueueFilters);
  const setLast = useApp((s) => s.setLast);
  const navigate = useNavigate();

  const [items, setItems] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const now = Date.now();

  useEffect(() => {
    listAssessments().then((res) => {
      setItems(res);
      setLoading(false);
    });
  }, []);

  const active = useMemo(() => {
    const filtered = items.filter((r) => {
      const ageMs = now - r.created_at;
      const isEmergencyRecent = r.severity === "Emergency" && ageMs <= SEVEN_DAYS;
      const hasPendingFu = !!r.follow_up && !r.follow_up_completed_at;
      const isHRRecent = !!r.high_risk_pregnancy?.flagged && ageMs <= FOURTEEN_DAYS;
      return isEmergencyRecent || hasPendingFu || isHRRecent;
    });

    const filterByUI = filtered.filter((r) => {
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

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-3 mb-2">
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <ListChecks className="size-5 text-primary" /> {t(lang, "queue_title")}
        </h1>
      </div>
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{t(lang, "queue_helper")}</p>

      {/* Filter bar */}
      <div className="bg-card border border-border rounded-2xl p-3 mb-4 space-y-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground font-medium">
          <Filter className="size-3.5" /> {t(lang, "queue_filter_severity")}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilters({ severities: [] })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border min-h-[36px] ${
              filters.severities.length === 0
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border"
            }`}
          >
            {t(lang, "queue_all_severities")}
          </button>
          {SEVERITIES.map((s) => {
            const on = filters.severities.includes(s);
            const cls = severityClasses(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSeverity(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border min-h-[36px] ${
                  on ? cls.chip + " border-transparent" : "bg-card text-foreground border-border"
                }`}
              >
                {severityLabel(s, lang)}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer min-h-[36px] px-2">
            <input
              type="checkbox"
              checked={filters.pendingFollowUpOnly}
              onChange={(e) => setFilters({ pendingFollowUpOnly: e.target.checked })}
              className="size-4 accent-primary"
            />
            <Calendar className="size-4 text-severity-phc" />
            {t(lang, "queue_filter_followup")}
          </label>
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer min-h-[36px] px-2">
            <input
              type="checkbox"
              checked={filters.highRiskOnly}
              onChange={(e) => setFilters({ highRiskOnly: e.target.checked })}
              className="size-4 accent-primary"
            />
            <HeartPulse className="size-4 text-severity-emergency" />
            {t(lang, "queue_filter_highrisk")}
          </label>
        </div>
      </div>

      {loading ? (
        <ul className="space-y-3" aria-busy="true" aria-label={t(lang, "loading")}>
          {[0, 1, 2].map((i) => (
            <li key={i} className="bg-card border border-border border-l-4 border-l-muted rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-5 w-20 rounded-md bg-muted animate-pulse" />
                <div className="h-5 w-24 rounded-md bg-muted animate-pulse" />
                <div className="ml-auto h-3 w-8 rounded bg-muted animate-pulse" />
              </div>
              <div className="h-4 w-2/3 rounded bg-muted animate-pulse mb-1.5" />
              <div className="h-3 w-3/4 rounded bg-muted/70 animate-pulse" />
            </li>
          ))}
        </ul>
      ) : active.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center animate-fade-in">
          <div className="mx-auto mb-3 size-14 rounded-full bg-severity-home-soft grid place-items-center">
            <ListChecks className="size-7 text-severity-home" />
          </div>
          <p className="text-foreground font-medium text-sm">{t(lang, "queue_empty")}</p>
          <p className="text-muted-foreground text-xs mt-1.5 leading-relaxed max-w-sm mx-auto">
            {t(lang, "queue_empty_hint")}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {active.map((rec) => {
            const sev = rec.severity as Severity;
            const cls = severityClasses(sev);
            const borderClr =
              sev === "Emergency"
                ? "border-l-severity-emergency"
                : sev === "PHC Referral"
                  ? "border-l-severity-phc"
                  : "border-l-severity-home";
            const fu = followUpStatus(rec, now, lang);
            const isHR = !!rec.high_risk_pregnancy?.flagged;
            return (
              <li key={rec.id}>
                <button
                  type="button"
                  onClick={() => onOpen(rec)}
                  className={`w-full text-left bg-card border border-border border-l-4 ${borderClr} rounded-2xl p-3 shadow-sm hover:bg-muted/40 transition-colors`}
                >
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wide ${cls.chip}`}>
                      {severityLabel(sev, lang)}
                    </span>
                    {isHR && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-severity-emergency-soft text-severity-emergency border border-severity-emergency/30">
                        <HeartPulse className="size-3" /> {t(lang, "high_risk_pregnancy")}
                      </span>
                    )}
                    {fu.tone !== "none" && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                          fu.tone === "overdue"
                            ? "bg-severity-emergency-soft text-severity-emergency"
                            : fu.tone === "today"
                              ? "bg-severity-phc-soft text-severity-phc-foreground"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {fu.tone === "overdue" ? (
                          <AlertTriangle className="size-3" />
                        ) : (
                          <Calendar className="size-3" />
                        )}
                        {fu.label}
                      </span>
                    )}
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      {relativeTime(rec.created_at, now, lang)}
                    </span>
                  </div>
                  <div className="font-semibold text-sm text-foreground truncate">
                    {rec.patient_name || "—"}
                    {typeof rec.age === "number" && (
                      <span className="text-muted-foreground font-normal"> · {rec.age}y</span>
                    )}
                    {rec.pregnant && (
                      <span className="text-muted-foreground font-normal"> · {t(lang, "pregnant")}</span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {rec.urgency} · {rec.result.recommended_action}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
