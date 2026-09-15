'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckSquare,
  Calendar,
  HelpCircle,
  FolderPlus,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Filter,
  RotateCcw
} from 'lucide-react';
import { getStoredDocuments, getStoredDocumentById } from '@/lib/storage';
import { LegalDocument, ActionItem } from '@/types/legal';
import { AppShell } from '@/components/layout/AppShell';
import { EmptyState } from '@/components/common/EmptyState';

function ActionPlanContent() {
  const searchParams = useSearchParams();
  const docIdParam = searchParams.get('doc');
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const docs = getStoredDocuments();
    setDocuments(docs);
    let targetDocId = '';
    if (docIdParam && docs.some((d) => d.id === docIdParam)) {
      targetDocId = docIdParam;
    } else if (docs.length > 0) {
      targetDocId = docs[0].id;
    }
    setSelectedDocId(targetDocId);

    // Restore persisted checklist state from localStorage
    if (targetDocId && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`nyayalens_action_plan_${targetDocId}`);
        if (saved) {
          setCompletedItems(JSON.parse(saved));
        } else {
          setCompletedItems({});
        }
      } catch {
        setCompletedItems({});
      }
    }
    setMounted(true);
  }, [docIdParam]);

  const handleSelectDoc = (newDocId: string) => {
    setSelectedDocId(newDocId);
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`nyayalens_action_plan_${newDocId}`);
        if (saved) {
          setCompletedItems(JSON.parse(saved));
        } else {
          setCompletedItems({});
        }
      } catch {
        setCompletedItems({});
      }
    }
  };

  const toggleComplete = (itemId: string) => {
    setCompletedItems((prev) => {
      const updated = {
        ...prev,
        [itemId]: !prev[itemId],
      };
      if (selectedDocId && typeof window !== 'undefined') {
        try {
          localStorage.setItem(`nyayalens_action_plan_${selectedDocId}`, JSON.stringify(updated));
        } catch {
          // Gracefully handle storage quota
        }
      }
      return updated;
    });
  };

  const handleResetChecklist = () => {
    if (selectedDocId && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`nyayalens_action_plan_${selectedDocId}`);
      } catch {}
    }
    setCompletedItems({});
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const activeDoc = documents.find((d) => d.id === selectedDocId);

  if (!mounted) return null;

  if (!activeDoc) {
    return (
      <div className="py-16">
        <EmptyState type="empty-binder" />
      </div>
    );
  }

  const highPriorityActions = activeDoc.actionItems.filter((a) => a.priority === 'high');
  const mediumPriorityActions = activeDoc.actionItems.filter((a) => a.priority !== 'high');

  return (
    <AppShell
      activeDocumentId={activeDoc.id}
      breadcrumbs={[
        { label: 'Documents', href: '/app' },
        { label: activeDoc.title, href: `/app/document/${activeDoc.id}` },
        { label: 'Action Plan' },
      ]}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 print-page">
        {/* Header with Print Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6 no-print">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                Execution & Due Diligence Checklist
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Contract Action Plan
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Structured tasks, deadlines, and counsel questions for: <strong>{activeDoc.title}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {documents.length > 1 && (
              <select
                value={selectedDocId}
                onChange={(e) => handleSelectDoc(e.target.value)}
                className="text-xs p-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
                aria-label="Select document for action plan"
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleResetChecklist}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded-md transition-colors"
              title="Reset all checked items for this document"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Checklist</span>
            </button>
          </div>
        </div>

        {/* Print-Only Header */}
        <div className="hidden print:block mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold text-slate-900">Legal Action Plan & Checklist</h1>
          <p className="text-xs text-slate-600">Document: {activeDoc.title} ({activeDoc.fileName})</p>
          <p className="text-xs text-slate-600">Generated by NyayaLens AI for client review preparation</p>
        </div>

        {/* Section 1: High Priority Actions */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="text-base sm:text-lg font-bold">High Priority Immediate Actions</h2>
          </div>

          <div className="space-y-3">
            {highPriorityActions.map((item) => {
              const isDone = !!completedItems[item.id];
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg border transition-all ${
                    isDone
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : 'bg-white border-red-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => toggleComplete(item.id)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                      id={`check-${item.id}`}
                    />
                    <div className="space-y-1 flex-1">
                      <label
                        htmlFor={`check-${item.id}`}
                        className={`text-sm font-semibold cursor-pointer ${
                          isDone ? 'line-through text-slate-500' : 'text-slate-900'
                        }`}
                      >
                        {item.action}
                      </label>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                        {item.timeline && (
                          <span className="flex items-center gap-1 text-slate-600">
                            <Clock className="w-3 h-3" />
                            {item.timeline}
                          </span>
                        )}
                      </div>

                      {/* Documents to Gather */}
                      {item.documentsToGather && item.documentsToGather.length > 0 && (
                        <div className="mt-2 text-xs bg-slate-50 rounded p-2.5 border border-slate-200">
                          <span className="font-bold text-slate-700 block mb-0.5">
                            Supporting Documents to Gather for Attorney:
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                            {item.documentsToGather.map((doc, idx) => (
                              <li key={idx}>{doc}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: Review Items & Operational Tasks */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-slate-900">
            <CheckSquare className="w-5 h-5 text-amber-600" />
            <h2 className="text-base sm:text-lg font-bold">Operational Review Checklist</h2>
          </div>

          <div className="space-y-3">
            {mediumPriorityActions.map((item) => {
              const isDone = !!completedItems[item.id];
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg border transition-all ${
                    isDone
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => toggleComplete(item.id)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                      id={`check-${item.id}`}
                    />
                    <div className="space-y-1 flex-1">
                      <label
                        htmlFor={`check-${item.id}`}
                        className={`text-sm font-semibold cursor-pointer ${
                          isDone ? 'line-through text-slate-500' : 'text-slate-900'
                        }`}
                      >
                        {item.action}
                      </label>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                        {item.timeline && (
                          <span className="flex items-center gap-1 text-slate-600">
                            <Clock className="w-3 h-3" />
                            {item.timeline}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 3: Important Calendar Dates */}
        <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900">
            <Calendar className="w-4 h-4 text-slate-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Critical Dates & Notice Windows
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[10px] text-slate-500 uppercase tracking-wide block font-bold">
                Effective Date
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-900">
                {activeDoc.effectiveDate || 'Unspecified'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[10px] text-slate-500 uppercase tracking-wide block font-bold">
                Expiration / Term End
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-900">
                {activeDoc.expirationDate || 'Unspecified'}
              </span>
            </div>

            {activeDoc.keyDates?.map((kd, i) => (
              <div
                key={i}
                className={`p-3 rounded border ${
                  kd.isCritical
                    ? 'bg-red-50/70 border-red-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className={`text-[10px] uppercase tracking-wide block font-bold ${
                  kd.isCritical ? 'text-red-700' : 'text-slate-500'
                }`}>
                  {kd.label}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-900">
                  {kd.date}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Target Questions for Legal Professional */}
        <section className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2 text-slate-900">
            <HelpCircle className="w-4 h-4 text-slate-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Target Questions to Bring to Your Lawyer
            </h3>
          </div>
          <p className="text-xs text-slate-600">
            Bring these specific, grounded questions to your attorney meeting to prioritize high-risk terms and avoid unnecessary billable time.
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-800">
            {activeDoc.risks.map((r, idx) => (
              <li key={idx} className="bg-white border border-slate-200 rounded p-3 flex items-start gap-2.5">
                <span className="font-bold text-amber-700 shrink-0">Q{idx + 1}:</span>
                <div className="space-y-0.5">
                  <span className="font-medium italic text-slate-900">"{r.suggestedQuestionForLawyer}"</span>
                  <span className="text-[11px] text-slate-500 block">
                    Focus: {r.title} ({r.category})
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}

export default function ActionPlanPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-4 py-16 text-center text-xs text-slate-500">
          Loading Action Plan...
        </div>
      }
    >
      <ActionPlanContent />
    </Suspense>
  );
}
