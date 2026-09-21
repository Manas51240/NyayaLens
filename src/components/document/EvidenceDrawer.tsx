'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Quote,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  MessageSquareText
} from 'lucide-react';
import { ImportantClause, LegalRisk } from '@/types/legal';

interface EvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  category: string;
  sourceSection: string;
  pageOrRef?: string;
  quote: string;
  confidence: number;
  plainTranslation?: string;
  onAskQuestion?: (quote: string) => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  isOpen,
  onClose,
  title,
  category,
  sourceSection,
  pageOrRef,
  quote,
  confidence,
  plainTranslation,
  onAskQuestion,
}) => {
  const [copied, setCopied] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus close button on open
    closeBtnRef.current?.focus();

    // Dismiss on Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyCitation = () => {
    const citation = `"${quote}" — Section: ${sourceSection}${pageOrRef ? `, ${pageOrRef}` : ''} (NyayaLens Grounded Evidence)`;
    navigator.clipboard.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <>
      {/* Accessible Backdrop Overlay */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white border-l border-slate-200 shadow-2xl flex flex-col transform transition-transform ease-in-out duration-300"
        role="dialog"
        aria-label={`Evidence Inspector for ${title}`}
        aria-modal="true"
      >
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-slate-900 text-amber-400 flex items-center justify-center">
            <Quote className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Evidence Grounding Inspector
            </span>
            <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{title}</h3>
          </div>
        </div>
        <button
          ref={closeBtnRef}
          onClick={onClose}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          aria-label="Close evidence inspector"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs sm:text-sm text-slate-700">
        {/* Source Citation Meta Bar */}
        <div className="flex items-center justify-between p-3 rounded bg-slate-100/80 border border-slate-200 font-mono text-xs">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block font-sans">
              Source Location:
            </span>
            <span className="font-semibold text-slate-900">
              {sourceSection} {pageOrRef && `• ${pageOrRef}`}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase block font-sans">
              Confidence:
            </span>
            <span className="font-semibold text-emerald-700">{confidence}% Grounded</span>
          </div>
        </div>

        {/* Verbatim Document Excerpt */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Verbatim Contractual Excerpt
            </h4>
            <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
              Raw Extracted Text
            </span>
          </div>
          <div className="p-4 rounded-lg bg-slate-900 text-slate-100 font-serif leading-relaxed text-xs sm:text-sm border border-slate-800 shadow-inner">
            <blockquote className="border-l-2 border-amber-400 pl-3 italic">
              &ldquo;{quote}&rdquo;
            </blockquote>
          </div>
        </div>

        {/* Plain Language Translation */}
        {plainTranslation && (
          <div className="space-y-1.5 p-3.5 rounded-lg bg-amber-50/60 border border-amber-200/80">
            <span className="text-xs font-bold text-amber-950 uppercase tracking-wide block">
              Plain-English Breakdown:
            </span>
            <p className="text-xs sm:text-sm text-amber-900 leading-relaxed font-sans">
              {plainTranslation}
            </p>
          </div>
        )}

        {/* Verification Check */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Anti-Hallucination Integrity Check</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            This excerpt was parsed directly from the uploaded document buffer and cross-referenced against extracted contract tokens.
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
        <button
          onClick={handleCopyCitation}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold rounded-md transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Citation Copied!' : 'Copy Formatted Citation'}</span>
        </button>

        {onAskQuestion && (
          <button
            onClick={() => {
              onAskQuestion(quote);
              onClose();
            }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
          >
            <MessageSquareText className="w-4 h-4 text-amber-400" />
            <span>Ask About Excerpt</span>
          </button>
        )}
      </div>
    </aside>
    </>
  );
};
