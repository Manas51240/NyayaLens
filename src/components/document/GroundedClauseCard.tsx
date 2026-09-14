import React, { useState } from 'react';
import { ImportantClause } from '@/types/legal';
import { RiskBadge } from '@/components/common/RiskBadge';
import { Quote, ArrowRight, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface GroundedClauseCardProps {
  clause: ImportantClause;
}

export const GroundedClauseCard: React.FC<GroundedClauseCardProps> = ({ clause }) => {
  const [showOriginal, setShowOriginal] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3 shadow-2xs hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {clause.category}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-mono text-slate-500">
              {clause.sourceSection}
            </span>
          </div>
          <h4 className="text-base font-semibold text-slate-900">
            {clause.title}
          </h4>
        </div>
        <RiskBadge severity={clause.severity} size="sm" />
      </div>

      {/* Plain Language Translation */}
      <div className="bg-slate-50/80 border border-slate-200/80 rounded-md p-3.5">
        <span className="text-xs font-semibold text-slate-700 block mb-1">
          Plain-English Explanation:
        </span>
        <p className="text-sm text-slate-800 leading-relaxed">
          {clause.plainEnglishTranslation}
        </p>
      </div>

      {/* Suggested Action */}
      {clause.suggestedAction && (
        <div className="flex items-start gap-2 text-xs text-amber-900 bg-amber-50/60 border border-amber-200/60 rounded p-2.5">
          <ArrowRight className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
          <span>
            <strong>Suggested safe step:</strong> {clause.suggestedAction}
          </span>
        </div>
      )}

      {/* Accordion for Verbatim Contractual Language */}
      <div className="pt-1">
        <button
          onClick={() => setShowOriginal(!showOriginal)}
          className="text-xs text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 rounded"
          aria-expanded={showOriginal}
        >
          <Quote className="w-3 h-3 text-slate-400" />
          <span>{showOriginal ? 'Hide original contract text' : 'View exact contractual clause'}</span>
          {showOriginal ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showOriginal && (
          <div className="mt-2 bg-slate-900 text-slate-200 rounded-md p-3 text-xs font-mono leading-relaxed max-h-60 overflow-y-auto border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-sans">
              Source: {clause.pageOrRef || clause.sourceSection}
            </div>
            <p className="whitespace-pre-wrap">{clause.originalText}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Grounded Reference
        </span>
        <span>Confidence: {clause.confidence}%</span>
      </div>
    </div>
  );
};
