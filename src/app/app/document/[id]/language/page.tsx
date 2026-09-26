'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Scale,
  Radar,
  MessageSquareText,
  Filter,
  Search,
  CheckCircle2,
  Info,
  ShieldAlert,
  ArrowRight,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { getStoredDocumentById, saveStoredDocument } from '@/lib/storage';
import { LegalDocument } from '@/types/legal';
import { analyzeLegalLanguage, LegalLanguageSummary, ModalityCategory } from '@/lib/legal-language';
import { AppShell } from '@/components/layout/AppShell';
import { DocumentNavTabs } from '@/components/document/DocumentNavTabs';
import { WorkspaceSkeleton } from '@/components/common/SkeletonLoaders';
import { EmptyState } from '@/components/common/EmptyState';

export default function LegalLanguageAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [doc, setDoc] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<ModalityCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [analysis, setAnalysis] = useState<LegalLanguageSummary | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const found = getStoredDocumentById(id);
    if (found) {
      setDoc(found);
      const res = analyzeLegalLanguage(found.rawText || '');
      setAnalysis(res);
      setLoading(false);
      return;
    }

    // Try fetching from server
    fetch(`/api/documents/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.document) {
          setDoc(data.document);
          saveStoredDocument(data.document);
          const res = analyzeLegalLanguage(data.document.rawText || '');
          setAnalysis(res);
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <WorkspaceSkeleton />
      </AppShell>
    );
  }

  if (!doc || !analysis) {
    return (
      <AppShell>
        <div className="py-16">
          <EmptyState type="doc-not-found" />
        </div>
      </AppShell>
    );
  }

  const highRisks = (doc.risks || []).filter((r) => r.severity === 'high');

  // Filter occurrences
  const filteredOccurrences = analysis.occurrences.filter((occ) => {
    const matchesCategory = activeCategory === 'all' || occ.category === activeCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      occ.sentence.toLowerCase().includes(searchQuery.toLowerCase()) ||
      occ.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      occ.sourceSection.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <AppShell
      activeDocumentId={doc.id}
      breadcrumbs={[
        { label: 'Documents', href: '/app' },
        { label: doc.title, href: `/app/document/${doc.id}` },
        { label: 'Legal Language (MAY/MUST/SHALL)' },
      ]}
    >
      <div className="space-y-6">
        {/* Document Header Bar */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="text-xs font-mono bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded font-semibold uppercase">
                    {doc.documentType}
                  </span>
                  <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded">
                    Operative Language Analysis
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Scale className="w-6 h-6 text-indigo-600" />
                  <span>Contractual Modality & Legal Language</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Analysis of mandatory duties (SHALL, MUST), permissive rights (MAY), strict prohibitions, and conditions precedent in {doc.fileName}.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/app/document/${doc.id}/risks`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 text-xs font-semibold transition-colors"
                >
                  <Radar className="w-3.5 h-3.5 text-red-600" />
                  <span>Risk Radar ({doc.risks?.length || 0})</span>
                </Link>
                <Link
                  href={`/app/document/${doc.id}/ask`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-2xs"
                >
                  <MessageSquareText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ask Document</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Subnavigation Tabs */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <DocumentNavTabs documentId={doc.id} riskCount={highRisks.length} />
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-6">
          {/* Institutional Disclaimer */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-4 flex items-start gap-3 text-xs text-amber-950 shadow-2xs">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Document Analysis & Operative Language Notice</p>
              <p className="text-amber-900 leading-relaxed">
                {analysis.disclaimer}
              </p>
            </div>
          </div>

          {/* Metrics Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Mandatory Duties */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Mandatory Duties
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-indigo-50 text-indigo-700">
                  SHALL / MUST
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {analysis.mandatoryCount}
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Binding affirmative contractual covenants
              </p>
            </div>

            {/* Permissive Rights */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Permissive Rights
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-50 text-emerald-700">
                  MAY / CAN
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-700">
                {analysis.permissiveCount}
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Discretionary privileges and options
              </p>
            </div>

            {/* Prohibitions */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Prohibitions
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-red-50 text-red-700">
                  SHALL NOT
                </span>
              </div>
              <div className="text-2xl font-black text-red-600">
                {analysis.prohibitionCount}
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Negative covenants and barred conduct
              </p>
            </div>

            {/* Conditional Precedents */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Conditions
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-50 text-amber-700">
                  SUBJECT TO
                </span>
              </div>
              <div className="text-2xl font-black text-amber-600">
                {analysis.conditionalCount}
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Contingencies, qualifiers and exceptions
              </p>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeCategory === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                All Modality Markers ({analysis.occurrences.length})
              </button>
              <button
                onClick={() => setActiveCategory('mandatory')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeCategory === 'mandatory'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                Mandatory (SHALL / MUST) ({analysis.mandatoryCount})
              </button>
              <button
                onClick={() => setActiveCategory('permissive')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeCategory === 'permissive'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                Permissive (MAY) ({analysis.permissiveCount})
              </button>
              <button
                onClick={() => setActiveCategory('prohibition')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeCategory === 'prohibition'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                Prohibitions ({analysis.prohibitionCount})
              </button>
              <button
                onClick={() => setActiveCategory('conditional')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeCategory === 'conditional'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                Conditions ({analysis.conditionalCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contractual text..."
                className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Clauses List */}
          <div className="space-y-4">
            {filteredOccurrences.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-lg p-10 text-center space-y-2">
                <CheckCircle2 className="w-6 h-6 text-slate-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">No Clauses Found</h3>
                <p className="text-xs text-slate-500">
                  No contractual modality markers match your selected category or search filter.
                </p>
              </div>
            ) : (
              filteredOccurrences.map((occ) => {
                // Color badges
                const termBadge =
                  occ.category === 'mandatory'
                    ? 'bg-indigo-100 text-indigo-900 border-indigo-200'
                    : occ.category === 'permissive'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                    : occ.category === 'prohibition'
                    ? 'bg-red-100 text-red-900 border-red-200'
                    : 'bg-amber-100 text-amber-900 border-amber-200';

                return (
                  <div
                    key={occ.id}
                    className="bg-white border border-slate-200 rounded-lg p-5 space-y-3 shadow-2xs hover:border-slate-300 transition-colors"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${termBadge}`}>
                          {occ.term}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                          {occ.categoryLabel}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-bold text-slate-800">
                          {occ.sourceSection}
                        </span>
                      </div>

                      {occ.bindingParty && (
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          Party: {occ.bindingParty}
                        </span>
                      )}
                    </div>

                    {/* Sentence */}
                    <div className="p-3 bg-slate-50 rounded border border-slate-200/80 font-serif text-xs sm:text-sm text-slate-900 leading-relaxed">
                      &ldquo;{occ.sentence}&rdquo;
                    </div>

                    {/* Operative Force Explanation */}
                    <div className="text-xs text-slate-600 flex items-start gap-2 pt-1 border-t border-slate-100">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900">Operative Legal Effect: </strong>
                        <span>{occ.operativeForceExplanation}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
