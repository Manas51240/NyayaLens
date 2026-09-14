import React from 'react';
import Link from 'next/link';
import {
  Scale,
  Sparkles,
  ShieldCheck,
  Cpu,
  Lock,
  Layers,
  CheckCircle2,
  ArrowRight,
  Code2
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <div className="space-y-3 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-800">
          <Scale className="w-3.5 h-3.5 text-amber-600" />
          <span>Challenge Vertical: AI for Legal Assistance & Access</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          About NYAYALENS
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
          "Understand your legal documents. Know what matters. Take the next safe step."
        </p>
      </div>

      {/* The Problem & The Solution */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3 shadow-2xs">
          <h2 className="text-base font-bold text-slate-900">The Problem</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Legal documents govern the most consequential decisions of our lives—employment, housing, small business operations, and intellectual property. Yet legal language is deliberately complex, standard agreements are heavily asymmetric, and hiring an attorney for every standard contract can cost thousands of dollars. As a result, millions sign contracts without understanding the risks.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3 shadow-2xs">
          <h2 className="text-base font-bold text-slate-900">The Solution</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            <strong>NyayaLens</strong> ("Nyaya" from Sanskrit for <em>Justice/Righteousness</em>, combined with <em>Lens</em> for clarity) transforms dense legal texts into plain-language summaries, calculates an objective 10-category Risk Radar, retrieves grounded clause evidence, and produces structured briefs for client-attorney consultations.
          </p>
        </div>
      </section>

      {/* Architectural Pillars */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900">Engineering & Security Architecture</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-lg border border-slate-200 bg-white space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Untrusted Data Isolation</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every uploaded document is treated as untrusted external data. Explicit XML boundaries (<code>&lt;&lt;&lt;UNTRUSTED_DOCUMENT_CONTENT&gt;&gt;&gt;</code>) prevent malicious contract text from manipulating system instructions or triggering prompt injection.
            </p>
          </div>

          <div className="p-5 rounded-lg border border-slate-200 bg-white space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <span>Dual-Engine Fallback Resilience</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Seamlessly integrates with Google Gemini 2.5 Flash for high-speed live semantic analysis, while featuring an offline deterministic parser with 4 pre-loaded real-world contracts for zero-configuration testing.
            </p>
          </div>

          <div className="p-5 rounded-lg border border-slate-200 bg-white space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
              <Lock className="w-4 h-4 text-amber-600" />
              <span>Zero Model Training & PII Redaction</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Document text is processed through enterprise endpoints with no data retention. Users can toggle client-side masking of SSNs, phone numbers, and bank records before analysis.
            </p>
          </div>

          <div className="p-5 rounded-lg border border-slate-200 bg-white space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
              <Code2 className="w-4 h-4 text-slate-800" />
              <span>WCAG 2.1 AA Accessibility</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Built with semantic HTML5 landmarks, visible focus rings, ARIA live states, readable high-contrast typography, and full keyboard navigation.
            </p>
          </div>
        </div>
      </section>

      {/* Navigation CTA */}
      <div className="p-6 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold">Experience NyayaLens in Action</h3>
          <p className="text-xs text-slate-300 mt-0.5">Explore our sample contracts library or upload your own agreement.</p>
        </div>
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold rounded-md transition-colors"
        >
          <span>Open Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
