import { useState } from "react";
import { Calendar, Save, CheckCircle2, Clock, CalendarDays, Activity } from "lucide-react";
import { t } from "@/i18n/dict";
import { useApp } from "@/store/app";
import { setFollowUp, type FollowUpPlan } from "@/storage/db";
import type { Severity } from "@/engine/types";

interface Props {
  recordId: number | null;
  severity: Severity;
  highRisk: boolean;
  existing?: FollowUpPlan;
  onSaved?: (plan: FollowUpPlan) => void;
}

function defaultDays(severity: Severity, highRisk: boolean): number {
  if (highRisk) return 1;
  if (severity === "Emergency") return 1;
  if (severity === "PHC Referral") return 3;
  return 7;
}

function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function FollowUpPlanner({ recordId, severity, highRisk, existing, onSaved }: Props) {
  const lang = useApp((s) => s.lang);
  const initialDate = existing
    ? new Date(existing.due_date).toISOString().slice(0, 10)
    : todayPlus(defaultDays(severity, highRisk));
  const [date, setDate] = useState(initialDate);
  const [reason, setReason] = useState(existing?.revisit_reason ?? "reason_general");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const reasonKeys = [
    "reason_recheck_fever",
    "reason_vitals_review",
    "reason_pregnancy_check",
    "reason_general",
  ] as const;

  async function onSave() {
    if (recordId == null) return;
    setSaving(true);
    const plan: FollowUpPlan = {
      due_date: new Date(date).getTime(),
      revisit_reason: reason,
      notes: notes.trim(),
      created_at: Date.now(),
    };
    await setFollowUp(recordId, plan);
    setSaving(false);
    setSaved(true);
    onSaved?.(plan);
    setTimeout(() => setSaved(false), 2500);
  }

  const labelCls = "block text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-2";
  const inputCls =
    "w-full h-[52px] px-4 rounded-[14px] bg-white/92 border border-slate-200 text-[#1E293B] text-[15px] font-medium placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0F8B8D] focus:ring-[4px] focus:ring-[#0F8B8D]/12 transition-all duration-200 ease-out shadow-[0_2px_4px_rgba(0,0,0,0.02)]";

  return (
    <div className="relative pl-6 sm:pl-8 border-l-[3px] border-border/50 pb-6 print-hidden">
      {/* Timeline Node */}
      <div className="absolute -left-[1.1rem] top-0 size-8 rounded-full bg-card border-[3px] border-primary flex items-center justify-center shadow-sm">
        <Activity className="size-3.5 text-primary" />
      </div>

      <div className="bg-white/86 border border-slate-200/70 rounded-[22px] p-6 sm:p-8 shadow-[0_8px_24px_rgba(15,23,42,0.04)] backdrop-blur-md">
        <h2 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
          {t(lang, "fu_ongoing_care")}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          {t(lang, "fu_schedule_hint")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>
              <div className="flex items-center gap-1.5"><CalendarDays className="size-3.5" /> {t(lang, "fu_date_label")}</div>
            </label>
            <input
              type="date"
              className={inputCls}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={todayPlus(0)}
            />
          </div>
          <div>
            <label className={labelCls}>
              <div className="flex items-center gap-1.5"><Activity className="size-3.5" /> {t(lang, "fu_focus_area")}</div>
            </label>
            <select
              className={inputCls}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              {reasonKeys.map((k) => (
                <option key={k} value={k}>
                  {t(lang, k)}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>{t(lang, "fu_clinical_notes")}</label>
            <textarea
              className={`${inputCls} min-h-[80px] h-auto py-4 resize-y`}
              placeholder={t(lang, "fu_clinical_notes_ph")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        
        <div className="mt-6 flex items-center gap-4 flex-wrap pt-4 border-t border-border/40">
          <button
            type="button"
            onClick={onSave}
            disabled={saving || recordId == null}
            className="inline-flex items-center gap-2 h-[54px] px-[30px] rounded-2xl bg-[#0F8B8D] text-white text-[15px] font-bold shadow-[0_12px_24px_rgba(15,139,141,0.20)] hover:shadow-[0_16px_32px_rgba(15,139,141,0.25)] hover:-translate-y-[2px] transition-all duration-200 ease-out disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[0_12px_24px_rgba(15,139,141,0.20)]"
          >
            <Save className="size-4" />
            {saving ? t(lang, "fu_scheduling") : existing ? t(lang, "fu_update_schedule") : t(lang, "fu_schedule_followup_btn")}
          </button>
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-severity-home animate-in fade-in slide-in-from-left-2">
              <CheckCircle2 className="size-4" /> {t(lang, "fu_plan_secured")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
