'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderOpen,
  FileText,
  AlertTriangle,
  CheckSquare,
  PlusCircle,
  GitCompare,
  Trash2,
  ExternalLink,
  Calendar,
  Building,
  RotateCcw,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Filter
} from 'lucide-react';
import { LegalDocument } from '@/types/legal';
import {
  getStoredDocuments,
  deleteStoredDocument,
  resetToDefaultSampleDocuments,
} from '@/lib/storage';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardSkeleton } from '@/components/common/SkeletonLoaders';
import { EmptyState } from '@/components/common/EmptyState';

export default function DashboardPage() {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate brief initial hydration read
    const timer = setTimeout(() => {
      setDocuments(getStoredDocuments());
      setLoading(false);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Delete this document analysis from your local binder?')) {
      deleteStoredDocument(id);
      setDocuments(getStoredDocuments());
    }
  };

  const handleReset = () => {
    resetToDefaultSampleDocuments();
    setDocuments(getStoredDocuments());
    setSelectedTypeFilter('all');
    setSearchQuery('');
  };

  // Metrics calculation
  const totalDocs = documents.length;
  const totalFindings = documents.reduce((acc, d) => acc + (d.clauses?.length || 0), 0);
  const totalHighRisks = documents.reduce(
    (acc, d) => acc + (d.risks?.filter((r) => r.severity === 'high').length || 0),
    0
  );
  const totalActionItems = documents.reduce((acc, d) => acc + (d.actionItems?.length || 0), 0);

  // Available document types for quick filter
  const docTypes = Array.from(new Set(documents.map((d) => d.documentType)));

  const filteredDocs = documents.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.documentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      selectedTypeFilter === 'all' || d.documentType === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <AppShell activeDocumentId={documents[0]?.id} breadcrumbs={[{ label: 'Dashboard' }]}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {loading ? (
          <DashboardSkeleton />
        ) : documents.length === 0 ? (
          <div className="py-12">
            <EmptyState
              type="empty-binder"
              onResetSamples={handleReset}
            />
          </div>
        ) : (
          <>
            {/* Top Title & Quick Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  Legal Documents Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Active contracts, grounded clause findings, and prioritized action checklists.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors shadow-2xs"
                  title="Reset binder to standard 4 sample contracts"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Samples</span>
                </button>
                <Link
                  href="/app/analyze"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs transition-colors"
                >
                  <PlusCircle className="w-4 h-4 text-amber-400" />
                  <span>Analyze Document</span>
                </Link>
              </div>
            </div>

            {/* 4 Required Metric KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Documents Analyzed
                  </span>
                  <FolderOpen className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-3xl font-extrabold text-slate-900">{totalDocs}</p>
                <p className="text-[11px] text-slate-500">Stored in local browser binder</p>
              </div>

              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Important Findings
                  </span>
                  <FileText className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-3xl font-extrabold text-slate-900">{totalFindings}</p>
                <p className="text-[11px] text-slate-500">Extracted clauses & covenants</p>
              </div>

              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-red-700 uppercase tracking-wider">
                    High-Priority Flags
                  </span>
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <p className="text-3xl font-extrabold text-red-700">{totalHighRisks}</p>
                <p className="text-[11px] text-slate-500">Warrants attorney examination</p>
              </div>

              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                    Pending Action Items
                  </span>
                  <CheckSquare className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-3xl font-extrabold text-slate-900">{totalActionItems}</p>
                <p className="text-[11px] text-slate-500">Milestones & counsel questions</p>
              </div>
            </div>

            {/* Quick Action Launchpad */}
            <div className="bg-slate-900 text-white rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h2 className="text-sm font-bold">Contract Comparison & Consultation Hub</h2>
                </div>
                <p className="text-xs text-slate-300">
                  Compare two agreements side-by-side or generate a formal Consultation Memorandum for legal counsel.
                </p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <Link
                  href="/app/compare"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors border border-slate-700"
                >
                  <GitCompare className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Compare Contracts</span>
                </Link>
                <Link
                  href="/app/consultation"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Lawyer Consultation Brief</span>
                </Link>
              </div>
            </div>

            {/* Recent Documents Table & Filter Section */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Your Legal Binder</h2>
                  <p className="text-xs text-slate-500">
                    Select a document to inspect clauses, examine the risk radar, or ask questions.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                  {/* Search input */}
                  <div className="relative flex-1 sm:w-60">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter contracts..."
                      className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  {/* Document Type Filter */}
                  {docTypes.length > 1 && (
                    <select
                      value={selectedTypeFilter}
                      onChange={(e) => setSelectedTypeFilter(e.target.value)}
                      className="text-xs p-1.5 border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      aria-label="Filter by document type"
                    >
                      <option value="all">All Types</option>
                      {docTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {filteredDocs.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    type="no-results"
                    onAction={() => {
                      setSearchQuery('');
                      setSelectedTypeFilter('all');
                    }}
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th scope="col" className="px-5 py-3">Document Title & Type</th>
                        <th scope="col" className="px-5 py-3">Identified Parties</th>
                        <th scope="col" className="px-5 py-3">Review Priority</th>
                        <th scope="col" className="px-5 py-3">Jurisdiction</th>
                        <th scope="col" className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {filteredDocs.map((doc) => {
                        const highCount = doc.risks.filter((r) => r.severity === 'high').length;
                        return (
                          <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-5 py-3.5">
                              <Link
                                href={`/app/document/${doc.id}`}
                                className="font-bold text-slate-900 hover:text-amber-700 block text-xs sm:text-sm"
                              >
                                {doc.title}
                              </Link>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                <span className="font-mono">{doc.fileName}</span>
                                <span>•</span>
                                <span>{doc.documentType}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-xs text-slate-600">
                              {doc.parties && doc.parties.length > 0 ? (
                                <span className="line-clamp-1 font-medium">
                                  {doc.parties.map((p) => p.name).join(' & ')}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Unspecified</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              {highCount > 0 ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                                  <AlertTriangle className="w-3 h-3 text-red-600" />
                                  {highCount} High Priority
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                  Standard Terms
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                              {doc.jurisdiction ? (
                                <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                                  {doc.jurisdiction}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs">Unspecified</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-right whitespace-nowrap space-x-2">
                              <Link
                                href={`/app/document/${doc.id}`}
                                className="text-xs font-semibold text-slate-800 hover:text-slate-950 underline px-2 py-1"
                              >
                                Examine
                              </Link>
                              <button
                                onClick={(e) => handleDelete(doc.id, e)}
                                className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                                title="Delete from local binder"
                                aria-label={`Delete ${doc.title}`}
                              >
                                <Trash2 className="w-4 h-4 inline" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
