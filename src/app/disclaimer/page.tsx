import React from 'react';
import Link from 'next/link';
import { Scale, ShieldAlert, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function DisclaimerPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="space-y-2">
        <Link href="/" className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
          <Scale className="w-7 h-7 text-amber-600" />
          <span>Responsible AI Framework & Legal Disclaimer</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Last Updated: February 2025 • Ethical principles governing NyayaLens
        </p>
      </div>

      {/* Core Principle Notice Box */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-6 space-y-3">
        <div className="flex items-center gap-2 text-amber-900 font-bold text-sm uppercase tracking-wide">
          <ShieldAlert className="w-5 h-5 text-amber-600" />
          <span>Core Product Principle: Assistance Rather Than Replacement</span>
        </div>
        <p className="text-xs sm:text-sm text-amber-950 leading-relaxed">
          NyayaLens is designed to democratize legal comprehension, bridge the legal literacy divide, and empower users to understand the documents governing their lives and businesses. It is an educational and organizational tool designed strictly to assist, not to substitute for, licensed legal professionals.
        </p>
      </div>

      {/* Explicit Prohibitions */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          Strict Prohibitions on AI Output
        </h2>
        <p className="text-xs text-slate-600">
          The NyayaLens system architecture strictly enforces that the platform shall never:
        </p>
        <ul className="space-y-2.5 text-xs sm:text-sm text-slate-800">
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">✕</span>
            <span><strong>Never claim a contract is legally valid or binding:</strong> Contract enforceability requires examination of mutual consideration, lack of duress, unconscionability, and governing case law that an automated model cannot definitively adjudicate.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">✕</span>
            <span><strong>Never claim a clause is definitively illegal or void:</strong> While certain terms (e.g. non-competes in California) may be statutorily restricted, validity often turns on specific circumstances, severance clauses, or carve-outs.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">✕</span>
            <span><strong>Never predict litigation outcomes or promise that a user will win a dispute:</strong> Legal disputes involve evidentiary proceedings, jurisdictional nuances, and judicial discretion.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">✕</span>
            <span><strong>Never claim that AI output constitutes legal advice:</strong> No attorney-client relationship is formed through the use of this website or software.</span>
          </li>
        </ul>
      </div>

      {/* Review Priority vs Enforceability */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          Understanding "Review Priority" vs "Legal Enforceability"
        </h2>
        <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <p>
            Throughout NyayaLens, you will see ratings of <span className="font-semibold text-red-700">High Review Priority</span>, <span className="font-semibold text-amber-700">Medium Review Priority</span>, and <span className="font-semibold text-emerald-700">Low Review Priority</span>.
          </p>
          <p>
            These ratings reflect the <strong>importance of examining the term with a qualified legal professional</strong> because the clause imposes asymmetric risk, restrictive covenants, substantial financial liabilities, or strict notice requirements. They do <em>not</em> denote whether the clause would hold up in court or whether it violates statutory regulations.
          </p>
        </div>
      </div>

      {/* Calibrated AI Language */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-3">
        <h3 className="text-sm font-bold text-slate-900">
          Grounded Language Standards
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          NyayaLens uses carefully calibrated phrasing to ensure transparency and prevent hallucination:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 bg-white rounded border border-slate-200">
            <span className="text-slate-500 uppercase block text-[10px] font-sans font-bold">Standard Output Phrases:</span>
            <p className="text-slate-800 mt-1">"The document states..."</p>
            <p className="text-slate-800">"I found the following section..."</p>
            <p className="text-slate-800">"I could not find terms mentioning..."</p>
          </div>
          <div className="p-3 bg-white rounded border border-slate-200">
            <span className="text-slate-500 uppercase block text-[10px] font-sans font-bold">Action Framing:</span>
            <p className="text-slate-800 mt-1">"May warrant professional review"</p>
            <p className="text-slate-800">"Consider discussing with counsel"</p>
            <p className="text-slate-800">"Suggested question for your attorney"</p>
          </div>
        </div>
      </div>
    </div>
  );
}
