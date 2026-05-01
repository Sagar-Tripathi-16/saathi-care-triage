
# Arogya Saathi — Offline Explainable Household Triage (PWA)

A frontline, offline-first triage **support** tool for ASHA workers. Deterministic JSON-rule engine runs entirely in the browser; AI is used **only** to simplify and translate the already-decided explanation. The system never diagnoses, prescribes, or overrides rule output.

## Architecture (adapted to this stack)

Original spec asks for Flask + SQLite. This project runs on TanStack Start + Cloudflare Workers, which cannot host Python. We preserve the spec's **intent** (deterministic rules, offline-first, AI as communication layer only) by porting the engine to TypeScript and storing locally in IndexedDB. This is actually a stronger match for "true offline" — triage works with zero network.

```text
Browser (PWA, works offline)
  ├── UI (React) ── Input · Result · History · Language toggle
  ├── Rule Engine (TS, pure functions)
  │     validate → normalize → categorize → load rules
  │     → override pass → standard pass → resolve → explain
  ├── JSON rule packs (bundled, cached by SW)
  └── IndexedDB ── patients, assessments, triggered rules, audit
        │
        └── (online only) Server Function → Lovable AI Gateway
              simplify + translate explanation (EN/HI/KN)
              graceful fallback: deterministic output always shown
```

## What gets built

### 1. Deterministic Rule Engine (TypeScript, browser-side)

Modular files mirroring the spec:

- `src/engine/validation.ts` — mandatory fields (age, symptoms, temperature, spo2), range checks (SpO₂ 50–100, temp 30–45, Hb 1–25, age 0–120), contradiction warnings (never suppresses escalation).
- `src/engine/normalization.ts` — symptom alias map ("breathing issue" → "breathlessness"), boolean coercion ("YES" → true), case/whitespace cleanup.
- `src/engine/categorize.ts` — pregnant → maternal; age<18 → pediatric; else adult; maternal inherits maternal+adult+universal.
- `src/engine/evaluator.ts` — operator support: `==`, `<`, `>`, `<=`, `>=`, `between`, `in`; trigger logic `ALL` / `ANY` / `MINIMUM_MATCH`.
- `src/engine/override_engine.ts` — runs priority-1 override rules first; on hit, halts further evaluation.
- `src/engine/classifier.ts` — severity hierarchy Emergency > PHC Referral > Home Care; highest wins; overrides dominate.
- `src/engine/explainability.ts` — merges reasoning, dedupes warning signs, fills `explanation_template`, always populated.
- `src/engine/index.ts` — orchestrates the exact 14-step flow from the spec; cached rule loading.

### 2. JSON Rule Packs (the clinical brain)

Bundled as static JSON in `src/rules/`, loaded once and cached:

- `danger_signs.json`, `respiratory.json`, `fever.json`, `dehydration.json`, `anemia.json`, `maternal.json`, `adult_emergency.json`

Each rule uses the exact schema from the spec (rule_id, module, priority, severity, rule_type, patient_category, conditions, trigger_logic, minimum_conditions_required, urgency, recommended_action, reasoning, warning_signs, explanation_template). Initial seed = the rules supplied (DANGER_001–003, RESP_001–004, FEVER_001–003, DEHY_001, ANEMIA_001–002, MAT_001–004, ADULT_001–003).

### 3. Local Storage (IndexedDB via `idb`)

`src/storage/db.ts` with stores:

- `assessments` — input payload, normalized payload, result, triggered rule ids, timestamp, ASHA worker id (local), patient ref
- `patients` — local-only patient records (name, age, household id, pregnancy flag)
- `audit` — validation warnings, contradictions

History screen reads from IndexedDB; works fully offline. No cloud sync in v1 (you chose pure offline).

### 4. PWA / Offline Layer

- Manifest (`public/manifest.webmanifest`) with name, icons, `display: standalone`, theme color.
- Service worker registered **only** in production and **only** outside the Lovable preview iframe (per platform guidance).
- Precaches app shell + JSON rules + fonts.
- NetworkFirst for navigations, CacheFirst for rule JSON.
- Note: PWA install + offline only verifiable in published deployment, not the editor preview.

