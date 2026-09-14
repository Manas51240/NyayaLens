'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GitCompare,
  ArrowRight,
  Plus,
  Minus,
  AlertTriangle,
  Scale,
  Calendar,
  DollarSign,
  Shield,
  RotateCcw,
  Sparkles,
  Layers,
  Clock,
  FileText,
  HelpCircle,
  CheckCircle2,
  Filter,
  Info,
} from 'lucide-react';
import { LegalDocument, ComparisonResult, SemanticDeltaItem } from '@/types/legal';
import { getStoredDocuments } from '@/lib/storage';
import { SAMPLE_DOCUMENTS, SAMPLE_NDA_V2_REVISED } from '@/lib/sample-documents';
import { AppShell } from '@/components/layout/AppShell';

const DIMENSION_TABS: { key: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'all', label: 'All Dimensions', icon: Layers },
  { key: 'changed_terms', label: 'Changed Terms', icon: FileText },
  { key: 'dates', label: 'Dates & Timelines', icon: Calendar },
  { key: 'obligations', label: 'Obligations', icon: CheckCircle2 },
  { key: 'payment', label: 'Payment & Damages', icon: DollarSign },
  { key: 'termination', label: 'Termination', icon: Clock },
  { key: 'liability', label: 'Liability', icon: Shield },
  { key: 'renewal', label: 'Renewal', icon: RotateCcw },
  { key: 'confidentiality', label: 'Confidentiality', icon: Scale },
  { key: 'dispute_provisions', label: 'Dispute Provisions', icon: HelpCircle },
];

