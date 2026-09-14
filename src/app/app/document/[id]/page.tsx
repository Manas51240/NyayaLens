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
  Sparkles
} from 'lucide-react';
import { getStoredDocumentById } from '@/lib/storage';
import { LegalDocument } from '@/types/legal';
import { DocumentNavTabs } from '@/components/document/DocumentNavTabs';
import { GroundedClauseCard } from '@/components/document/GroundedClauseCard';
import { ObligationsTable } from '@/components/document/ObligationsTable';
import { RiskBadge } from '@/components/common/RiskBadge';

export default function DocumentOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [doc, setDoc] = useState<LegalDocument | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (id) {
      const found = getStoredDocumentById(id);
      if (found) {
        setDoc(found);
      }
    }
    setMounted(true);
  }, [id]);

  if (!mounted) return null;

  if (!doc) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Document Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested document could not be retrieved from your local session.
        </p>
        <Link
          href="/app"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 underline"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const highRisks = doc.risks.filter((r) => r.severity === 'high');

  return (
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
                <span>Risk Radar ({doc.risks.length})</span>
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

        {/* Deep Dive Subnavigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <DocumentNavTabs documentId={doc.id} riskCount={highRisks.length} />
        </div>
      </div>

      {/* Main Content Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-8">
        {/* Grounded Summary Card */}
        <section className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
              Plain-Language Executive Summary
            </h2>
          </div>
          <p className="text-sm sm:text-base text-slate-800 leading-relaxed">
            {doc.plainLanguageSummary}
          </p>
        </section>

        {/* Key Metadata Grid: Parties, Dates, Jurisdiction */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Building className="w-4 h-4 text-slate-600" />
              <span>Identified Parties</span>
            </div>
            <ul className="space-y-1 text-xs sm:text-sm">
              {doc.parties.map((p, idx) => (
                <li key={idx} className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-slate-900">{p.name}</span>
                  <span className="text-xs text-slate-500 font-mono">({p.role})</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Calendar className="w-4 h-4 text-slate-600" />
              <span>Key Dates & Timeline</span>
            </div>
            <ul className="space-y-1 text-xs sm:text-sm">
              <li className="flex items-center justify-between">
                <span className="text-slate-600">Effective:</span>
                <span className="font-medium text-slate-900">{doc.effectiveDate || 'Not specified'}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-600">Expiration:</span>
                <span className="font-medium text-slate-900">{doc.expirationDate || 'Not specified'}</span>
              </li>
              {doc.keyDates?.map((kd, i) => (
                <li key={i} className="flex items-center justify-between text-xs pt-0.5">
                  <span className={kd.isCritical ? 'text-red-700 font-semibold' : 'text-slate-600'}>
                    {kd.label}:
                  </span>
                  <span className="font-mono text-slate-800">{kd.date}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Scale className="w-4 h-4 text-slate-600" />
              <span>Governing Law & Forum</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-900 font-medium">
              {doc.jurisdiction || 'No governing law provision explicitly detected.'}
            </p>
            <p className="text-[11px] text-slate-500">
              Contract interpretations and statutory protections are governed by this jurisdiction.
            </p>
          </div>
        </section>

        {/* High-Priority Review Radar Highlights */}
        {highRisks.length > 0 && (
          <section className="bg-red-50/50 border border-red-200 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <h3 className="text-sm font-bold text-red-900 uppercase tracking-wide">
                  High Review Priority Flags ({highRisks.length})
                </h3>
              </div>
              <Link
                href={`/app/document/${doc.id}/risks`}
                className="text-xs font-semibold text-red-800 hover:text-red-950 underline inline-flex items-center gap-1"
              >
                <span>View All 10 Risk Categories</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <p className="text-xs text-red-800">
              The following clauses warrant prioritized review with legal counsel prior to contract execution:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {highRisks.map((r) => (
                <div key={r.id} className="bg-white border border-red-200 rounded p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{r.title}</span>
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

        {/* Important Extracted Clauses */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Extracted Important Clauses</h2>
              <p className="text-xs text-slate-500">
                Key terms translated to plain English with source section references and verifiable quotes.
              </p>
            </div>
            <span className="text-xs text-slate-500">{doc.clauses.length} clauses detected</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {doc.clauses.map((clause) => (
              <GroundedClauseCard key={clause.id} clause={clause} />
            ))}
          </div>
        </section>

        {/* Obligations & Covenants Table */}
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Operational Obligations & Deadlines</h2>
            <p className="text-xs text-slate-500">
              Actionable commitments, recurring duties, and contractual notice milestones.
            </p>
          </div>
          <ObligationsTable obligations={doc.obligations} />
        </section>

        {/* Quick Launch to Consultation Brief and Action Plan */}
        <section className="bg-slate-900 text-white rounded-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold">Ready for the Next Safe Step?</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-lg">
              Generate a structured legal consultation memorandum to bring to your attorney, or create a step-by-step action plan for deadlines.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={`/app/action-plan?doc=${doc.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-md border border-slate-700 transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Action Plan</span>
            </Link>
            <Link
              href={`/app/consultation?doc=${doc.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold rounded-md transition-colors"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Consultation Brief</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
