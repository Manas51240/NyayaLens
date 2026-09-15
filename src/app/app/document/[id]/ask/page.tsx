'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MessageSquareText, ArrowLeft, ShieldCheck } from 'lucide-react';
import { getStoredDocumentById } from '@/lib/storage';
import { LegalDocument } from '@/types/legal';
import { AppShell } from '@/components/layout/AppShell';
import { DocumentNavTabs } from '@/components/document/DocumentNavTabs';
import { AskDocumentChat } from '@/components/document/AskDocumentChat';
import { EvidenceDrawer } from '@/components/document/EvidenceDrawer';
import { WorkspaceSkeleton } from '@/components/common/SkeletonLoaders';
import { EmptyState } from '@/components/common/EmptyState';

export default function DocumentAskPage() {
  const params = useParams();
  const id = params?.id as string;
  const [doc, setDoc] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [inspectCitation, setInspectCitation] = useState<{ quote: string; section: string } | null>(null);

  useEffect(() => {
    if (id) {
      const found = getStoredDocumentById(id);
      if (found) {
        setDoc(found);
      }
    }
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <WorkspaceSkeleton />
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

  const highRisks = doc.risks.filter((r) => r.severity === 'high');

  return (
    <AppShell
      activeDocumentId={doc.id}
      breadcrumbs={[
        { label: 'Documents', href: '/app' },
        { label: doc.title, href: `/app/document/${doc.id}` },
        { label: 'Ask Document' },
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
                  <span>Ask Document</span>
                  <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    Evidence-Grounded Inquiries
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

        {/* Main Grounded Chat Container */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <AskDocumentChat
            document={doc}
            onInspectCitation={(quote, section) => setInspectCitation({ quote, section })}
          />
        </div>

        {/* Grounded Evidence Drawer */}
        <EvidenceDrawer
          isOpen={!!inspectCitation}
          onClose={() => setInspectCitation(null)}
          title={`Grounded Evidence: ${inspectCitation?.section || 'Contract Clause'}`}
          category="CITED_EVIDENCE"
          sourceSection={inspectCitation?.section || 'Retrieved Clause'}
          quote={inspectCitation?.quote || ''}
          confidence={95}
        />
      </div>
    </AppShell>
  );
}
