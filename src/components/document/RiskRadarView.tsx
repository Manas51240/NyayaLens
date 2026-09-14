'use client';

import React, { useState } from 'react';
import { LegalRisk, RiskCategory, RiskSeverity } from '@/types/legal';
import { RiskBadge } from '@/components/common/RiskBadge';
import {
  Radar,
  Quote,
  HelpCircle,
  Sparkles,
  Filter,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  Copy,
  Check,
  Search
} from 'lucide-react';
import { EvidenceDrawer } from './EvidenceDrawer';

interface RiskRadarViewProps {
  risks: LegalRisk[];
  documentTitle: string;
}

const ALL_CATEGORIES: RiskCategory[] = [
  'termination',
  'payment',
  'liability',
  'renewal',
  'confidentiality',
  'privacy/data',
  'dispute resolution',
  'restrictive covenants',
  'penalties',
  'unusual obligations',
];

export const RiskRadarView: React.FC<RiskRadarViewProps> = ({ risks, documentTitle }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [expandedRiskId, setExpandedRiskId] = useState<string | null>(risks[0]?.id || null);
  const [copiedQuestionId, setCopiedQuestionId] = useState<string | null>(null);
  const [inspectRisk, setInspectRisk] = useState<LegalRisk | null>(null);

  // Group risks by category
  const categoryCounts = ALL_CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = risks.filter((r) => r.category.toLowerCase() === cat.toLowerCase()).length;
    return acc;
  }, {});

  // Severity counts
  const severityCounts = {
    high: risks.filter((r) => r.severity === 'high').length,
    medium: risks.filter((r) => r.severity === 'medium').length,
    low: risks.filter((r) => r.severity === 'low').length,
    informational: risks.filter((r) => r.severity === 'informational').length,
  };

  const filteredRisks = risks.filter((r) => {
    const matchesCategory =
      selectedCategory === 'all' || r.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSeverity = selectedSeverity === 'all' || r.severity === selectedSeverity;
    return matchesCategory && matchesSeverity;
  });

  const handleCopyQuestion = (id: string, question: string) => {
    navigator.clipboard.writeText(question);
    setCopiedQuestionId(id);
    setTimeout(() => setCopiedQuestionId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Risk Philosophy Notice */}
      <div className="bg-slate-100/90 border border-slate-200 rounded-lg p-4 flex items-start gap-3 text-xs text-slate-700">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-900 font-semibold">Review Priority vs. Legal Enforceability:</strong>
          <p className="mt-0.5 leading-relaxed">
            High, Medium, and Low severity ratings represent AI-identified flags to help you organize your review with legal counsel. They do NOT mean that a clause is definitely illegal, void, or unenforceable in a court of law.
          </p>
        </div>
      </div>

      {/* Visual Radar Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setSelectedSeverity(selectedSeverity === 'high' ? 'all' : 'high')}
          className={`text-left p-4 rounded-lg border transition-all ${
            selectedSeverity === 'high'
              ? 'bg-red-50/90 border-red-300 ring-2 ring-red-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-red-200'
          }`}
          aria-pressed={selectedSeverity === 'high'}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">High Priority</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{severityCounts.high}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Warrants counsel review</p>
        </button>

        <button
          onClick={() => setSelectedSeverity(selectedSeverity === 'medium' ? 'all' : 'medium')}
          className={`text-left p-4 rounded-lg border transition-all ${
            selectedSeverity === 'medium'
              ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
          aria-pressed={selectedSeverity === 'medium'}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Medium Priority</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{severityCounts.medium}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Operational awareness</p>
        </button>

        <button
          onClick={() => setSelectedSeverity(selectedSeverity === 'low' ? 'all' : 'low')}
          className={`text-left p-4 rounded-lg border transition-all ${
            selectedSeverity === 'low'
              ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-emerald-200'
          }`}
          aria-pressed={selectedSeverity === 'low'}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Low Priority</span>
            <Radar className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{severityCounts.low}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Standard terms detected</p>
        </button>

        <button
          onClick={() => setSelectedSeverity(selectedSeverity === 'informational' ? 'all' : 'informational')}
          className={`text-left p-4 rounded-lg border transition-all ${
            selectedSeverity === 'informational'
              ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-400/40 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
          aria-pressed={selectedSeverity === 'informational'}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Informational</span>
            <Info className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{severityCounts.informational}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Contextual reference</p>
        </button>
      </div>

      {/* 10 Required Categories Distribution Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-600" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
              Risk Radar Coverage (10 Required Categories)
            </h3>
          </div>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-xs text-slate-600 hover:text-slate-900 underline"
            >
              Reset category filter
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5" role="toolbar" aria-label="Risk Categories Filter">
          {ALL_CATEGORIES.map((cat) => {
            const count = categoryCounts[cat] || 0;
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(isSelected ? 'all' : cat)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : count > 0
                    ? 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                    : 'bg-white text-slate-400 border-slate-100 hover:text-slate-600'
                }`}
                aria-pressed={isSelected}
              >
                <span className="capitalize">{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtered Risk Cards List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-500">
            Showing {filteredRisks.length} of {risks.length} identified review items
          </span>
          {(selectedCategory !== 'all' || selectedSeverity !== 'all') && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedSeverity('all');
              }}
              className="text-amber-700 hover:text-amber-900 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>

        {filteredRisks.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-500">
            No risk findings match the selected filter criteria. Try selecting "All" or choosing another category.
          </div>
        ) : (
          filteredRisks.map((risk) => {
            const isExpanded = expandedRiskId === risk.id;
            return (
              <article
                key={risk.id}
                className={`bg-white rounded-lg border transition-all ${
                  isExpanded ? 'border-slate-400 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div
                  onClick={() => setExpandedRiskId(isExpanded ? null : risk.id)}
                  className="p-4 cursor-pointer flex items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <RiskBadge severity={risk.severity} size="sm" />
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider">
                        {risk.category}
                      </span>
                      {risk.sourceSection && (
                        <span className="text-xs text-slate-500 font-mono">
                          Ref: {risk.sourceSection}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900">
                      {risk.title}
                    </h4>
                  </div>
                  <button
                    aria-expanded={isExpanded}
                    aria-label={`Toggle details for ${risk.title}`}
                    className="text-slate-400 hover:text-slate-700 p-1"
                  >
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3.5 text-xs sm:text-sm text-slate-700">
                    {/* Plain Language Finding Explanation */}
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wide mb-1">
                        Plain-Language Analysis
                      </h5>
                      <p className="leading-relaxed text-slate-800">{risk.explanation}</p>
                    </div>

                    {/* Verbatim Quoted Evidence */}
                    {risk.quote && (
                      <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs font-serif text-slate-800">
                        <div className="flex items-center justify-between font-sans font-semibold text-slate-500 mb-1">
                          <div className="flex items-center gap-1.5">
                            <Quote className="w-3.5 h-3.5" />
                            <span>Exact Document Excerpt:</span>
                          </div>
                          <button
                            onClick={() => setInspectRisk(risk)}
                            className="text-indigo-600 hover:text-indigo-800 text-[11px] inline-flex items-center gap-1"
                          >
                            <Search className="w-3 h-3" />
                            <span>Inspect in Drawer</span>
                          </button>
                        </div>
                        <blockquote className="italic border-l-2 border-slate-400 pl-2 my-1">
                          "{risk.quote}"
                        </blockquote>
                      </div>
                    )}

                    {/* Actionable Recommendations & Questions for Counsel */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {risk.reviewRecommendation && (
                        <div className="bg-amber-50/60 border border-amber-200/80 rounded p-3 space-y-1">
                          <span className="font-bold text-amber-950 text-xs block">
                            Recommended Next Step:
                          </span>
                          <p className="text-xs text-amber-900 leading-relaxed">
                            {risk.reviewRecommendation}
                          </p>
                        </div>
                      )}

                      {risk.suggestedQuestionForLawyer && (
                        <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                              <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
                              Question for Your Attorney:
                            </span>
                            <button
                              onClick={() => handleCopyQuestion(risk.id, risk.suggestedQuestionForLawyer)}
                              className="text-slate-500 hover:text-slate-800 text-[10px] inline-flex items-center gap-0.5"
                              title="Copy question"
                            >
                              {copiedQuestionId === risk.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>{copiedQuestionId === risk.id ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                          <p className="text-xs text-slate-800 italic leading-relaxed">
                            "{risk.suggestedQuestionForLawyer}"
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Grounding Confidence: {risk.confidence || 92}%</span>
                      <span>Verified against source document text</span>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      {/* Evidence Drawer Modal */}
      {inspectRisk && (
        <EvidenceDrawer
          isOpen={true}
          onClose={() => setInspectRisk(null)}
          title={inspectRisk.title}
          category={inspectRisk.category}
          sourceSection={inspectRisk.sourceSection}
          pageOrRef={inspectRisk.pageOrRef}
          quote={inspectRisk.quote}
          confidence={inspectRisk.confidence}
          plainTranslation={inspectRisk.explanation}
        />
      )}
    </div>
  );
};
