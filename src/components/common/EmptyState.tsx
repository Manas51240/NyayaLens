'use client';

import React from 'react';
import Link from 'next/link';
import {
  FolderOpen,
  Search,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Sparkles,
  RotateCcw,
  FileText
} from 'lucide-react';
import { resetToDefaultSampleDocuments } from '@/lib/storage';

interface EmptyStateProps {
  type: 'empty-binder' | 'no-results' | 'no-risks' | 'doc-not-found';
  title?: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  onResetSamples?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  actionText,
  actionHref,
  onAction,
  onResetSamples,
}) => {
  const configs = {
    'empty-binder': {
      icon: FolderOpen,
      iconBg: 'bg-slate-100 text-slate-600',
      defaultTitle: 'Your Legal Binder is Empty',
      defaultDescription:
        'You have not analyzed any legal documents yet. Upload a contract to begin, or load our authentic real-world sample library with 1 click.',
    },
    'no-results': {
      icon: Search,
      iconBg: 'bg-amber-50 text-amber-600',
      defaultTitle: 'No Matching Documents Found',
      defaultDescription:
        'No contracts or clauses match your current filter query. Try clearing filters or searching for different keywords.',
    },
    'no-risks': {
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600',
      defaultTitle: 'No High-Priority Flags in this Category',
      defaultDescription:
        'The document appears to follow standard covenants in this area, or no restrictive provisions were identified.',
    },
    'doc-not-found': {
      icon: AlertCircle,
      iconBg: 'bg-red-50 text-red-600',
      defaultTitle: 'Document Not Found in Binder',
      defaultDescription:
        'The requested document may have been deleted, or your browser session storage was cleared.',
    },
  };

  const config = configs[type];
  const IconComponent = config.icon;

  return (
    <div
      className="p-8 sm:p-12 text-center bg-white border border-slate-200 rounded-xl shadow-2xs space-y-4 max-w-lg mx-auto"
      role="status"
      aria-label={title || config.defaultTitle}
    >
      <div
        className={`w-14 h-14 rounded-full ${config.iconBg} flex items-center justify-center mx-auto transition-transform hover:scale-105`}
      >
        <IconComponent className="w-7 h-7" aria-hidden="true" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base sm:text-lg font-bold text-slate-900">
          {title || config.defaultTitle}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
          {description || config.defaultDescription}
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
        {type === 'empty-binder' && (
          <>
            <button
              onClick={() => {
                resetToDefaultSampleDocuments();
                if (onResetSamples) onResetSamples();
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load 4 Sample Contracts</span>
            </button>
            <Link
              href="/app/analyze"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-md transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </Link>
          </>
        )}

        {type === 'no-results' && onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Search Filters</span>
          </button>
        )}

        {type === 'doc-not-found' && (
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md transition-colors"
          >
            <span>Return to Dashboard</span>
          </Link>
        )}
      </div>
    </div>
  );
};
