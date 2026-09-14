'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ClipboardPaste
} from 'lucide-react';
import { saveStoredDocument } from '@/lib/storage';
import { SAMPLE_DOCUMENTS } from '@/lib/sample-documents';
import { LegalDocument } from '@/types/legal';
import { AppShell } from '@/components/layout/AppShell';
import { ErrorState } from '@/components/common/ErrorState';

export default function AnalyzePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'samples'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [pastedTitle, setPastedTitle] = useState('');
  const [enablePiiPreRedaction, setEnablePiiPreRedaction] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (activeTab === 'upload') {
        if (!file) {
          throw new Error('Please select a file to upload.');
        }

        setProgressStep('Uploading & isolating untrusted document content...');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('enablePiiPreRedaction', String(enablePiiPreRedaction));

        setProgressStep('Parsing document structure & clauses...');
        const res = await fetch('/api/analyze', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.document) {
          throw new Error(data.error || 'Failed to analyze uploaded document.');
        }

        setProgressStep('Finalizing grounded risk radar...');
        saveStoredDocument(data.document);
        router.push(`/app/document/${data.document.id}`);
      } else if (activeTab === 'paste') {
        if (!pastedText.trim() || pastedText.trim().length < 30) {
          throw new Error('Please paste sufficient contract text (minimum 30 characters).');
        }

        setProgressStep('Sanitizing pasted content...');
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rawText: pastedText.trim(),
            fileName: (pastedTitle.trim() || 'Pasted_Agreement') + '.txt',
            fileType: 'txt',
            enablePiiPreRedaction,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.document) {
          throw new Error(data.error || 'Failed to analyze text.');
        }

        setProgressStep('Finalizing analysis...');
        saveStoredDocument(data.document);
        router.push(`/app/document/${data.document.id}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis.');
      setLoading(false);
    }
  };

  const handleSelectSample = (sample: LegalDocument) => {
    saveStoredDocument(sample);
    router.push(`/app/document/${sample.id}`);
  };

  return (
    <AppShell breadcrumbs={[{ label: 'Analyze Document' }]}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Analyze Legal Document
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Upload a contract, lease, or MSA to extract plain-English translations, risk radars, and action steps.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload File (PDF, DOCX, TXT)</span>
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'paste'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ClipboardPaste className="w-4 h-4" />
            <span>Paste Text</span>
          </button>
          <button
            onClick={() => setActiveTab('samples')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'samples'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Sample Contracts (Instant)</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <ErrorState
            title="Analysis Failure"
            message={error}
            onDismiss={() => setError(null)}
          />
        )}

        {/* Loading State */}
        {loading && (
          <div className="p-8 bg-white border border-slate-200 rounded-xl shadow-2xs text-center space-y-4">
            <div className="w-10 h-10 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">
                Processing Document Content
              </h3>
              <p className="text-xs text-slate-500 font-mono">{progressStep}</p>
            </div>
            <div className="max-w-xs mx-auto bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-slate-900 h-full w-3/4 animate-pulse"></div>
            </div>
            <p className="text-[11px] text-slate-400">
              Enforcing prompt injection boundaries • Extracting grounded citations
            </p>
          </div>
        )}

        {/* Tab 1: Upload */}
        {!loading && activeTab === 'upload' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-xl p-8 sm:p-12 text-center bg-white transition-colors cursor-pointer"
              onClick={() => document.getElementById('file-upload-input')?.click()}
            >
              <input
                id="file-upload-input"
                type="file"
                accept=".pdf,.docx,.txt,.md"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto mb-4">
                <UploadCloud className="w-6 h-6" />
              </div>
              {file ? (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB • Click to choose a different file
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-sm font-bold text-slate-800">
                    Click to select or drag and drop your document
                  </p>
                  <p className="text-xs text-slate-500">
                    Supported formats: PDF, DOCX, TXT, Markdown (Max 10 MB)
                  </p>
                </div>
              )}
            </div>

            {/* Privacy & Redaction Option */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-start gap-3">
              <input
                id="pii-toggle"
                type="checkbox"
                checked={enablePiiPreRedaction}
                onChange={(e) => setEnablePiiPreRedaction(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
              />
              <label htmlFor="pii-toggle" className="text-xs text-slate-700 cursor-pointer">
                <strong className="text-slate-900 block font-bold">
                  Enable Client-Side PII Pre-Redaction
                </strong>
                Automatically masks US Social Security Numbers, phone numbers, email addresses, and credit card numbers before processing.
              </label>
            </div>

            <button
              type="submit"
              disabled={!file}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm text-xs sm:text-sm transition-colors"
            >
              <span>Begin Grounded Analysis</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </form>
        )}

        {/* Tab 2: Paste */}
        {!loading && activeTab === 'paste' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Document Title / Reference
              </label>
              <input
                type="text"
                value={pastedTitle}
                onChange={(e) => setPastedTitle(e.target.value)}
                placeholder="e.g. Master Services Agreement v3"
                className="w-full text-xs sm:text-sm px-3.5 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Contract Text
                </label>
                <span className="text-[11px] text-slate-400">
                  {pastedText.length} characters • ~{pastedText.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <textarea
                rows={12}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste contract clauses, terms of service, or lease text here..."
                className="w-full text-xs sm:text-sm p-3.5 border border-slate-300 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* Privacy Option */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-start gap-3">
              <input
                id="pii-toggle-paste"
                type="checkbox"
                checked={enablePiiPreRedaction}
                onChange={(e) => setEnablePiiPreRedaction(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
              />
              <label htmlFor="pii-toggle-paste" className="text-xs text-slate-700 cursor-pointer">
                <strong className="text-slate-900 block font-bold">
                  Enable Client-Side PII Pre-Redaction
                </strong>
                Automatically masks US Social Security Numbers, phone numbers, and email addresses.
              </label>
            </div>

            <button
              type="submit"
              disabled={!pastedText.trim()}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm text-xs sm:text-sm transition-colors"
            >
              <span>Analyze Pasted Text</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </form>
        )}

        {/* Tab 3: Sample Contracts */}
        {!loading && activeTab === 'samples' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Select an authentic legal document template to explore our grounded analysis, risk radar, and action plans without needing to upload your own files:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SAMPLE_DOCUMENTS.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleSelectSample(doc)}
                  className="bg-white border border-slate-200 hover:border-slate-400 rounded-lg p-5 cursor-pointer shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                        {doc.documentType}
                      </span>
                      <span className="text-[10px] text-red-700 font-bold">
                        {doc.risks.filter((r) => r.severity === 'high').length} High Flags
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {doc.title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-3">
                      {doc.plainLanguageSummary}
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-900">
                    <span>Instant 1-Click Load</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
