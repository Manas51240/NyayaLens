'use client';

import React, { useState } from 'react';
import { ImportantClause } from '@/types/legal';
import { RiskBadge } from '@/components/common/RiskBadge';
import {
  Quote,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Search
} from 'lucide-react';

interface GroundedClauseCardProps {
  clause: ImportantClause;
  onInspectEvidence?: (clause: ImportantClause) => void;
}

export const GroundedClauseCard: React.FC<GroundedClauseCardProps> = ({
  clause,
  onInspectEvidence,
}) => {
  const [showOriginal, setShowOriginal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const citation = `"${clause.originalText}" — ${clause.sourceSection} (${clause.title})`;
    navigator.clipboard.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article
      className="bg-white border border-slate-200 rounded-lg p-5 space-y-3.5 shadow-2xs hover:border-slate-300 transition-all focus-within:ring-2 focus-within:ring-slate-900"
      aria-label={`Clause: ${clause.title}`}
    >
      {/* Header Bar */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {clause.category}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-mono text-slate-600">
              Ref: {clause.sourceSection}
            </span>
          </div>
          <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
            {clause.title}
          </h4>
        </div>
        <RiskBadge severity={clause.severity} size="sm" showSubtext={false} />
      </div>

      {/* Plain Language Translation Callout */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-md p-3.5 space-y-1">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
          Plain-English Explanation:
        </span>
        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
          {clause.plainEnglishTranslation}
        </p>
      </div>

      {/* Suggested Action Item */}
      {clause.suggestedAction && (
        <div className="flex items-start gap-2 text-xs text-amber-900 bg-amber-50/70 border border-amber-200/70 rounded p-2.5">
          <ArrowRight className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
          <span className="leading-normal">
            <strong className="text-amber-950 font-semibold">Recommended Safe Step:</strong> {clause.suggestedAction}
          </span>
        </div>
      )}

      {/* Action Bar: View Verbatim & Inspect Evidence */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="text-slate-600 hover:text-slate-950 font-medium inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 rounded p-0.5"
            aria-expanded={showOriginal}
          >
            <Quote className="w-3 h-3 text-slate-400" />
            <span>{showOriginal ? 'Hide raw excerpt' : 'View raw excerpt'}</span>
            {showOriginal ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {onInspectEvidence && (
            <button
              onClick={() => onInspectEvidence(clause)}
              className="text-indigo-600 hover:text-indigo-900 font-medium inline-flex items-center gap-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 rounded p-0.5"
            >
              <Search className="w-3 h-3" />
              <span>Inspect in Evidence Drawer</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
          <button
            onClick={handleCopy}
            className="text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"
            title="Copy formatted citation"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Cite'}</span>
          </button>
          <span>Confidence: {clause.confidence}%</span>
        </div>
      </div>

      {/* Expandable Verbatim Contract Language */}
      {showOriginal && (
        <div className="mt-2 bg-slate-900 text-slate-100 rounded-md p-3.5 text-xs font-serif leading-relaxed border border-slate-800 shadow-inner">
          <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-1 font-sans">
            Source: {clause.pageOrRef || clause.sourceSection}
          </div>
          <blockquote className="border-l-2 border-amber-400 pl-3 italic">
            &ldquo;{clause.originalText}&rdquo;
          </blockquote>
        </div>
      )}
    </article>
  );
};
