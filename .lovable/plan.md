# Arogya Saathi — UI/UX Refinement Plan

Scope: visual + interaction polish only. The deterministic rule engine, JSON rule packs, IndexedDB storage, offline-first PWA behavior, AI-as-simplifier-only contract, and routing structure stay exactly as they are.

## 1. History page → expandable clinical timeline

Rebuild `src/routes/history.tsx` as an accordion list. Each card:

- **Severity left border** (4px): red (Emergency), amber (PHC Referral), green (Home Care), using existing `--severity-*` tokens.
- **Collapsed row**: severity chip · patient name · age/pregnancy · timestamp · urgency · 1-line action summary · chevron.
- **Override badge** (small, with `AlertTriangle` icon) when any item in `triggered_rules` corresponds to a rule whose `rule_type === "override_rule"`.
- **Expanded panel** (smooth `animate-accordion-down`):
  - Vitals grid (temp, SpO₂, Hb, RR, fever days) — only show populated fields.
  - Selected symptoms as chips.
  - Maternal status (pregnant + weeks) when applicable.
  - Triggered rule IDs, warning signs, full recommended action.
  - AI explanation block if it was generated (see §5 below).
  - Two actions: **View Full Record** (modal/route) and **Re-open Assessment** (loads input + result into store, navigates to `/result` in read-only banner mode).

Implementation notes:
- Use existing shadcn `Accordion` and `Badge` components; no new deps.
- Add a small helper `isOverrideTriggered(record)` that checks rule IDs against a precomputed Set built from `loadAllRules()` (already exposed by `src/engine/rules.ts`).
- Persist the last AI simplification: extend `AssessmentRecord` in `src/storage/db.ts` with optional `ai_simplified?: { lang: Lang; payload: Simplified }` (additive, no migration needed because the IDB store has no schema constraint on record shape; existing records remain readable). Save it from the result page when the user runs simplification.
- Add `getAssessment(id)` is already present; add `updateAssessment(id, patch)` for storing AI output.

## 2. Override / escalation warning system

Centralize override detection in `src/engine/index.ts`:

- Extend `TriageResult` with `override_triggered: boolean` and `override_rule_ids: string[]` (additive; persisted records without it default to `false`).
- Set both fields during the existing override pass in `runTriage` — this is metadata only, the classification logic is unchanged.

UI surfaces:
- **Result page** (`src/routes/result.tsx`): when `override_triggered`, render a slim warning strip directly **below** the severity banner — `AlertTriangle` + label like "Emergency override triggered — critical symptoms superseded standard triage flow." Color: amber for non-emergency overrides, red-tinted for emergency overrides. Subtle, single line, tappable to expand into which rule(s) caused it.
- **History cards**: small inline override badge in the collapsed row.
- Copy goes through `src/i18n/dict.ts` as new keys: `override_banner_title`, `override_banner_desc`, `override_badge`.

## 3. Result page UX refinement

Same routes/components; visual hierarchy upgrades in `src/routes/result.tsx`:

- Severity banner: larger headline, urgency as a pill above title, soft gradient using `--severity-*-soft` → `--severity-*` for emphasis, stronger shadow on Emergency only.
- Convert "Why", "Warning signs", "Triggered rules" into shadcn `Card`s with section icons (`Stethoscope`, `AlertTriangle`, `ListChecks`).
- "Triggered rules" becomes a collapsible (`Accordion`) listing each rule as: rule_id badge · explanation_template · its specific warning signs. Pull this from `result.triggered_rules` joined back against `loadAllRules()`.
- **Sticky mobile action bar**: on `< sm`, fix "Save & New" + "View History" to bottom with `safe-area-inset-bottom` padding; on desktop they sit inline as today.
- Validation warnings get a clearer amber card with icon, kept above the "Why" section.

## 4. AI explanation UX

In `src/routes/result.tsx` and the dictionary:

- Replace `simplify_with_ai` copy with three context-aware variants and pick by language:
  - en: "Explain in Simple Language"
  - hi: "सरल भाषा में समझाएँ"
  - kn: "ಸರಳ ಭಾಷೆಯಲ್ಲಿ ವಿವರಿಸಿ"
