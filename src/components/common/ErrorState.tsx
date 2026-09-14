'use client';

import React from 'react';
import { AlertTriangle, RotateCcw, X, FileX, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showHomeLink?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Processing Error',
  message,
  onRetry,
  onDismiss,
  showHomeLink = false,
}) => {
  return (
    <div
      className="p-4 sm:p-5 rounded-lg bg-red-50/90 border border-red-200 text-red-900 shadow-2xs space-y-3"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-red-950">{title}</h4>
            <p className="text-xs sm:text-sm text-red-800 mt-0.5 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-600 hover:text-red-950 p-1 rounded hover:bg-red-100"
            aria-label="Dismiss error notice"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {(onRetry || showHomeLink) && (
        <div className="flex items-center gap-3 pt-1 text-xs">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-800 hover:bg-red-900 text-white font-semibold rounded transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Action</span>
            </button>
          )}
          {showHomeLink && (
            <Link
              href="/app"
              className="inline-flex items-center gap-1 text-red-800 hover:text-red-950 underline font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
};
