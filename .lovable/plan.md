
# Phase 1 ASHA Workflow Enhancements

This plan adds three additive features to Arogya Saathi without altering the deterministic engine, IndexedDB schema fundamentals, rule JSON architecture, multilingual system, or current routing/UI shell. All new logic is offline-first and stored locally.

## What ships

1. **Follow-up Visit Tracking** — schedule revisits, see progression trends in History, "Follow-up Due" badges.
2. **High-Risk Pregnancy Flagging** — deterministic post-engine flag with visible badge + maternal warning section.
3. **Today's Priority Cases** — a new `/queue` route showing severity-sorted active cases with filters.

---

## 1. Follow-up Visit Tracking

### Data model (IndexedDB v2 migration, additive only)

Extend `AssessmentRecord` in `src/storage/db.ts` with optional fields (no breaking change to existing records):
- `follow_up?: { due_date: number; notes: string; revisit_reason: string; created_at: number }`
- `follow_up_completed_at?: number` (set when a new assessment links to this one as the revisit)
- `previous_assessment_id?: number` (set on the new revisit pointing back to the prior case)
- `high_risk_pregnancy?: { flagged: boolean; reasons: string[] }` (used by Feature 2)

Bump DB version to 2; in `upgrade()` add an index on `follow_up.due_date` for fast "due today" queries. Existing records remain valid (all new fields optional).

New helpers in `db.ts`:
- `setFollowUp(id, plan)` — attaches/updates a follow-up plan.
- `clearFollowUp(id)` — removes plan.
- `linkRevisit(prevId, newId)` — marks previous as completed, links new to previous.
- `listDueFollowUps(now)` — returns records whose `follow_up.due_date <= now` and not completed.
- `getPriorAssessmentsForPatient(name, age)` — best-effort match by `patient_name` + `age` for trend lookup (case-insensitive name match, ±1 year age tolerance).

### Result page (`src/routes/result.tsx`)

Add a new "Plan Follow-up" section below "Recommended action":
- Date input (defaults: Emergency → +1 day, PHC Referral → +3 days, Home Care → +7 days; user can change).
- Revisit reason — short text or chip selection (e.g. "Recheck fever", "Vitals review", "Pregnancy check").
- Notes textarea (optional).
- Save button persists via `setFollowUp(currentRecordId, plan)`.
- Confirmation toast/inline state on save; works fully offline.

### History page (`src/routes/history.tsx`)

Per-card additions:
- **Follow-up Due badge** (amber, with calendar icon) on the trigger row when `follow_up.due_date <= today` and not completed.
- **Trend indicator** comparing this assessment to the most recent prior assessment for the same patient (using `getPriorAssessmentsForPatient`):
  - `Escalated ↑` (red) when current severity_level > prior
  - `De-escalated ↓` (green) when current < prior
  - `Stable →` (muted) when equal
  - Shows "Previous: PHC Referral · Current: Emergency" inline.
- Expanded panel: shows the follow-up plan (date, reason, notes) with "Mark complete" and "Edit" buttons. "Start revisit" button creates a new assessment pre-linked via `previous_assessment_id`.

Trend computation runs once on history load (memoized) — pure local lookup, no network.

---

## 2. High-Risk Pregnancy Flagging

### Deterministic flag (post-engine, not engine change)

Add a small pure helper `src/engine/maternalRisk.ts`:
```text
computeHighRiskPregnancy(input, result, priorAssessments) -> { flagged, reasons[] }
```

Triggers when `input.pregnant === true` AND any of:
- `input.hemoglobin < 7` (severe anemia)
- `input.symptoms` includes `heavy_bleeding`, `severe_headache`, `blurred_vision`, or `severe_weakness`
- 2+ prior assessments in last 30 days resolved to `Emergency` or `PHC Referral`

This is computed at submit time in `src/routes/index.tsx` immediately after `runTriage()`, before `saveAssessment()`, and stored in the new `high_risk_pregnancy` field. The deterministic triage engine is **untouched** — this is an additional advisory flag layered on top.

Reasons are stored as i18n keys (e.g. `risk_severe_anemia`) so they render correctly in any language.

### UI surfaces