- Add subkeys `explain_for_asha` and `translate_and_simplify` for a small dropdown of CTA tone (optional, default = simple language).
- Output card: softer `bg-accent/40` background, sectioned with icons:
  - Headline (large, with `Sparkles`)
  - Why → bullets with `Info`
  - Warning signs → bullets with `AlertTriangle`, amber accent
  - Recommended action → highlighted block with `ArrowRight`
- Always show the "AI-simplified explanation" label as a subtle footer chip.
- On success, persist via `updateAssessment(id, { ai_simplified })` so History can show it later.
- Keep deterministic fallback messaging on offline / failure unchanged.

## 5. Mobile-first responsiveness

Across `index.tsx`, `result.tsx`, `history.tsx`, `AppShell.tsx`:

- Min touch target 44px on all chips/buttons; bump symptom chip padding from `px-3 py-2` to `px-3.5 py-2.5` and add `min-h-[44px]`.
- Form fields: `text-base` on mobile to prevent iOS zoom; vitals grid collapses to 2-col on `< sm`.
- Sticky **Run Triage** button on mobile (already partly sticky — fix spacing so it doesn't overlap the last symptom row; add backdrop blur + top border).
- Header language selector: switch to icon + short code (`EN/HI/KN`) under `sm`.
- Ensure `overflow-x-hidden` on `<main>` to kill any horizontal scroll from long Kannada strings.
- Symptom group containers wrap chips with `gap-2` and `flex-wrap`, no scroll.

## 6. Input flow polish

`src/routes/index.tsx`:

- Danger signs group: render in its own card with red-tinted border (`border-severity-emergency/40`), soft red background (`bg-severity-emergency-soft/40`), and a small "Critical" label — chips inside still use the standard selected style but get a red ring when selected.
- Maternal section: when `pregnant` is checked, weeks field gets a helper line ("Used for trimester-aware rules") and a soft pink-tinted card.
- Vitals: add unit hints inline (small muted text under each label) and progressive disclosure — collapse "Less common vitals" (Hb, RR, fever days) into a "Show more" toggle on mobile only.
- Keep all current fields, conditional logic, and submission flow unchanged.

## 7. Visual polish (system-wide)

- Tighten radius scale usage: cards `rounded-2xl`, chips `rounded-full`, banners `rounded-2xl` with subtle `shadow-sm` (Emergency gets `shadow-md`).
- Typography rhythm: section headings `text-base font-semibold`, subheads `text-sm font-medium text-muted-foreground uppercase tracking-wide`, body `text-sm leading-relaxed`.
- Add `animate-fade-in` on result sections and `animate-accordion-down/up` on history cards (already in tw-animate-css).
- Verify contrast: muted-foreground on card backgrounds passes AA at body size — adjust the `--muted-foreground` token slightly darker if needed.
- Footer disclaimer gets a small shield icon to reinforce the "decision support, not diagnosis" framing.

## 8. i18n additions

New keys added to all three dictionaries (en/hi/kn):
`override_banner_title`, `override_banner_desc`, `override_badge`, `view_full_record`, `reopen_assessment`, `read_only_mode`, `vitals_more`, `vitals_less`, `critical_label`, `ai_label`, `explain_simple`, `explain_for_asha`, `translate_and_simplify`, `ai_saved`, `expand`, `collapse`.

## What stays exactly the same

- `src/engine/*` logic, `src/rules/*.json` content, classifier, validator, normalizer, evaluator.
- IndexedDB store name + key path; only additive optional fields on records.
- Server function `simplifyExplanation` contract (request/response unchanged).
- Routing: `/`, `/result`, `/history`.
- PWA manifest + offline service worker behavior.
- Severity hierarchy and tokens.

## Files touched

- `src/routes/history.tsx` (rebuild as accordion timeline)
- `src/routes/result.tsx` (hierarchy, override banner, sticky mobile actions, AI card)
- `src/routes/index.tsx` (danger emphasis, maternal hint, mobile sizing, vitals progressive disclosure)
- `src/components/AppShell.tsx` (mobile language toggle, header polish)
- `src/engine/index.ts` (set `override_triggered` + `override_rule_ids` — additive only)
- `src/engine/types.ts` (extend `TriageResult` with two optional fields)
- `src/storage/db.ts` (add `updateAssessment`, optional `ai_simplified` field on record type)
- `src/i18n/dict.ts` (new keys × 3 languages)
- `src/styles.css` (minor token tweak if contrast check fails; otherwise untouched)

No new dependencies. No architecture changes. No engine semantics changes.