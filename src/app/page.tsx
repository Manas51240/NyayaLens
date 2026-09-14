import React from 'react';
import Link from 'next/link';
import {
  Scale,
  ShieldCheck,
  Radar,
  FileSearch,
  GitCompare,
  CheckSquare,
  FileText,
  Lock,
  ArrowRight,
  AlertTriangle,
  Building,
  Briefcase,
  Layers,
  Sparkles
} from 'lucide-react';
import { SAMPLE_DOCUMENTS } from '@/lib/sample-documents';

export default function LandingPage() {
  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-12 sm:pb-16 border-b border-slate-200 bg-linear-to-b from-white via-slate-50/50 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-800">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>GenAI for Legal Assistance & Access</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">Assisting rather than replacing lawyers</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight sm:leading-none">
            Understand your legal documents.{' '}
            <span className="text-slate-800 underline decoration-amber-400 decoration-4 underline-offset-4">
              Know what matters.
            </span>{' '}
            Take the next safe step.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            NyayaLens translates dense contracts, leases, and agreements into clear review priorities, grounded evidence citations, and attorney-ready consultation briefs.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/app/analyze"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              <span>Analyze Your Document</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </Link>
            <Link
              href="/app"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-sm font-semibold rounded-lg shadow-2xs transition-colors"
            >
              <span>Explore Sample Library</span>
            </Link>
          </div>

          {/* Trust Guarantees */}
          <div className="pt-8 border-t border-slate-200/80 max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 text-left">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Untrusted Input Shield:</strong> Defends against document-based prompt injection.</span>
            </div>
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span><strong>Zero Model Training:</strong> Your confidential legal documents are never used to train models.</span>
            </div>
            <div className="flex items-start gap-2">
              <Scale className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span><strong>Evidence-Grounded:</strong> Every finding links to verifiable document quotes with page citations.</span>
            </div>
          </div>
        </div>
      </section>

      {/* 1-Click Interactive Demos / Sample Contracts */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">
            Try Without Uploading
          </h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Interactive Real-World Contract Sandboxes
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Select any standard agreement below to test our grounded extraction, Risk Radar, and consultation briefs immediately.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {SAMPLE_DOCUMENTS.map((doc) => (
            <div
              key={doc.id}
              className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between shadow-2xs hover:border-slate-400 hover:shadow-xs transition-all"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-500 uppercase">
                    {doc.documentType.split(' ')[0]}
                  </span>
                  <span className="text-[10px] bg-red-100 text-red-800 font-semibold px-2 py-0.5 rounded">
                    {doc.risks.filter((r) => r.severity === 'high').length} High Flags
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                  {doc.title}
                </h4>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {doc.plainLanguageSummary}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {doc.clauses.length} key clauses
                </span>
                <Link
                  href={`/app/document/${doc.id}`}
                  className="text-xs font-semibold text-slate-900 hover:text-amber-700 inline-flex items-center gap-1"
                >
                  <span>Examine</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Feature Matrix */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-slate-200 pt-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">
              Capabilities
            </h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Purpose-Built for Legal Document Understanding
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Designed to avoid hallucination, protect user privacy, and deliver structured clarity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 text-red-700 flex items-center justify-center">
                <Radar className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Legal Risk Radar</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Categorizes risks across 10 critical dimensions: termination, liability, penalties, auto-renewals, restrictive covenants, and unusual covenants.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <FileSearch className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Evidence-Grounded Q&A</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Ask specific questions. NyayaLens retrieves exact clause citations. If a topic is missing, it explicitly reports that it was not found.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <GitCompare className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Contract Comparison</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Compare original vs. redline counterparty drafts. Track changed liability caps, liquidated damages, altered dates, and shifted obligations.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <CheckSquare className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Action Plan Generator</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Converts complex covenants into structured to-do checklists, calendar milestones, evidence gathering tasks, and questions for counsel.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Lawyer Consultation Brief</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Generate an attorney-ready memo with key facts, flagged clauses, and targeted questions. Save hundreds in billable hours while receiving sharper counsel.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Privacy & PII Masking</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Local-first storage mode, optional pre-redaction of SSNs and financial data, and a 1-click purge button for total data sovereignty.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ethical AI Stance */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-10 border border-slate-800 shadow-md">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-12 h-12 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl sm:text-2xl font-bold">
                Responsible AI Principle: Understanding, Not Substitution
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                NyayaLens will never assert that a contract is legally valid, that a clause is definitely illegal, or that you will win a legal dispute. Legal enforceability depends on jurisdictional precedents, personal context, and licensed statutory judgment. NyayaLens equips you with facts, quotes, and questions so you can consult a qualified legal professional with clarity and confidence.
              </p>
              <div className="pt-2">
                <Link
                  href="/disclaimer"
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline inline-flex items-center gap-1"
                >
                  Read our full Responsible AI Framework & Disclaimer
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
