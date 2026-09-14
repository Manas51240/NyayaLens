'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, X, ExternalLink } from 'lucide-react';

interface LegalDisclaimerBannerProps {
  compact?: boolean;
}

export const LegalDisclaimerBanner: React.FC<LegalDisclaimerBannerProps> = ({ compact = false }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  if (compact) {
    return (
      <div className="bg-slate-900 text-slate-200 text-xs px-4 py-2 flex items-center justify-between border-b border-slate-800" role="complementary" aria-label="Legal Disclaimer Notice">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
          <span className="truncate">
            <strong className="text-white font-medium">Assistance, Not Legal Advice:</strong> NyayaLens assists document understanding and identifies review priorities. It does not replace a licensed attorney.
          </span>
          <Link href="/disclaimer" className="text-slate-300 hover:text-white underline shrink-0 ml-2 inline-flex items-center gap-0.5">
            Full Disclaimer <ExternalLink className="w-2.5 h-2.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <aside
      className="bg-amber-50/90 border-b border-amber-200/80 px-4 py-3 text-sm text-amber-900 transition-all"
      aria-label="Legal & Safety Notice"
    >
      <div className="max-w-7xl mx-auto flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 sm:mt-0 shrink-0" aria-hidden="true" />
          <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
            <span className="font-semibold text-amber-950">Ethical AI Principle:</span> NyayaLens is built to empower your understanding of legal documents, not to provide legal representation or counsel. AI-generated risk ratings indicate review priority for your lawyer, not legal enforceability.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/disclaimer"
            className="text-xs font-medium text-amber-800 hover:text-amber-950 underline inline-flex items-center gap-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-900 rounded"
          >
            Learn more
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-700 hover:text-amber-950 p-1 rounded hover:bg-amber-100/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-900"
            aria-label="Dismiss disclaimer banner for this session"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
