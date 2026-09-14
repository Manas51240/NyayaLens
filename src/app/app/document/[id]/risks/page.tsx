'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Radar, ArrowLeft, ShieldAlert, Sparkles } from 'lucide-react';
import { getStoredDocumentById } from '@/lib/storage';
import { LegalDocument } from '@/types/legal';
import { DocumentNavTabs } from '@/components/document/DocumentNavTabs';
import { RiskRadarView } from '@/components/document/RiskRadarView';

export default function DocumentRisksPage() {
  const params = useParams();
  const id = params?.id as string;
  const [doc, setDoc] = useState<LegalDocument | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (id) {
      const found = getStoredDocumentById(id);
      if (found) {
        setDoc(found);
      }
    }
    setMounted(true);
  }, [id]);

  if (!mounted) return null;

  if (!doc) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Document Not Found</h2>
        <Link href="/app" className="text-xs font-semibold text-slate-900 underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const highRisks = doc.risks.filter((r) => r.severity === 'high');

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Link
                  href={`/app/document/${doc.id}`}
                  className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Overview</span>
                </Link>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-mono text-slate-500">{doc.fileName}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                <span>Legal Risk Radar</span>
                <span className="text-xs font-semibold bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full">
                  {doc.risks.length} Flags Identified
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Subnavigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <DocumentNavTabs documentId={doc.id} riskCount={highRisks.length} />
        </div>
      </div>

      {/* Main Risk Radar Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <RiskRadarView risks={doc.risks} documentTitle={doc.title} />
      </div>
    </div>
  );
}
