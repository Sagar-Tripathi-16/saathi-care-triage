import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/store/app";
import { t } from "@/i18n/dict";
import { severityClasses, severityLabel } from "@/lib/severity";
import { clearAssessments, listAssessments, type AssessmentRecord } from "@/storage/db";
import { Trash2 } from "lucide-react";

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
  const [items, setItems] = useState<AssessmentRecord[]>([]);

  async function refresh() {
    setItems(await listAssessments());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onClear() {
    if (typeof window !== "undefined" && !window.confirm(t(lang, "confirm_clear"))) return;
    await clearAssessments();
    refresh();
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-foreground">{t(lang, "nav_history")}</h1>
        {items.length > 0 && (
          <button
            onClick={onClear}
            className="text-sm text-destructive flex items-center gap-1 hover:underline"
          >
            <Trash2 className="size-4" /> {t(lang, "clear_history")}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t(lang, "no_history")}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => {
            const sev = severityClasses(it.severity as "Emergency" | "PHC Referral" | "Home Care");
            return (
              <li key={it.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                <span className={`px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${sev.chip}`}>
                  {severityLabel(it.severity as "Emergency" | "PHC Referral" | "Home Care", lang)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">
                    {it.patient_name || "—"}
                    {typeof it.age === "number" && <span className="text-muted-foreground font-normal text-sm"> · {it.age}y</span>}
                    {it.pregnant && <span className="text-muted-foreground font-normal text-sm"> · {t(lang, "pregnant")}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(it.created_at).toLocaleString()} · {it.urgency}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
