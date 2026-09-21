'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Radar, ArrowLeft, ShieldAlert } from 'lucide-react';
import { getStoredDocumentById, saveStoredDocument } from '@/lib/storage';
import { LegalDocument } from '@/types/legal';
import { AppShell } from '@/components/layout/AppShell';
import { DocumentNavTabs } from '@/components/document/DocumentNavTabs';
import { RiskRadarView } from '@/components/document/RiskRadarView';
import { RiskRadarSkeleton } from '@/components/common/SkeletonLoaders';
import { EmptyState } from '@/components/common/EmptyState';

export default function DocumentRisksPage() {
  const params = useParams();
  const id = params?.id as string;
  const [doc, setDoc] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const found = getStoredDocumentById(id);
      if (found) {
        setDoc(found);
        setLoading(false);
        return;
      }

      // Try fetching from server session storage
      fetch(`/api/documents/${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.document) {
            setDoc(data.document);
            saveStoredDocument(data.document);
          }
        })
        .catch(() => {})
        .finally(() => {
          setLoading(false);
        });
      return;
    }
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <RiskRadarSkeleton />
        </div>
      </AppShell>
    );
  }

  if (!doc) {
    return (
      <AppShell>
        <div className="py-16">
          <EmptyState type="doc-not-found" />
        </div>
      </AppShell>
    );
  }

  const highRisks = (doc.risks || []).filter((r) => r.severity === 'high');

  return (
    <AppShell
      activeDocumentId={doc.id}
      breadcrumbs={[
        { label: 'Documents', href: '/app' },
        { label: doc.title, href: `/app/document/${doc.id}` },
        { label: 'Legal Risk Radar' },
      ]}
    >
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
    </AppShell>
  );
}
