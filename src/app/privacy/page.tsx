'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Lock,
  ShieldCheck,
  Trash2,
  Database,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowLeft
} from 'lucide-react';
import {
  getStoredPrivacySettings,
  saveStoredPrivacySettings,
  clearAllStoredDocuments,
  PrivacySettings,
} from '@/lib/storage';

export default function PrivacyPage() {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [purged, setPurged] = useState(false);

  useEffect(() => {
    setSettings(getStoredPrivacySettings());
  }, []);

  const handleUpdate = (updated: Partial<PrivacySettings>) => {
    const next = saveStoredPrivacySettings(updated);
    setSettings(next);
  };

  const handlePurge = () => {
    if (confirm('Are you sure? This will delete all analyzed contracts, extracted clauses, and chat history from your browser local storage.')) {
      clearAllStoredDocuments();
      setPurged(true);
      setTimeout(() => setPurged(false), 4000);
    }
  };

  if (!settings) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Link href="/app" className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
          <Lock className="w-7 h-7 text-indigo-600" />
          <span>Privacy Architecture & Data Controls</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          NyayaLens is built on zero-retention principles. Your sensitive legal documents belong to you.
        </p>
      </div>

      {purged && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>All document data and analysis history have been permanently purged from browser storage.</span>
        </div>
      )}

      {/* Interactive Privacy Settings Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          Client Storage & Redaction Preferences
        </h2>

        {/* Setting 1: Storage Mode */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5 max-w-xl">
            <span className="text-sm font-semibold text-slate-900">
              Document Retention Mode
            </span>
            <p className="text-xs text-slate-500 leading-relaxed">
              Choose whether analyzed documents remain in your browser's local sandbox or are discarded as soon as your browser session closes.
            </p>
          </div>
          <select
            value={settings.storageMode}
            onChange={(e) =>
              handleUpdate({ storageMode: e.target.value as 'local_only' | 'session_only' })
            }
            className="text-xs p-2.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="local_only">Local Storage (Persistent on this device)</option>
            <option value="session_only">Session Only (Purge on tab close)</option>
          </select>
        </div>

        {/* Setting 2: Automatic PII Pre-Redaction */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="space-y-0.5 max-w-xl">
            <span className="text-sm font-semibold text-slate-900">
              Default PII Pre-Redaction
            </span>
            <p className="text-xs text-slate-500 leading-relaxed">
              When enabled, Social Security Numbers, credit card patterns, telephone numbers, and email addresses are automatically masked prior to AI evaluation.
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.enablePiiPreRedaction}
            onChange={(e) => handleUpdate({ enablePiiPreRedaction: e.target.checked })}
            className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
          />
        </div>

        {/* Setting 3: Telemetry */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="space-y-0.5 max-w-xl">
            <span className="text-sm font-semibold text-slate-900">
              Anonymous Performance Telemetry
            </span>
            <p className="text-xs text-slate-500 leading-relaxed">
              Allow aggregated anonymous latency and error telemetry. Document text is never included.
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.allowAnonymousTelemetry}
            onChange={(e) => handleUpdate({ allowAnonymousTelemetry: e.target.checked })}
            className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
          />
        </div>

        {/* Data Purge Button */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <div>
            <span className="text-sm font-semibold text-red-700 block">
              Purge All Stored Data
            </span>
            <span className="text-xs text-slate-500">
              Permanently wipe all analyzed contracts, clause extractions, and Q&A threads.
            </span>
          </div>
          <button
            onClick={handlePurge}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold rounded-md transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge All Documents Now</span>
          </button>
        </div>
      </div>

      {/* Trust & Architecture Principles */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Data Lifecycle Transparency</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>No Model Training Guarantee</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              API calls to Google Gemini are executed through private enterprise endpoints with zero-data-retention and zero model training. Your proprietary legal documents are never utilized to fine-tune public models.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Isolated Ephemeral Execution</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Uploaded files are processed in ephemeral memory on secure server-side routes. They are never written to permanent cloud disks or database records without your explicit consent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
