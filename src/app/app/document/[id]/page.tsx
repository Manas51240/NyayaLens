'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Calendar,
  Building,
  Scale,
  AlertTriangle,
  Clock,
  ArrowRight,
  Radar,
  MessageSquareText,
  CheckSquare,
  Briefcase,
  Layers,
  Sparkles,
  Search,
  ExternalLink
} from 'lucide-react';
import { getStoredDocumentById, saveStoredDocument } from '@/lib/storage';
import { LegalDocument, ImportantClause } from '@/types/legal';
import { AppShell } from '@/components/layout/AppShell';
import { DocumentNavTabs } from '@/components/document/DocumentNavTabs';
import { GroundedClauseCard } from '@/components/document/GroundedClauseCard';
import { ObligationsTable } from '@/components/document/ObligationsTable';
import { EvidenceDrawer } from '@/components/document/EvidenceDrawer';
import { WorkspaceSkeleton } from '@/components/common/SkeletonLoaders';
import { EmptyState } from '@/components/common/EmptyState';

export default function DocumentOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [doc, setDoc] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [inspectClause, setInspectClause] = useState<ImportantClause | null>(null);

  useEffect(() => {
    if (id) {
      const found = getStoredDocumentById(id);
      if (found) {
        setDoc(found);
        setLoading(false);
        return;
      }

      // Try fetching from server session storage
      fetch(`/api/documents/${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.document) {
            setDoc(data.document);
            saveStoredDocument(data.document);
          }
        })
        .catch(() => {})
        .finally(() => {
          setLoading(false);
        });
      return;
    }
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <WorkspaceSkeleton />
      </AppShell>
    );
  }

  if (!doc) {
    return (
      <AppShell>
        <div className="py-16">
          <EmptyState type="doc-not-found" />
        </div>
      </AppShell>
    );
  }

  const highRisks = (doc.risks || []).filter((r) => r.severity === 'high');

  return (
    <AppShell
      activeDocumentId={doc.id}
      breadcrumbs={[
        { label: 'Documents', href: '/app' },
        { label: doc.title },
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
                  {doc.jurisdiction && (
                    <span className="text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                      Jurisdiction: {doc.jurisdiction}
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-mono">
                    {doc.fileName}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {doc.title}
                </h1>
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

        {/* Main Content Workspace Layout (Dual Pane on wide screens) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Columns: Core Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Plain-Language Executive Summary */}
              <section className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Plain-Language Executive Summary
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
                  {doc.plainLanguageSummary}
                </p>
              </section>

              {/* High-Priority Review Radar Highlights */}
              {highRisks.length > 0 && (
                <section className="bg-red-50/60 border border-red-200 rounded-lg p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <h3 className="text-xs font-bold text-red-900 uppercase tracking-wide">
                        High Review Priority Flags ({highRisks.length})
                      </h3>
                    </div>
                    <Link
                      href={`/app/document/${doc.id}/risks`}
                      className="text-xs font-semibold text-red-800 hover:text-red-950 underline inline-flex items-center gap-1"
                    >
                      <span>Full Risk Radar</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {highRisks.map((r) => (
                      <div key={r.id} className="bg-white border border-red-200 rounded p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{r.title}</span>
                          <span className="text-[10px] uppercase font-mono text-red-600 font-bold">
                            {r.category}
                          </span>
                        </div>
                        <p className="text-slate-600 line-clamp-2">{r.explanation}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Extracted Clauses Explorer */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      Important Extracted Clauses
                    </h2>
                    <p className="text-xs text-slate-500">
                      Translated covenants with section references, risk levels, and inspectable quotes.
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    {doc.clauses.length} clauses
                  </span>
                </div>

                <div className="space-y-4">
                  {doc.clauses.map((clause) => (
                    <GroundedClauseCard
                      key={clause.id}
                      clause={clause}
                      onInspectEvidence={(c) => setInspectClause(c)}
                    />
                  ))}
                </div>
              </section>

              {/* Operational Obligations Table */}
              <section className="space-y-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Operational Obligations & Deadlines
                  </h2>
                  <p className="text-xs text-slate-500">
                    Actionable commitments, recurring notice duties, and compliance checkpoints.
                  </p>
                </div>
                <ObligationsTable obligations={doc.obligations} />
              </section>
            </div>

            {/* Right 1 Column: Contextual Inspector Rail */}
            <div className="space-y-6">
              {/* Quick Metadata Box */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                  Document Overview
                </h3>

                {/* Parties */}
                <div className="space-y-1 text-xs">
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">
                    Parties:
                  </span>
                  {doc.parties.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{p.name}</span>
                      <span className="text-slate-500 font-mono">({p.role})</span>
                    </div>
                  ))}
                </div>

                {/* Dates */}
                <div className="space-y-1 text-xs pt-2 border-t border-slate-100">
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">
                    Key Dates:
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Effective:</span>
                    <span className="font-medium text-slate-900">{doc.effectiveDate || 'Unspecified'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Expiration:</span>
                    <span className="font-medium text-slate-900">{doc.expirationDate || 'Unspecified'}</span>
                  </div>
                </div>

                {/* Jurisdiction */}
                <div className="space-y-1 text-xs pt-2 border-t border-slate-100">
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">
                    Governing Law:
                  </span>
                  <span className="font-semibold text-slate-900 block">
                    {doc.jurisdiction || 'Not explicitly specified'}
                  </span>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-slate-900 text-white rounded-lg p-5 space-y-3 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Safe Next Steps
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Prepare for your legal consultation or track execution milestones:
                </p>
                <div className="space-y-2 pt-1">
                  <Link
                    href={`/app/consultation?doc=${doc.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-colors"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Attorney Consultation Brief</span>
                  </Link>
                  <Link
                    href={`/app/action-plan?doc=${doc.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>View Action Plan</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Inspector Drawer */}
      {inspectClause && (
        <EvidenceDrawer
          isOpen={true}
          onClose={() => setInspectClause(null)}
          title={inspectClause.title}
          category={inspectClause.category}
          sourceSection={inspectClause.sourceSection}
          pageOrRef={inspectClause.pageOrRef}
          quote={inspectClause.originalText}
          confidence={inspectClause.confidence}
          plainTranslation={inspectClause.plainEnglishTranslation}
          onAskQuestion={() => router.push(`/app/document/${doc.id}/ask`)}
        />
      )}
    </AppShell>
  );
}