### 5. UI (React + Tailwind, low cognitive load)

Three routes — large tap targets, minimal text, color-coded severity, ASHA-friendly:

- `/` **Patient Input**
  - Patient basics: age, sex, pregnant (toggle, reveals weeks)
  - Vitals: temperature, SpO₂, hemoglobin (optional), respiratory rate (optional)
  - Symptoms: tappable chips grouped by module (Danger signs, Breathing, Fever, Dehydration, Maternal, Adult)
  - Free-text "other symptoms" (normalized)
  - Big "Run Triage" button

- `/result` **Triage Result**
  - Large severity banner: **Emergency** (red) / **PHC Referral** (amber) / **Home Care** (green)
  - Urgency line + Recommended action
  - "Why" section: reasoning bullets + warning signs (always present)
  - Triggered rule IDs (small, for audit)
  - Validation warnings (if any) shown separately, never hide escalation
  - "Simplify in Hindi / Kannada / English" toggle → calls AI server fn; if offline/fails, shows the deterministic explanation unchanged with a small "offline" badge
  - "Save & Start New" / "View History"

- `/history` **History**
  - List of past assessments (date, patient, severity chip, action taken)
  - Tap → re-open the result view (read-only)
  - Search by name/date; clear-all with confirm

Global: top bar with app name, language selector (EN/HI/KN), online/offline indicator.

### 6. AI Layer (Lovable AI Gateway, optional)

`src/server/ai.functions.ts` — single server function `simplifyExplanation`:

- Input: structured explainability output + target language (`en` | `hi` | `kn`) — never raw symptoms or authority to classify
- Model: `google/gemini-3-flash-preview`
- System prompt locks the model to: rephrase/translate only, no diagnosis, no severity changes, no new medical claims, return same structure
- Handles 429 (rate limit) and 402 (credits) with friendly toasts
- Client always falls back to the deterministic text on any failure — triage never blocks on AI

### 7. Safety & Disclaimers

- Persistent footer: "Decision support only. Not a diagnosis. Always escalate per protocol."
- First-run modal explaining scope and limits; acknowledged state stored locally.
- AI responses tagged "AI-simplified explanation" so workers know what came from the rule engine vs. the language layer.

## Languages

English, Hindi, Kannada in v1. Static UI strings in `src/i18n/{en,hi,kn}.ts`. Rule reasoning/templates live in JSON in English; the AI layer handles translation of the final explanation when online. Severity labels and action verbs are also pre-translated locally so offline users still get a localized banner.

## Edge cases handled

Empty payload → structured validation response. Invalid SpO₂ → validation error, no triage. Contradictions (e.g. SpO₂ 99 + severe distress) → warning shown, escalation still proceeds. Unknown symptoms → ignored safely. AI offline/timeout/429/402 → deterministic output shown with a notice. IndexedDB write failure → result still displayed, banner offers retry.

## Out of scope for v1

Cloud sync, supervisor dashboard, multi-user accounts, SMS escalation, true CHW directory of PHCs, analytics. All can be added later without touching the rule engine.

## Acceptance scenarios (used as smoke tests)

1. Pregnant patient + heavy_bleeding → **Emergency**, MAT_001 triggered, urgent maternal referral.
2. Child age 2 + chest_indrawing + spo2 88 → **Emergency** via RESP_001 override; RESP_004 also listed.
3. Adult temp 38.7 + confusion → **Emergency** via FEVER_002 combination.
4. Adult temp 39.2 alone → **PHC Referral** via FEVER_001.
5. Hb 9 in non-pregnant adult → **PHC Referral** via ANEMIA_002.
6. Empty symptoms + valid vitals all normal → **Home Care** with explanation.
7. Airplane mode → full triage works; AI simplify shows offline notice.
8. Reload after airplane mode → app shell + rules load from cache; history visible.