- **Result page**: prominent red `HIGH-RISK PREGNANCY` badge below the severity banner when flagged, plus a "Maternal Risk Warning" section listing the trigger reasons and a tailored action ("Schedule follow-up within 24h, share with PHC").
- **History page**: pink/red badge chip in the trigger row.
- **Queue page** (Feature 3): high-risk filter and visual marker.
- Auto-defaults the follow-up date to **+1 day** when high-risk is flagged.

---

## 3. Today's Priority Cases (`/queue`)

New route `src/routes/queue.tsx` registered in the AppShell nav alongside New / History.

### Data source
Reads from IndexedDB `listAssessments()` — no new storage. Filters to "active" cases:
- All Emergency from last 7 days, OR
- Any case with a pending follow-up (`follow_up.due_date` set and not completed), OR
- High-risk pregnancy flagged in last 14 days.

### Sort order
1. High-risk pregnancy + Emergency (top)
2. Emergency
3. Follow-up overdue (due_date < today)
4. PHC Referral
5. Follow-up due today
6. Home Care with pending follow-up

### Card content (per case)
- Patient label (name or "—") + age + pregnant chip
- Severity chip (reusing `severityClasses`)
- Follow-up status: "Due today", "Overdue 2d", or scheduled date
- High-risk pregnancy badge if flagged
- Timestamp (relative: "2h ago", "Yesterday")
- Tap → opens Result page in read-only mode (reuses existing `setLast` + navigate flow).

### Filters (sticky bar at top)
- Severity: All / Emergency / PHC / Home (chips, multi-select)
- Toggle: "Pending follow-up only"
- Toggle: "High-risk pregnancy only"
- Filter state persisted to `useApp` Zustand store (so it survives navigation but resets on app reload).

### Empty state
Calm message: "No priority cases right now. Great work."

---

## i18n additions (`src/i18n/dict.ts`)

New keys (English shown; mirror to Hindi + Kannada):
- `nav_queue`: "Priority Queue"
- `follow_up`, `follow_up_due`, `follow_up_overdue`, `follow_up_today`, `follow_up_scheduled`, `follow_up_completed`
- `plan_follow_up`, `revisit_reason`, `follow_up_notes`, `save_follow_up`, `mark_complete`, `start_revisit`
- `trend_escalated`, `trend_deescalated`, `trend_stable`, `trend_previous`, `trend_current`
- `high_risk_pregnancy`, `maternal_risk_warning`, `maternal_risk_action`
- `risk_severe_anemia`, `risk_heavy_bleeding`, `risk_severe_headache`, `risk_blurred_vision`, `risk_severe_weakness`, `risk_repeated_referrals`
- `queue_title`, `queue_empty`, `queue_filter_severity`, `queue_filter_followup`, `queue_filter_highrisk`, `queue_all_severities`

---

## Files

**New**
- `src/engine/maternalRisk.ts` — pure deterministic flag helper (no engine changes)
- `src/routes/queue.tsx` — priority queue page
- `src/components/FollowUpPlanner.tsx` — reusable section used on Result page

**Edited**
- `src/storage/db.ts` — DB v2 migration (additive), new helpers
- `src/store/app.ts` — queue filter state
- `src/routes/index.tsx` — compute + persist high-risk flag on save
- `src/routes/result.tsx` — high-risk banner, maternal risk section, follow-up planner
- `src/routes/history.tsx` — follow-up due badge, trend indicator, expanded follow-up panel
- `src/components/AppShell.tsx` — add Queue nav link
- `src/i18n/dict.ts` — new keys in en/hi/kn

**Untouched** (preserved)
- `src/engine/*` evaluator, classifier, evaluator, rules.ts, types.ts core
- All `src/rules/*.json` files
- PWA / service worker / offline infrastructure
- AI gateway / Lovable AI integration

---

## Why this approach (technical notes)

- **Engine untouched**: high-risk pregnancy is a *post-engine advisory* layer, not a new rule type. This avoids any risk to the deterministic triage logic and keeps explainability intact (the original triggered rules are still authoritative).
- **DB additive migration**: new optional fields + one new index. Existing stored records remain valid and load unchanged.
- **No new dependencies**: uses existing `idb`, lucide-react, shadcn accordion. Date math is plain `Date`/timestamp arithmetic.
- **Fully offline**: every feature reads/writes IndexedDB and computes from local data. No network calls added.
- **Multilingual**: every new label routed through `t(lang, key)` with full en/hi/kn coverage.
