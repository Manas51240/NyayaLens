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
  Layers
} from 'lucide-react';
import { LegalDocument, ComparisonResult } from '@/types/legal';
import { getStoredDocuments } from '@/lib/storage';
import { SAMPLE_DOCUMENTS, SAMPLE_NDA_V2_REVISED } from '@/lib/sample-documents';
import { AppShell } from '@/components/layout/AppShell';

export default function ComparePage() {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [docAId, setDocAId] = useState<string>('');
  const [docBId, setDocBId] = useState<string>('');
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

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

  return (
    <AppShell breadcrumbs={[{ label: 'Contract Comparison' }]}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
              <GitCompare className="w-6 h-6 text-indigo-600" />
              <span>Contract & Document Comparison</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Analyze semantic deltas between contract iterations, redlines, and competitor terms.
            </p>
          </div>
        </div>

        {/* Selectors Bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Document A (Base / Original)
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
                Document B (Amended / Counterparty Redline)
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
              <span>Run Delta Comparison</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>

        {loading && (
          <div className="p-12 text-center bg-white rounded-lg border border-slate-200">
            <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Computing semantic diff across 7 legal dimensions...
            </p>
          </div>
        )}

        {/* Comparison Results */}
        {!loading && comparison && (
          <div className="space-y-8">
            {/* Executive Delta Summary */}
            <div className="bg-slate-900 text-white rounded-lg p-6 space-y-3 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Comparison Synthesis
                </span>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                    comparison.overallRiskShift === 'higher_for_user'
                      ? 'bg-red-500 text-white'
                      : comparison.overallRiskShift === 'lower_for_user'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {comparison.overallRiskShift === 'higher_for_user'
                    ? 'Higher Review Priority in Doc B'
                    : comparison.overallRiskShift === 'lower_for_user'
                    ? 'Lower Risk Shift'
                    : 'Balanced Variation'}
                </span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-200">
                {comparison.executiveSummary}
              </p>
            </div>

            {/* Additions and Removals */}
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
                    Provisions Removed or Deleted ({comparison.removals.length})
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

            {/* Changed Clauses Breakdown */}
            {comparison.changedClauses.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Changed Contractual Clauses
                </h3>
                <div className="space-y-4">
                  {comparison.changedClauses.map((change, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-lg p-5 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-slate-900">
                          {change.title}
                        </h4>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                          {change.category}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                          <span className="font-semibold text-slate-500 block mb-1">
                            Document A Version:
                          </span>
                          <p className="text-slate-800 font-serif text-xs leading-relaxed">
                            {change.docAContent}
                          </p>
                        </div>

                        <div className="p-3 bg-amber-50/60 border border-amber-200 rounded">
                          <span className="font-semibold text-amber-900 block mb-1">
                            Document B Redline:
                          </span>
                          <p className="text-slate-800 font-serif text-xs leading-relaxed">
                            {change.docBContent}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 pt-1">
                        <strong>Impact:</strong> {change.explanation}
                      </p>

                      {change.recommendation && (
                        <div className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded p-2.5">
                          <strong>Negotiation Recommendation:</strong> {change.recommendation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financial & Liability Shifts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Changed Financial Obligations */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 text-slate-800">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wide">
                    Changed Financial Obligations
                  </h3>
                </div>
                {comparison.changedFinancialObligations.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No direct financial changes detected.</p>
                ) : (
                  <ul className="space-y-2 text-xs">
                    {comparison.changedFinancialObligations.map((item, idx) => (
                      <li key={idx} className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-1">
                        <strong className="block text-slate-900">{item.description}</strong>
                        <div className="text-slate-600">
                          <span className="text-slate-400">Doc A:</span> {item.docA}
                        </div>
                        <div className="text-slate-800 font-medium">
                          <span className="text-amber-600">Doc B:</span> {item.docB}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Changed Liability Provisions */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 text-slate-800">
                  <Shield className="w-4 h-4 text-red-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wide">
                    Changed Liability Provisions
                  </h3>
                </div>
                {comparison.changedLiabilityProvisions.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No liability modifications detected.</p>
                ) : (
                  <ul className="space-y-2 text-xs">
                    {comparison.changedLiabilityProvisions.map((item, idx) => (
                      <li key={idx} className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-1">
                        <strong className="block text-slate-900">{item.description}</strong>
                        <div className="text-slate-600 line-clamp-2">
                          <span className="text-slate-400">Doc A:</span> {item.docA}
                        </div>
                        <div className="text-slate-800 font-medium line-clamp-2">
                          <span className="text-red-600">Doc B:</span> {item.docB}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
