import { jsPDF } from "jspdf";
import type { Lang } from "@/i18n/dict";
import { t } from "@/i18n/dict";
import type { TriageResult, PatientInput } from "@/engine/types";
import type { AssessmentRecord } from "@/storage/db";
import { severityLabel } from "@/lib/severity";

// Severity colors as RGB (kept in-file to avoid CSS-var dependence in PDF context).
function severityRGB(sev: TriageResult["triage"]): [number, number, number] {
  switch (sev) {
    case "Emergency":
      return [196, 30, 58]; // red
    case "PHC Referral":
      return [202, 138, 4]; // amber
    case "Home Care":
      return [22, 122, 90]; // green
  }
}

function fmtDate(ts: number, lang: Lang): string {
  try {
    return new Date(ts).toLocaleString(
      lang === "hi" ? "hi-IN" : lang === "kn" ? "kn-IN" : "en-IN",
      { dateStyle: "medium", timeStyle: "short" },
    );
  } catch {
    return new Date(ts).toISOString();
  }
}

function fmtDateOnly(ts: number, lang: Lang): string {
  try {
    return new Date(ts).toLocaleDateString(
      lang === "hi" ? "hi-IN" : lang === "kn" ? "kn-IN" : "en-IN",
      { dateStyle: "medium" },
    );
  } catch {
    return new Date(ts).toISOString().slice(0, 10);
  }
}

interface SlipParams {
  input: PatientInput;
  result: TriageResult;
  record?: AssessmentRecord | null;
  lang: Lang;
}

/**
 * Generates a deterministic, offline-only PDF triage slip.
 * No network, no AI; pure local rendering with jsPDF core fonts.
 *
 * NOTE: jsPDF core fonts only support Latin glyphs reliably. Indic-script
 * labels are transliterated to English headings inside the PDF to remain
 * legible on any device/printer. UI language affects formatting only.
 */