export default function ComparePage() {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [docAId, setDocAId] = useState<string>('');
  const [docBId, setDocBId] = useState<string>('');
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    const stored = getStoredDocuments();
    const existsRevised = stored.some((d) => d.id === SAMPLE_NDA_V2_REVISED.id);
    const fullList = existsRevised ? stored : [...stored, SAMPLE_NDA_V2_REVISED];
    setDocuments(fullList);

    const nda1 = fullList.find((d) => d.id === 'sample-nda-mutual');
    const nda2 = fullList.find((d) => d.id === 'sample-nda-vendor-revised');

    if (nda1 && nda2) {
      setDocAId(nda1.id);
      setDocBId(nda2.id);
      triggerCompare(nda1, nda2);
    } else if (fullList.length >= 2) {
      setDocAId(fullList[0].id);
      setDocBId(fullList[1].id);
      triggerCompare(fullList[0], fullList[1]);
    }
    setMounted(true);
  }, []);

  const triggerCompare = async (a: LegalDocument, b: LegalDocument) => {
    setLoading(true);
    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docA: a, docB: b }),
      });
      const data = await res.json();
      if (data.comparison) {
        setComparison(data.comparison);
      }
    } catch (e) {
      console.error('Comparison call failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRunComparison = () => {
    const a = documents.find((d) => d.id === docAId);
    const b = documents.find((d) => d.id === docBId);
    if (a && b) {
      triggerCompare(a, b);
    }
  };

  const handleSwap = () => {
    const prevA = docAId;
    const prevB = docBId;
    setDocAId(prevB);
    setDocBId(prevA);
    const a = documents.find((d) => d.id === prevB);
    const b = documents.find((d) => d.id === prevA);
    if (a && b) triggerCompare(a, b);
  };

  if (!mounted) return null;

  // Flatten all semantic delta items from categoryDeltas
  const allDeltaItems: SemanticDeltaItem[] = comparison?.categoryDeltas
    ? Object.values(comparison.categoryDeltas).flatMap((cat) => cat.items)
    : [];

  const filteredDeltas =
    activeTab === 'all'
      ? allDeltaItems
      : allDeltaItems.filter((item) => item.category === activeTab);

  return (
    <AppShell breadcrumbs={[{ label: 'Contract Comparison' }]}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
              <GitCompare className="w-6 h-6 text-indigo-600" />
              <span>Semantic Document Comparison</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Compare contractual terms semantically across 9 core legal dimensions with exact source references and neutral review priorities.
            </p>
          </div>
        </div>

        {/* Selectors Bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Document A (Baseline / Base Draft)
              </label>
              <select
                value={docAId}
                onChange={(e) => setDocAId(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white font-medium"
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.fileName})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-center pt-2 md:pt-4">
              <button
                onClick={handleSwap}
                className="p-2 border border-slate-300 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
                title="Swap Document A and Document B"
                aria-label="Swap Document A and Document B"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Document B (Counterparty Redline / Target)
              </label>
              <select
                value={docBId}
                onChange={(e) => setDocBId(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white font-medium"
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.fileName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleRunComparison}
              disabled={loading || !docAId || !docBId || docAId === docBId}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-md shadow-xs transition-colors"
            >
              <span>Run Semantic Comparison</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>

        {loading && (
          <div className="p-12 text-center bg-white rounded-lg border border-slate-200">
            <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Analyzing semantic deltas across 9 legal dimensions...
            </p>
          </div>
        )}

        {/* Comparison Results */}
        {!loading && comparison && (
          <div className="space-y-8">
            {/* Executive Synthesis Banner */}
            <div className="bg-slate-900 text-white rounded-lg p-6 space-y-3 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Semantic Comparison Synthesis
                </span>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                    comparison.reviewPrioritySummary === 'high_review_priority'
                      ? 'bg-amber-500 text-slate-950'
                      : comparison.reviewPrioritySummary === 'medium_review_priority'
                      ? 'bg-indigo-500 text-white'
                      : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {comparison.reviewPrioritySummary === 'high_review_priority'
                    ? 'High Review Priority Items Detected'
                    : comparison.reviewPrioritySummary === 'medium_review_priority'
                    ? 'Moderate Review Priority'
                    : 'Routine Drafting Variations'}
                </span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-200">
                {comparison.executiveSummary}
              </p>
            </div>

            {/* Neutral Framing Disclaimer Notice */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-4 flex items-start gap-3 text-xs text-amber-950">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Institutional Review Priority Notice</p>
                <p className="text-amber-900 leading-relaxed">
                  {comparison.legalDisclaimer ||
                    'Notice: This comparison highlights contractual variations and attorney review priorities based on semantic text analysis. NyayaLens does not characterize changes as legally definitive determinations of rights, remedies, or business favorability. Please review all modifications with qualified legal counsel.'}
                </p>
              </div>
            </div>

            {/* 9-Dimension Filter Pills Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <span>9 Legal Comparison Dimensions</span>
                </h2>
                <span className="text-xs text-slate-500 font-medium">
                  {allDeltaItems.length} total contractual {allDeltaItems.length === 1 ? 'delta' : 'deltas'} detected
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                {DIMENSION_TABS.map((tab) => {
                  const count =
                    tab.key === 'all'
                      ? allDeltaItems.length
                      : allDeltaItems.filter((i) => i.category === tab.key).length;
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.key;

                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isActive
                            ? 'bg-slate-800 text-amber-300'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Semantic Deltas Grid / List */}
            {filteredDeltas.length === 0 ? (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-lg space-y-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">No Variations in Selected Dimension</h3>
                <p className="text-xs text-slate-500">
                  Document A and Document B contain equivalent terms for this dimension.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDeltas.map((delta) => {
                  const priorityBg =
                    delta.reviewPriority === 'high'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : delta.reviewPriority === 'medium'
                      ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                      : 'bg-slate-100 text-slate-800 border-slate-200';

                  const priorityLabel =
                    delta.reviewPriority === 'high'
                      ? 'High Review Priority'
                      : delta.reviewPriority === 'medium'
                      ? 'Medium Review Priority'
                      : 'Routine Variation';

                  return (
                    <div
                      key={delta.id}
                      className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-2xs hover:border-slate-300 transition-colors"
                    >
                      {/* Top Meta Bar */}
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {delta.category.replace(/_/g, ' ')}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${priorityBg}`}>
                              {priorityLabel}
                            </span>
                          </div>
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1.5">
                            {delta.title}
                          </h3>
                        </div>

                        {/* Source Citations */}
                        <div className="flex items-center gap-2 text-xs">
                          {delta.sourceRefA && (
                            <span className="px-2 py-1 bg-slate-100 rounded text-slate-700 font-mono text-[11px]">
                              Doc A: {delta.sourceRefA}
                            </span>
                          )}
                          {delta.sourceRefB && (
                            <span className="px-2 py-1 bg-amber-50 border border-amber-200 rounded text-amber-900 font-mono text-[11px]">
                              Doc B: {delta.sourceRefB}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Side-by-Side Comparison Panels */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                          <span className="font-semibold text-slate-500 block uppercase text-[10px] tracking-wider">
                            Document A Baseline:
                          </span>
                          <p className="text-slate-800 font-serif leading-relaxed text-xs">
                            {delta.quoteA || delta.docAContent}
                          </p>
                        </div>

                        <div className="p-3 bg-amber-50/50 border border-amber-200/80 rounded space-y-1">
                          <span className="font-semibold text-amber-900 block uppercase text-[10px] tracking-wider">
                            Document B Redline:
                          </span>
                          <p className="text-slate-900 font-serif leading-relaxed text-xs">
                            {delta.quoteB || delta.docBContent}
                          </p>
                        </div>
                      </div>

                      {/* Objective Explanation */}
                      <div className="text-xs text-slate-700 pt-1 leading-relaxed">
                        <strong className="text-slate-900">Contractual Shift: </strong>
                        <span>{delta.objectiveExplanation}</span>
                      </div>

                      {/* Counsel Discussion Prompt */}
                      {delta.counselDiscussionPrompt && (
                        <div className="text-xs text-amber-950 bg-amber-50/80 border border-amber-200/90 rounded-md p-3 flex items-start gap-2.5">
                          <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-amber-900 block">Question for Legal Counsel:</span>
                            <span className="leading-relaxed">{delta.counselDiscussionPrompt}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Additions and Removals Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Additions */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 text-emerald-800">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wide">
                    Provisions Added in Document B ({comparison.additions.length})
                  </h3>
                </div>
                <ul className="space-y-2 text-xs text-slate-700">
                  {comparison.additions.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-emerald-50/60 border border-emerald-200/60 rounded p-2.5">
                      <span className="text-emerald-700 font-bold">+</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Removals */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 text-red-800">
                  <Minus className="w-4 h-4 text-red-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wide">
                    Provisions Removed or Stricken ({comparison.removals.length})
                  </h3>
                </div>
                <ul className="space-y-2 text-xs text-slate-700">
                  {comparison.removals.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-red-50/60 border border-red-200/60 rounded p-2.5">
                      <span className="text-red-700 font-bold">-</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Items for Review */}
            {comparison.actionItemsForReview && comparison.actionItemsForReview.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3 shadow-2xs">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  <span>Prioritized Negotiation & Consultation Checklist</span>
                </h3>
                <ul className="space-y-2 text-xs text-slate-700">
                  {comparison.actionItemsForReview.map((act, idx) => (
                    <li key={idx} className="flex items-start gap-2 p-2 bg-slate-50 border border-slate-200 rounded">
                      <span className="font-bold text-indigo-600">{idx + 1}.</span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
