# NYAYALENS

> **"Understand your legal documents. Know what matters. Take the next safe step."**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-nyayalens--eight.vercel.app-000000?style=for-the-badge&logo=vercel)](https://nyayalens-eight.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Manas51240%2FNyayaLens-181717?style=for-the-badge&logo=github)](https://github.com/Manas51240/NyayaLens)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.25-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Vitest-108%20Passed-emerald)](https://vitest.dev/)
[![WCAG](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-success)](#accessibility)

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
7. [Accessibility (WCAG 2.1 AA)](#accessibility)
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

1. **Grounded Document Ingestion**: Upload PDF, DOCX, TXT, or Markdown documents (or test with 4 pre-loaded real-world contracts).
2. **Plain-Language Clause Translation**: Side-by-side translation of complex covenants into plain English with direct quote references.
3. **Legal Risk Radar (10 Required Categories)**:
   - *termination*, *payment*, *liability*, *renewal*, *confidentiality*, *privacy/data*, *dispute resolution*, *restrictive covenants*, *penalties*, *unusual obligations*.
   - Clearly rated by AI-identified *review priority* (`high`, `medium`, `low`, `informational`), never as a legal enforceability judgment.
4. **Evidence-Grounded Inquiries (Ask Document)**: Questions are answered strictly using retrieved document evidence with page/section citations. If an item is absent from the text, NyayaLens explicitly issues an absence notice.
5. **Contract Delta Comparison**: Compare Original Agreements vs Counterparty Redlines (v1 vs v2) across 9 legal dimensions with neutral review priorities.
6. **Action Plan Generator**: Generates actionable execution checklists, calendar notice windows, and documents to gather, with automatic local persistence across sessions.
7. **Lawyer Consultation Brief**: Generates a professional, printable memorandum containing executive facts, flagged clauses, and prioritized questions for legal counsel.

---

## Challenge Vertical

- **Track**: AI for Legal Assistance & Access
- **Audience**: Employees, freelancers, tenants, startup founders, and non-profit operators navigating complex legal agreements.

---

## System Architecture

```
[ Client Browser (WCAG 2.1 AA Accessible UI) ]
      │
      ├──> Next.js App Router (15.5.25) / TypeScript / Tailwind CSS
      │
      ├──> [ Server-Side Secure API Routes ] (No browser API key leaks)
      │       ├── /api/analyze  --> Input Sanitizer & Extraction Engine
      │       ├── /api/ask      --> Grounded Semantic Retrieval & Q&A
      │       └── /api/compare  --> Multi-Dimensional Contract Delta Engine
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
              └── 2. Offline Deterministic Legal Extraction Fallback (100% testable offline)
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

## Accessibility (WCAG 2.1 AA)

- **Semantic HTML5 Landmarks**: Proper `<header>`, `<main>`, `<aside>`, `<section>`, and `<footer>` layout.
- **Keyboard Navigation & Skip Links**: Includes "Skip to main content" link and visible `:focus-visible` outlines.
- **Interactive Evidence Drawer**: Modal drawer with keyboard `Escape` dismissal, focus trapping, and accessible backdrop overlay.
- **ARIA Standards**: Live regions (`role="log"`, `aria-live="polite"`) for dynamic chat and status alerts.
- **Contrast & Independence from Color**: Risk severity levels combine high-contrast color badges with explicit text labels (`High Review Priority`) and unique icons (`AlertTriangle`, `AlertCircle`, `CheckCircle2`, `Info`).
- **Responsive Layout**: Fluid experience across mobile phones (375px), tablets (768px), and high-resolution desktops.

---

## Testing & Verification

NyayaLens includes a comprehensive Vitest test suite (`tests/`) containing **10 test suites and 108 automated tests**:
1. `tests/api-routes.test.ts`: Next.js HTTP API route handlers (`/api/analyze`, `/api/ask`, `/api/compare`), payload limits, status codes.
2. `tests/security-audit.test.ts`: 14-domain security audit (direct/indirect injection, zero-width evasion, markdown exfiltration, credentials redaction).
3. `tests/ingestion-pipeline.test.ts`: Multi-stage document ingestion, magic byte checking, section detection, normalization.
4. `tests/evidence-grounded-qa.test.ts`: 8-stage Q&A pipeline, semantic retrieval, quote citations, confidence scoring.
5. `tests/hallucination-resistance.test.ts`: Absence detection, quote verification, unsupported claim rejection.
6. `tests/grounding-and-hallucination.test.ts`: Grounding integrity and citation verification.
7. `tests/comparison.test.ts`: 9-dimension semantic comparison engine with neutral review priorities.
8. `tests/prompt-injection.test.ts`: Boundary break-out defense, adversarial query blocking, and client-side PII redaction.
9. `tests/safety-disclaimers.test.ts`: Legal disclaimer attachment and outcome certainty reframing.
10. `tests/extraction-and-validation.test.ts`: PDF/DOCX format validation, 10MB file ceiling enforcement.

To run the automated tests:
```bash
npm test
```

---

## Assumptions & Limitations

- **Assumptions**: Documents are in English and contain machine-readable text (scanned image-only PDFs without OCR text layers require OCR pre-processing).
- **Limitations**: NyayaLens cannot authenticate the signatures on a contract, verify the mental capacity of contracting parties, or provide local jurisdictional case law research outside general statutory awareness. It is an assistant for consultation preparation, not a digital lawyer.

---

## Deployment Instructions

NyayaLens is architected for instant deployment on **Vercel**:

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/nyayalens.git
   cd nyayalens
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
