'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Scale, ShieldAlert, Lock, HelpCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  const pathname = usePathname();

  // If inside application workspace, AppShell provides navigation and contextual actions
  if (pathname.startsWith('/app')) {
    return null;
  }

  return (
    <footer className="bg-slate-900 text-slate-300 text-sm mt-auto border-t border-slate-800" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand & Principle */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-slate-800 text-amber-400 flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-white tracking-wide">NYAYALENS</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              &ldquo;Understand your legal documents. Know what matters. Take the next safe step.&rdquo;
              NyayaLens empowers individuals and teams with AI-assisted document comprehension and structured review briefs without replacing professional legal counsel.
            </p>
            <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 flex items-start gap-2 max-w-md">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p>
                <strong>Important Legal Notice:</strong> AI outputs are informational review priorities and do not constitute legal advice, binding interpretations, or formal representation.
              </p>
            </div>
          </div>

          {/* Col 2: Core Platform Routes */}
          <div>
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Platform</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/app" className="text-slate-400 hover:text-white transition-colors">
                  Documents Dashboard
                </Link>
              </li>
              <li>
                <Link href="/app/analyze" className="text-slate-400 hover:text-white transition-colors">
                  Analyze Document
                </Link>
              </li>
              <li>
                <Link href="/app/compare" className="text-slate-400 hover:text-white transition-colors">
                  Contract Comparison
                </Link>
              </li>
              <li>
                <Link href="/app/action-plan" className="text-slate-400 hover:text-white transition-colors">
                  Action Plan Generator
                </Link>
              </li>
              <li>
                <Link href="/app/consultation" className="text-slate-400 hover:text-white transition-colors">
                  Lawyer Consultation Brief
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Trust, Security & Compliance */}
          <div>
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Trust & Security</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/privacy" className="text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>Privacy Controls & Data</span>
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="text-slate-400 hover:text-white transition-colors">
                  Responsible AI & Disclaimer
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-slate-400 hover:text-white transition-colors">
                  Methodology & Principles
                </Link>
              </li>
              <li className="pt-2">
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Zero-Model-Training Guarantee
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} NyayaLens. AI for Legal Assistance & Access. All rights reserved.</p>
          <p className="text-[11px] text-slate-500">
            Engineered for WCAG 2.1 AA Accessibility • Server-Side GenAI Security • Untrusted Input Isolation
          </p>
        </div>
      </div>
    </footer>
  );
};
