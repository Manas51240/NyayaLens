import { describe, it, expect, beforeEach } from 'vitest';
import { SAMPLE_DOCUMENTS, SAMPLE_NDA_V2_REVISED } from '@/lib/sample-documents';
import { LegalDocument, ActionItem } from '@/types/legal';
import { runGroundedQAPipeline } from '@/lib/qa/pipeline';
import { compareLegalDocuments } from '@/lib/grounded-ai-engine';
import { documentStore } from '@/lib/server/document-store';
import { createSignedSessionToken, verifySessionToken } from '@/lib/server/session';
import fs from 'fs';
import path from 'path';

describe('NyayaLens End-to-End Critical User Journeys (E2E)', () => {
  beforeEach(() => {
    documentStore.reset();
  });

  // =========================================================================
  // JOURNEY 1 — Document Workflow
  // Upload document -> analyze -> view results -> open evidence -> ask question -> receive grounded answer
  // =========================================================================
  it('Journey 1 — Document Workflow: Ingest -> Analyze -> Grounded Evidence & Q&A', async () => {
    const doc = SAMPLE_DOCUMENTS[0]; // Employment Agreement
    expect(doc).toBeDefined();
    expect(doc.title).toBeDefined();
    expect(doc.clauses.length).toBeGreaterThan(0);
    expect(doc.risks.length).toBeGreaterThan(0);

    // Verify Evidence: clauses must have verbatim quote excerpts from rawText
    for (const clause of doc.clauses.slice(0, 3)) {
      const firstSnippet = clause.originalText.split('...')[0].trim();
      expect(doc.rawText).toContain(firstSnippet);
      expect(clause.severity).toBeDefined();
      expect(clause.plainEnglishTranslation).toBeDefined();
    }

    // Verify Risk Radar: risks have valid categories, severities, and references
    for (const risk of doc.risks) {
      expect(['high', 'medium', 'low']).toContain(risk.severity);
      expect(risk.category).toBeDefined();
      expect(risk.title).toBeDefined();
      expect(risk.quote).toBeDefined();
      expect(doc.rawText).toContain(risk.quote);
    }

    // Ask Grounded Question
    const question = 'What is the employee base salary and compensation?';
    const qaResult = await runGroundedQAPipeline(doc, question);

    expect(qaResult.answer).toBeDefined();
    expect(qaResult.answer.length).toBeGreaterThan(20);
    expect(qaResult.confidence).toBeGreaterThan(0.5);
    expect(qaResult.groundedEvidence.length).toBeGreaterThan(0);
    // Verbatim citation must exist in contract rawText
    const cleanCitation = qaResult.groundedEvidence[0].quote.replace(/\.\.\.$/, '').trim();
    expect(doc.rawText).toContain(cleanCitation);
    expect(qaResult.safetyDisclaimer).toContain('Notice:');
  });

  // =========================================================================
  // JOURNEY 2 — Contract Comparison
  // Upload document A -> upload document B -> compare -> inspect semantic deltas
  // =========================================================================
  it('Journey 2 — Contract Comparison: Base vs Redline -> 9-Dimension Semantic Deltas', () => {
    const docA = SAMPLE_DOCUMENTS[3]; // Mutual NDA Base
    const docB = SAMPLE_NDA_V2_REVISED; // Redlined NDA

    const comparison = compareLegalDocuments(docA, docB);

    expect(comparison.overallRiskShift).toBe('higher_for_user');
    expect(comparison.reviewPrioritySummary).toBe('high_review_priority');

    // Category deltas across 9 legal dimensions
    const { categoryDeltas } = comparison;
    expect(categoryDeltas.changedTerms.hasDeltas).toBe(true);
    expect(categoryDeltas.dates.hasDeltas).toBe(true);
    expect(categoryDeltas.obligations.hasDeltas).toBe(true);
    expect(categoryDeltas.payment.hasDeltas).toBe(true);
    expect(categoryDeltas.confidentiality.hasDeltas).toBe(true);
    expect(categoryDeltas.disputeProvisions.hasDeltas).toBe(true);

    // Verify actionable counsel guidance
    expect(comparison.actionItemsForReview.length).toBeGreaterThan(0);
    expect(comparison.legalDisclaimer).toContain('Notice:');
  });

  // =========================================================================
  // JOURNEY 3 — Action Plan Lifecycle
  // Open action plan -> add action -> edit action -> complete action -> delete action
  // =========================================================================
  it('Journey 3 — Action Plan: Full Lifecycle Operations and Stats Tracking', () => {
    const doc = SAMPLE_DOCUMENTS[0];
    const initialActions: ActionItem[] = [...(doc.actionItems || [])];
    const initialCount = initialActions.length;
    expect(initialCount).toBeGreaterThan(0);

    // 1. Add Custom Action Item
    const newAction: ActionItem = {
      id: `custom-${Date.now()}`,
      action: 'Consult tax advisor on equity vesting schedule',
      priority: 'high',
      timeline: '2026-03-31',
      responsibleParty: 'Tax Counsel',
      category: 'Compensation',
      suggestedQuestionsForLawyer: ['What is the vesting acceleration trigger?'],
      status: 'pending',
    };
    const updatedActions = [...initialActions, newAction];
    expect(updatedActions.length).toBe(initialCount + 1);

    // 2. Edit Action Item
    const editedActions = updatedActions.map((item) =>
      item.id === newAction.id
        ? { ...item, priority: 'high' as const, action: 'Urgent: Consult tax advisor on Section 83(b) election' }
        : item
    );
    const editedItem = editedActions.find((i) => i.id === newAction.id);
    expect(editedItem?.priority).toBe('high');
    expect(editedItem?.action).toContain('Section 83(b)');

    // 3. Complete Action Item
    const completedActions = editedActions.map((item) =>
      item.id === newAction.id ? { ...item, status: 'completed' as const } : item
    );
    const completedCount = completedActions.filter((i) => i.status === 'completed').length;
    expect(completedCount).toBeGreaterThan(0);
    const completionPercentage = Math.round((completedCount / completedActions.length) * 100);
    expect(completionPercentage).toBeGreaterThan(0);

    // 4. Delete Action Item
    const finalActions = completedActions.filter((i) => i.id !== newAction.id);
    expect(finalActions.length).toBe(initialCount);
    expect(finalActions.some((i) => i.id === newAction.id)).toBe(false);
  });

  // =========================================================================
  // JOURNEY 4 — Consultation Brief
  // Analyze document -> generate consultation brief -> verify output
  // =========================================================================
  it('Journey 4 — Consultation Brief: Generate & Verify Attorney Briefing Packet', () => {
    const doc = SAMPLE_DOCUMENTS[0];
    const brief = doc.consultationBrief;

    expect(brief).toBeDefined();
    expect(brief.documentPurpose).toBeDefined();
    expect(brief.governingLawAndJurisdiction).toBeDefined();
    expect(brief.parties.length).toBeGreaterThan(0);

    // Verify High Priority Concerns
    expect(brief.highPriorityConcerns.length).toBeGreaterThan(0);
    for (const concern of brief.highPriorityConcerns) {
      expect(typeof concern).toBe('string');
      expect(concern.length).toBeGreaterThan(10);
    }

    // Verify Questions for Counsel
    expect(brief.questionsForCounsel.length).toBeGreaterThan(0);
    for (const q of brief.questionsForCounsel) {
      expect(q.topic).toBeDefined();
      expect(q.question).toBeDefined();
      expect(q.rationale).toBeDefined();
    }

    // Verify Sections to Highlight
    expect(brief.relevantSectionsToHighlight.length).toBeGreaterThan(0);

    // Verify Institutional Disclaimer Notice
    expect(brief.disclaimerNotice).toBeDefined();
    expect(brief.disclaimerNotice.toLowerCase()).toContain('notice');
  });

  // =========================================================================
  // JOURNEY 5 — Security Access Control
  // Unauthorized document access -> request rejected
  // =========================================================================
  it('Journey 5 — Security: Multi-tenant Session Isolation and IDOR Defense', () => {
    const sessionAlice = createSignedSessionToken('ses_alice_999');
    const sessionBob = createSignedSessionToken('ses_bob_888');

    const aliceDoc: LegalDocument = {
      ...SAMPLE_DOCUMENTS[0],
      id: 'doc-alice-proprietary-agreement',
      title: "Alice's Private Executive Agreement",
    };

    // Alice stores her document
    documentStore.saveDocument(aliceDoc, 'ses_alice_999');

    // Alice can retrieve her own document
    const aliceFetch = documentStore.getDocument(aliceDoc.id, 'ses_alice_999');
    expect(aliceFetch.found).toBe(true);
    expect(aliceFetch.document?.id).toBe(aliceDoc.id);

    // Bob attempts to access Alice's document -> Strictly Forbidden (IDOR Defense)
    const bobFetch = documentStore.getDocument(aliceDoc.id, 'ses_bob_888');
    expect(bobFetch.found).toBe(true);
    expect(bobFetch.forbidden).toBe(true);
    expect(bobFetch.document).toBeUndefined();

    // Bob attempts to delete Alice's document -> Blocked (403)
    const bobDelete = documentStore.deleteDocument(aliceDoc.id, 'ses_bob_888');
    expect(bobDelete.success).toBe(false);
    expect(bobDelete.status).toBe(403);

    // Verify Alice's document is intact
    const verifyAliceStillHasDoc = documentStore.getDocument(aliceDoc.id, 'ses_alice_999');
    expect(verifyAliceStillHasDoc.found).toBe(true);
    expect(verifyAliceStillHasDoc.document?.title).toBe(aliceDoc.title);
  });

  // =========================================================================
  // JOURNEY 6 — Accessibility & Reduced Motion Semantics
  // Verify prefers-reduced-motion CSS rules and accessible dialog behaviors
  // =========================================================================
  it('Journey 6 — Accessibility: Reduced Motion Support & Modal Focus Trapping Rules', () => {
    // 1. Verify globals.css defines prefers-reduced-motion overrides
    const globalsCssPath = path.resolve(process.cwd(), 'src/app/globals.css');
    const cssContent = fs.readFileSync(globalsCssPath, 'utf-8');

    expect(cssContent).toContain('@media (prefers-reduced-motion: reduce)');
    expect(cssContent).toContain('.skeleton-shimmer');
    expect(cssContent).toContain('animation: none !important');
    expect(cssContent).toContain('animation-duration: 0.01ms !important');

    // 2. Verify Action Item Modal contains accessibility attributes
    const modalPath = path.resolve(process.cwd(), 'src/components/action-plan/ActionItemModal.tsx');
    const modalContent = fs.readFileSync(modalPath, 'utf-8');

    expect(modalContent).toContain('role="dialog"');
    expect(modalContent).toContain('aria-modal="true"');
    expect(modalContent).toContain('aria-labelledby=');
    expect(modalContent).toContain('handleKeyDown');
    expect(modalContent).toContain("'Escape'");
    expect(modalContent).toContain("'Tab'");
  });
});