export function generateTriageSlipPDF(params: SlipParams): jsPDF {
  const { input, result, record } = params;
  // Force English labels inside the PDF for guaranteed glyph coverage.
  const lang: Lang = "en";

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 36;
  const contentW = pageW - margin * 2;
  let y = margin;

  // ===== Header =====
  doc.setFillColor(15, 76, 129); // calm clinical blue
  doc.rect(0, 0, pageW, 64, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Arogya Saathi", margin, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Offline Frontline Triage Support", margin, 48);
  doc.setFontSize(9);
  const slipLabel = "TRIAGE SLIP";
  doc.text(slipLabel, pageW - margin - doc.getTextWidth(slipLabel), 30);
  const idStr = `ID: ${record?.id ?? "—"}`;
  doc.text(idStr, pageW - margin - doc.getTextWidth(idStr), 48);

  y = 88;
  doc.setTextColor(20, 20, 20);

  // ===== Patient Summary =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Patient Summary", margin, y);
  y += 6;
  doc.setDrawColor(220);
  doc.line(margin, y, margin + contentW, y);
  y += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const sex = input.sex ? input.sex[0].toUpperCase() + input.sex.slice(1) : "—";
  const age = typeof input.age === "number" ? `${input.age} yrs` : "—";
  const preg =
    input.pregnant === true
      ? input.pregnancy_weeks
        ? `Yes (${input.pregnancy_weeks} wks)`
        : "Yes"
      : "No";
  const ts = result.timestamp ?? record?.created_at ?? Date.now();

  const rows: [string, string][] = [
    ["Name", String(input.patient_name ?? record?.patient_name ?? "—")],
    ["Age", age],
    ["Sex", sex],
    ["Pregnancy", preg],
    ["Assessed", fmtDate(ts, lang)],
    ["Category", String(result.patient_category)],
  ];
  const colW = contentW / 2;
  rows.forEach((row, i) => {
    const col = i % 2;
    const rowY = y + Math.floor(i / 2) * 16;
    doc.setFont("helvetica", "bold");
    doc.text(`${row[0]}:`, margin + col * colW, rowY);
    doc.setFont("helvetica", "normal");
    doc.text(row[1], margin + col * colW + 60, rowY);
  });
  y += Math.ceil(rows.length / 2) * 16 + 10;

  // ===== Severity Banner =====
  const sevColor = severityRGB(result.triage);
  const bannerH = 56;
  doc.setFillColor(sevColor[0], sevColor[1], sevColor[2]);
  doc.roundedRect(margin, y, contentW, bannerH, 6, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(severityLabel(result.triage, lang).toUpperCase(), margin + 14, y + 26);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Urgency: ${result.urgency}`, margin + 14, y + 44);
  if (result.override_triggered) {
    const tag = "OVERRIDE";
    doc.setFont("helvetica", "bold");
    doc.text(tag, margin + contentW - 14 - doc.getTextWidth(tag), y + 26);
  }
  y += bannerH + 10;

  // Recommended action
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Recommended Action", margin, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  y = writeWrapped(doc, result.recommended_action || "—", margin, y, contentW, 12);
  y += 8;

  // High-risk pregnancy flag
  if (result.high_risk_pregnancy?.flagged) {
    doc.setFillColor(254, 235, 235);
    doc.setDrawColor(196, 30, 58);
    const reasons = (result.high_risk_pregnancy.reasons || []).map((rk) =>
      t(lang, rk as Parameters<typeof t>[1]),
    );
    const boxH = 32 + reasons.length * 12;
    doc.roundedRect(margin, y, contentW, boxH, 4, 4, "FD");
    doc.setTextColor(196, 30, 58);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("HIGH-RISK PREGNANCY", margin + 10, y + 16);
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    let ry = y + 30;
    reasons.forEach((r) => {
      doc.text(`• ${r}`, margin + 12, ry);
      ry += 12;
    });
    y += boxH + 10;
  }

  // ===== Key Findings (reasoning) =====
  y = sectionList(doc, "Key Findings", result.reasoning, margin, y, contentW);

  // ===== Warning Signs =====
  y = sectionList(doc, "Warning Signs", result.warning_signs, margin, y, contentW);

  // ===== Triggered Rules =====
  if (result.triggered_rules && result.triggered_rules.length) {
    y = ensureSpace(doc, y, 40, margin);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text("Triggered Rules", margin, y);
    y += 6;
    doc.setDrawColor(220);
    doc.line(margin, y, margin + contentW, y);
    y += 14;
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    const ruleStr = result.triggered_rules.join(", ");
    y = writeWrapped(doc, ruleStr, margin, y, contentW, 11);
    y += 8;
  }

  // ===== Follow-Up =====
  if (record?.follow_up) {
    y = ensureSpace(doc, y, 60, margin);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text("Follow-Up", margin, y);
    y += 6;
    doc.setDrawColor(220);
    doc.line(margin, y, margin + contentW, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Due: ${fmtDateOnly(record.follow_up.due_date, lang)}`, margin, y);
    y += 14;
    doc.text(`Reason: ${record.follow_up.revisit_reason || "—"}`, margin, y);
    y += 14;
    if (record.follow_up.notes) {
      y = writeWrapped(doc, `Notes: ${record.follow_up.notes}`, margin, y, contentW, 12);
    }
    y += 6;
  }

  // ===== Footer =====
  const footerY = pageH - 40;
  doc.setDrawColor(220);
  doc.line(margin, footerY - 10, pageW - margin, footerY - 10);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  doc.text(
    "This tool supports frontline triage and is not a final medical diagnosis.",
    margin,
    footerY,
  );
  const gen = `Generated ${fmtDate(Date.now(), lang)}`;
  doc.text(gen, pageW - margin - doc.getTextWidth(gen), footerY);

  return doc;
}

function sectionList(
  doc: jsPDF,
  title: string,
  items: string[] | undefined,
  margin: number,
  y: number,
  contentW: number,
): number {
  if (!items || items.length === 0) return y;
  y = ensureSpace(doc, y, 40, margin);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text(title, margin, y);
  y += 6;
  doc.setDrawColor(220);
  doc.line(margin, y, margin + contentW, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const item of items) {
    y = ensureSpace(doc, y, 16, margin);
    y = writeWrapped(doc, `• ${item}`, margin, y, contentW, 12);
  }
  y += 6;
  return y;
}

function writeWrapped(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
): number {
  const lines = doc.splitTextToSize(text, maxW);
  for (const line of lines) {
    y = ensureSpace(doc, y, lineH, x);
    doc.text(line, x, y);
    y += lineH;
  }
  return y;
}

function ensureSpace(doc: jsPDF, y: number, needed: number, margin: number): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + needed > pageH - 50) {
    doc.addPage();
    return margin;
  }
  return y;
}

export function downloadTriageSlip(params: SlipParams): void {
  const doc = generateTriageSlipPDF(params);
  const id = params.record?.id ?? "slip";
  const stamp = new Date(params.result.timestamp ?? Date.now())
    .toISOString()
    .slice(0, 10);
  doc.save(`arogya-saathi-triage-${id}-${stamp}.pdf`);
}
