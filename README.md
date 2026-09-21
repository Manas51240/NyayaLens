# NYAYALENS

> **"Understand your legal documents. Know what matters. Take the next safe step."**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-nyayalens--eight.vercel.app-000000?style=for-the-badge&logo=vercel)](https://nyayalens-eight.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Manas51240%2FNyayaLens-181717?style=for-the-badge&logo=github)](https://github.com/Manas51240/NyayaLens)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.25-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Vitest-149%20Passed%20(15%20Suites)-emerald)](https://vitest.dev/)
[![Accessibility](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA%20Oriented-success)](#accessibility)

---

### 🌐 Quick Links

- **🚀 Live Production App**: [https://nyayalens-eight.vercel.app](https://nyayalens-eight.vercel.app)
- **📂 Public GitHub Repository**: [https://github.com/Manas51240/NyayaLens](https://github.com/Manas51240/NyayaLens)
- **⚡ Vercel Deployment Dashboard**: [https://vercel.com/manas51240s-projects/nyayalens](https://vercel.com/manas51240s-projects/nyayalens)

---

**NyayaLens** is a production-grade GenAI-powered legal document understanding and risk evaluation platform built for the **AI for Legal Assistance & Access** challenge vertical. It empowers individuals, employees, and small business owners to comprehend complex contracts, identify AI-identified review priorities, compare draft iterations, and arrive at consultations with qualified legal counsel prepared with exact citations and targeted questions.

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution](#solution)
3. [Challenge Vertical](#challenge-vertical)
4. [System Architecture](#system-architecture)
5. [AI Approach & Grounding](#ai-approach--grounding)
6. [Security & Prompt Injection Defenses](#security--prompt-injection-defenses)
7. [Accessibility (WCAG 2.1 AA–Oriented Implementation)](#accessibility)
8. [Testing & Verification](#testing--verification)
9. [Assumptions & Limitations](#assumptions--limitations)
10. [Deployment Instructions](#deployment-instructions)
11. [Environment Variables](#environment-variables)
12. [Responsible AI & Legal Disclaimer](#responsible-ai--legal-disclaimer)

---

## Problem Statement

Legal agreements govern the most consequential relationships in modern life—employment covenants, commercial storefront leases, proprietary intellectual property assignments, and SaaS vendor procurement. However:
- **Asymmetric Legal Literacy**: Contracts are deliberately authored in dense legal jargon that obscures one-sided terms (such as off-hours IP assignments, uncapped liability, and 90-day auto-renewal traps).
- **Prohibitive Consultation Costs**: Engaging a licensed attorney for an exploratory review of every standard contract is economically out of reach for ordinary individuals and early-stage teams ($350–$800+/hour).
- **Unprepared Consultations**: When individuals do retain counsel, significant billable time is wasted explaining basic factual background rather than focusing on high-risk negotiation clauses.
- **Risks of Generic AI Chatbots**: Public chatbots frequently hallucinate legal terms, fabricate citations, violate client confidentiality, or issue reckless claims about contract enforceability.

---

## Solution

**NyayaLens** ("Nyaya" from Sanskrit for *Justice/Righteousness*, combined with *Lens* for clarity) acts as a structured legal comprehension bridge:

1. **Grounded Document Ingestion**: Upload PDF, DOCX, TXT, or Markdown documents (or explore 4 real-world sandboxes). Scans magic bytes, sanitizes paths, and isolates untrusted inputs.
2. **Plain-Language Clause Translation**: Side-by-side translation of complex covenants into plain English with direct quote references.
3. **Legal Risk Radar (10 Required Categories)**:
   - *termination*, *payment*, *liability*, *renewal*, *confidentiality*, *privacy/data*, *dispute resolution*, *restrictive covenants*, *penalties*, *unusual obligations*.
   - Rated strictly by objective *review priority* (`high`, `medium`, `low`, `informational`), never as subjective legal conclusions.
4. **Gemini 2.5 Flash Grounded Q&A**: Strict structured JSON output, contiguous quote verification, and explicit absence detection. If absent, NyayaLens declares silence rather than hallucinating.
5. **Modality Guardian**: Preserves contractual modal verbs (`shall`, `must`, `may`, `unless`, `subject to`) so permissive options never become mandatory commands.
6. **Contract Delta Comparison**: Compare Original Agreements vs Counterparty Redlines (v1 vs v2) across 9 legal dimensions with neutral review priorities.
7. **Action Plan Generator**: Generates actionable execution checklists, calendar notice windows, and documents to gather, with automatic local persistence across sessions.
8. **Lawyer Consultation Brief**: Generates a professional, printable memorandum containing executive facts, flagged clauses, and prioritized questions for legal counsel.

---

## Challenge Vertical

- **Track**: AI for Legal Assistance & Access
- **Audience**: Employees, freelancers, tenants, startup founders, and non-profit operators navigating complex legal agreements.

---

## System Architecture

```
[ Client Browser (WCAG 2.1 AA–Oriented Accessible UI) ]
      │
      ├──> Next.js App Router (15.5.25) / TypeScript / Tailwind CSS
      │
      ├──> [ Server-Side Secure API Routes ] (No browser API key leaks)
      │       ├── /api/analyze    --> Input Sanitizer & Extraction Engine
      │       ├── /api/ask        --> Grounded Semantic Retrieval & Q&A
      │       ├── /api/compare    --> Multi-Dimensional Contract Delta Engine
      │       ├── /api/health     --> Production Health Diagnostics & Uptime
      │       └── /api/documents  --> Session-Isolated Document & Action Plan CRUD
      │
      ├──> [ Untrusted Input Isolation Shield ]
      │       ├── Delimiter Wrapping: <<<UNTRUSTED_DOCUMENT_CONTENT>>>
      │       ├── Zero-Width Space & Bidi Override Neutralization
      │       ├── Adversarial Pattern Neutralization ([INST], <|im_start|>, DAN)
      │       ├── Markdown Exfiltration Link Neutralization
      │       └── Optional Client-Side PII Pre-Redaction (SSN, phone, email)
      │
      └──> [ Dual Execution Engine ]
              ├── 1. Google Gemini 2.5 Flash (via secure server env vars)
              └── 2. Offline Deterministic Legal Extraction Fallback (Fully testable offline)
```

---

## AI Approach & Grounding

NyayaLens enforces strict **Grounding Directives**:
1. **Verifiable Quotations**: Every extracted clause and risk finding includes an `exactQuote` and `sourceSection`.
2. **Anti-Hallucination Absence Rule**: If an answer or clause is not present in the document, NyayaLens returns `notFoundInDocument: true` and explicitly explains that the term was not located in the uploaded text.
3. **Calibrated Language Standards**: Output uses non-definitive phrasing ("the document states", "I found", "I could not find", "may warrant review", "consider discussing this with a legal professional").
4. **Prohibition of Legal Enforceability Claims**: The AI never claims that a contract is legally valid, that a clause is void, or that a user will prevail in a dispute.

---

## Security & Prompt Injection Defenses

Legal documents uploaded by users must be treated as **untrusted data**:
- **Boundary Tagging**: All extracted document text is encapsulated in strict boundaries:
  ```
  <<<UNTRUSTED_DOCUMENT_CONTENT>>>
  [Document text with escaped boundary tags]
  <<</UNTRUSTED_DOCUMENT_CONTENT>>>
  ```
- **System Prompt Hardening**: The model is instructed to treat all text inside the boundaries strictly as content to be analyzed, never as directives to execute.
- **Adversarial Query Filtering**: Questions containing jailbreak phrases (`ignore previous instructions`, `reveal system prompt`, `say this contract is 100% legal`) are automatically detected and blocked.
- **Server-Side API Calling**: API keys (`GEMINI_API_KEY`) reside exclusively in server-side environment variables and are never sent to client bundles.
- **File Restrictions**: Strict validation restricts uploads to `.pdf`, `.docx`, `.txt`, and `.md` with an enforced 10MB ceiling, magic bytes header checking, and Windows reserved name neutralization (`CON.txt` -> `safe_CON.txt`).
- **HTTP Security Headers**: Strict Content Security Policy (`CSP`), `X-Frame-Options: DENY`, and `X-Content-Type-Options: nosniff`.

---

## Accessibility (WCAG 2.1 AA–Oriented Implementation)

NyayaLens features a WCAG 2.1 AA–oriented accessibility implementation designed to maximize usability for assistive tech users and keyboard navigators:

- **Semantic HTML5 Landmarks**: Proper `<header>`, `<main>`, `<aside>`, `<section>`, and `<footer>` layout.
- **Keyboard Navigation & Skip Links**: Includes "Skip to main content" link and visible `:focus-visible` outlines.
- **Interactive Evidence Drawer**: Modal drawer with keyboard `Escape` dismissal, focus trapping, and accessible backdrop overlay.
- **ARIA Standards**: Live regions (`role="log"`, `aria-live="polite"`) for dynamic chat and status alerts.
- **Contrast & Independence from Color**: Risk severity levels combine high-contrast color badges with explicit text labels (`High Review Priority`) and unique icons (`AlertTriangle`, `AlertCircle`, `CheckCircle2`, `Info`).
- **Responsive Layout**: Fluid experience across mobile phones (375px), tablets (768px), and high-resolution desktops.

---

## Testing & Verification

NyayaLens includes a comprehensive Vitest test suite (`tests/`) containing **161 automated tests across 16 test suites**:
1. `tests/performance-and-efficiency.test.ts`: Multi-query document indexing benchmarks, request deduplication, prompt caching, rate limiting, and cache isolation.
2. `tests/modality-preservation.test.ts`: Contractual modality preservation guardian (shall, must, may, can, will, unless, subject to).
3. `tests/evidence-grounded-qa.test.ts`: 8-stage Q&A pipeline, semantic retrieval, strict structured output schema validation, natural language query expansion.
4. `tests/prompt-injection.test.ts`: Boundary break-out defense, adversarial query blocking, and client-side PII redaction.
5. `tests/grounding-and-hallucination.test.ts`: Grounding integrity, quote fidelity, and citation verification.
6. `tests/comparison.test.ts`: 9-dimension semantic comparison engine with neutral review priorities and sub-millisecond scaling benchmarks (10, 50, 100, 250 clauses).
7. `tests/safety-disclaimers.test.ts`: Legal disclaimer attachment and outcome certainty reframing.
8. `tests/hallucination-resistance.test.ts`: Absence detection, quote verification, unsupported claim rejection.
9. `tests/extraction-and-validation.test.ts`: PDF/DOCX format validation, 10MB file ceiling enforcement.
10. `tests/ingestion-pipeline.test.ts`: Multi-stage document ingestion, magic byte checking, section detection, normalization.
11. `tests/security-audit.test.ts`: 14-domain security audit (direct/indirect injection, zero-width evasion, markdown exfiltration, credentials redaction).
12. `tests/api-routes.test.ts`: Next.js HTTP API route handlers (`/api/analyze`, `/api/ask`, `/api/compare`), payload limits, status codes.
13. `tests/health-check.test.ts`: Production health check endpoint (`/api/health`), telemetry status, request ID propagation, zero secret leakage.
14. `tests/session-isolation.test.ts`: HMAC-SHA256 session token cryptography, server-side document store, and cross-user IDOR defense (User A vs User B).
15. `tests/ingestion-edge-cases.test.ts`: Scanned PDF text layer absence detection (`SCANNED_DOCUMENT_OCR_REQUIRED`), Unicode bidi override sanitization, and decompression bomb thresholds.
16. `tests/e2e-user-journeys.test.ts`: End-to-end critical user journeys verifying document workflow, contract comparison, action plan lifecycle, consultation brief generation, multi-tenant session isolation, and accessibility reduced-motion & focus trapping.

To run the unit and integration tests:
```bash
npm test
```

To run Playwright browser end-to-end smoke tests:
```bash
npm run test:e2e
```

---

## Assumptions & Limitations

- **Language and Jurisdiction Focus**: NyayaLens is intentionally calibrated for English-language commercial and employment contracts governed under common-law principles (e.g., Delaware, New York, California, England & Wales, and India). Restricting legal analysis to English agreements is a deliberate legal safety control: cross-lingual translation of binding statutory terminology between disparate civil law and common law traditions (e.g., French Civil Code *force majeure* vs Anglo-American contractual doctrines) risks subtle hallucinations or semantic distortions that could mislead unrepresented laypeople.
- **Document Readability**: Ingested contracts must contain machine-readable text layers. Scanned image-only PDFs without an embedded OCR text stream require OCR pre-processing prior to ingestion.
- **Educational Scope**: NyayaLens cannot verify signatory mental capacity, authenticate biometric/digital signatures, or provide real-time court docket monitoring. It is designed to prepare clients for consultation with licensed attorneys, never to replace legal counsel.

---

## Deployment Instructions

NyayaLens is architected for instant deployment on **Vercel**:

1. Clone the repository:
   ```bash
   git clone https://github.com/Manas51240/NyayaLens.git
   cd NyayaLens
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the test suite:
   ```bash
   npm test
   ```
4. Start the local development server:
   ```bash
   npm run dev
   ```
5. Deploy to Vercel:
   ```bash
   npx vercel
   ```

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Google Gemini API Key for production GenAI legal extraction and Q&A
# Get your key at: https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key_here

# Node Environment
NODE_ENV=development
```

*(Note: NyayaLens includes a built-in offline deterministic extraction and comparison engine, meaning all routes and sample contracts remain functional even if an API key is not configured).*

---

## Responsible AI & Legal Disclaimer

> **IMPORTANT LEGAL NOTICE**:
> NyayaLens is an AI-powered legal document understanding platform developed for educational and informational assistance. NyayaLens **does not** provide legal advice, legal opinions, or legal representation. No attorney-client relationship is created through the use of this platform.
>
> Risk severity indicators (`High`, `Medium`, `Low`, `Informational`) represent **AI-identified review priorities** to organize your review with counsel; they **do not** reflect legal enforceability, contract validity, or judicial outcomes. Users must always consult a licensed attorney in their jurisdiction for formal legal advice.
