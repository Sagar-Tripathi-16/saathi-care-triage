# Arogya Saathi

A premium AI-assisted frontline healthcare triage and continuity platform designed for ASHA workers, ANMs, rural healthcare staff, and community health operations.

> Decision support system — not a diagnosis.

---

# Overview

Arogya Saathi helps frontline healthcare workers:

* Perform rapid symptom-based triage
* Identify high-risk escalation patterns
* Track continuity of care
* Monitor reassessments and referrals
* Generate simplified healthcare guidance
* Operate in low-resource and partially offline environments
* Maintain multilingual accessibility

The platform combines:

* Deterministic clinical triage logic
* AI-powered healthcare communication
* Progressive assessment workflows
* Operational continuity intelligence
* Responsive and immersive healthcare UX

---

# Key Features

## Intelligent Triage Engine

Deterministic rule-based triage system supporting:

* Emergency escalation
* PHC referral
* Home care monitoring
* Maternal risk identification
* Symptom severity grading
* Vitals-aware escalation
* Continuity reassessment

---

## Progressive Guided Assessment

Three-stage healthcare workflow:

1. Patient Context
2. Symptom Discovery
3. Contextual Vitals

The interface progressively reveals only the medically relevant inputs.

---

## AI-Powered Healthcare Guidance

Integrated OpenRouter-based narrative healthcare guidance:

* Simplified explanations
* Calm healthcare communication
* Offline fallback parity
* Structured care instructions
* ASHA/ANM-friendly tone

---

## Continuity Intelligence Dashboard

Operational healthcare workspace featuring:

* Emergency monitoring
* PHC referrals
* Reassessments
* Escalation tracking
* Improving/stable patient progression
* Pending continuity tasks

---

## Progression Intelligence

Compares reassessments over time and detects:

* Worsening conditions
* Resolved symptoms
* Escalations
* Improvement trends
* Referral progression

---

## Multilingual Experience

Supports multilingual healthcare workflows with dynamic UI translation.

Current language support:

* English
* Hindi
* Kannada

---

## Offline-Aware Design

Designed for rural and intermittent connectivity environments:

* Offline-safe continuity flows
* Local persistence
* AI fallback modes
* Progressive Web App support

---

# Tech Stack

## Frontend

* React
* TypeScript
* Vite
* TanStack Start
* Tailwind CSS
* Framer Motion

## AI & Communication

* OpenRouter API
* Gemini experimentation support

## Storage & Persistence

* IndexedDB
* Local-first continuity workflows

## Deployment

* Cloudflare Pages
* Wrangler

---

# Architecture Highlights

## Hybrid Intelligence System

Arogya Saathi intentionally separates:

### Deterministic Medical Logic

Handles:

* Severity calculation
* Escalation decisions
* Referral classification
* Clinical routing

This guarantees predictable and safe triage behavior.

### AI Communication Layer

Handles:

* Narrative simplification
* Human-friendly healthcare explanations
* Guidance formatting
* Multilingual readability

AI never overrides the deterministic triage outcome.

---

# UI/UX Philosophy

The interface was intentionally designed as:

> “A calm healthcare operations environment.”

Instead of a cluttered admin dashboard.

Core principles:

* Emotional clarity
* Operational calmness
* Readable hierarchy
* Premium healthcare aesthetics
* Reduced cognitive overload
* Progressive disclosure
* Motion with purpose

---

# Project Structure

```bash
src/
 ├── components/
 ├── engine/
 ├── routes/
 ├── server/
 ├── storage/
 ├── i18n/
 ├── lib/
 └── styles/
```

---

# Local Development

## Install dependencies

```bash
npm install
```

---

## Run development server

```bash
npm run dev
```

---

## Production build

```bash
npm run build
```

---

# Environment Variables

Create a `.env` file:

```env
OPENROUTER_API_KEY=your_key_here
```

Optional:

```env
GEMINI_API_KEY=your_key_here
```

---

# Deployment

Recommended deployment platform:

* Cloudflare Pages

Build command:

```bash
npm run build
```

Deploy command:

```bash
npx wrangler deploy
```

---

# Safety Notice

Arogya Saathi is:

* A clinical decision-support tool
* Not a diagnostic authority
* Not a replacement for physicians
* Not a substitute for emergency services

All high-risk outcomes should follow local healthcare escalation protocols.

---

# Future Roadmap

Planned enhancements:

* Voice-guided triage
* AI multilingual narration
* Regional protocol packs
* Offline synchronization
* Field analytics
* Referral verification workflows
* Predictive deterioration intelligence
* Health worker coordination systems

---

# Inspiration

Designed for frontline healthcare realities:

* Rural healthcare environments
* ASHA workflows
* Community triage support
* Low-resource operations
* Human-centered healthcare communication

---

# License

This project is intended for educational, research, hackathon, and healthcare innovation purposes.

---

# Author

Developed by Sagar Tripathi, Aditi Hurkat

Built to reimagine frontline healthcare triage with calm operational intelligence and human-centered design.
