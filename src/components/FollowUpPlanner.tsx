import { useState } from "react";
import { Calendar, Save, CheckCircle2 } from "lucide-react";
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

  const labelCls = "block text-sm font-medium text-foreground mb-1";
  const inputCls =
    "w-full px-3 py-2.5 text-base sm:text-sm rounded-lg border border-input bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px]";

  return (
    <section className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
        <Calendar className="size-4 text-primary" /> {t(lang, "plan_follow_up")}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>{t(lang, "follow_up_due")}</label>
          <input
            type="date"
            className={inputCls}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={todayPlus(0)}
          />
        </div>
        <div>
          <label className={labelCls}>{t(lang, "revisit_reason")}</label>
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
          <label className={labelCls}>{t(lang, "follow_up_notes")}</label>
          <textarea
            className={`${inputCls} min-h-[80px] py-2`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={onSave}
          disabled={saving || recordId == null}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60 min-h-[40px]"
        >
          <Save className="size-4" />
          {saving ? "…" : t(lang, "save_follow_up")}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm text-severity-home">
            <CheckCircle2 className="size-4" /> {t(lang, "follow_up_saved")}
          </span>
        )}
      </div>
    </section>
  );
}
