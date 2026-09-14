'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Scale,
  FolderOpen,
  PlusCircle,
  GitCompare,
  CheckSquare,
  FileText,
  Lock,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  HelpCircle,
  FileSearch,
  PanelLeftClose,
  PanelLeftOpen,
  FileCheck
} from 'lucide-react';
import { getStoredDocuments, resetToDefaultSampleDocuments } from '@/lib/storage';
import { LegalDocument } from '@/types/legal';

interface AppShellProps {
  children: React.ReactNode;
  activeDocumentId?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  activeDocumentId,
  breadcrumbs = [],
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [docMenuOpen, setDocMenuOpen] = useState(false);

  useEffect(() => {
    setDocuments(getStoredDocuments());
  }, [pathname]);

  const activeDoc = documents.find((d) => d.id === activeDocumentId) || documents[0];

  const navItems = [
    { label: 'Dashboard', href: '/app', icon: FolderOpen },
    { label: 'Analyze New', href: '/app/analyze', icon: PlusCircle },
    { label: 'Compare Contracts', href: '/app/compare', icon: GitCompare },
    { label: 'Action Plan', href: activeDoc ? `/app/action-plan?doc=${activeDoc.id}` : '/app/action-plan', icon: CheckSquare },
    { label: 'Consultation Brief', href: activeDoc ? `/app/consultation?doc=${activeDoc.id}` : '/app/consultation', icon: FileText },
  ];

  const handleDocumentSwitch = (id: string) => {
    setDocMenuOpen(false);
    setMobileDrawerOpen(false);
    // If currently on a document sub-route, preserve the subroute
    if (pathname.includes('/risks')) {
      router.push(`/app/document/${id}/risks`);
    } else if (pathname.includes('/ask')) {
      router.push(`/app/document/${id}/ask`);
    } else if (pathname.includes('/action-plan')) {
      router.push(`/app/action-plan?doc=${id}`);
    } else if (pathname.includes('/consultation')) {
      router.push(`/app/consultation?doc=${id}`);
    } else {
      router.push(`/app/document/${id}`);
    }
  };

  const handleResetSamples = () => {
    if (confirm('Reset to default sample contracts? Custom uploaded documents will be removed.')) {
      resetToDefaultSampleDocuments();
      setDocuments(getStoredDocuments());
      router.push('/app');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row pb-16 md:pb-0">
      {/* Desktop & Tablet Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 select-none z-30 ${
          sidebarCollapsed ? 'w-18' : 'w-64'
        }`}
        aria-label="Application Sidebar"
      >
        {/* Sidebar Brand & Collapse Toggle */}
        <div className="h-16 border-b border-slate-200 px-4 flex items-center justify-between">
          {!sidebarCollapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-slate-900 text-amber-400 flex items-center justify-center shadow-xs">
                <Scale className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 tracking-tight text-base">
                NYAYALENS
              </span>
            </Link>
          )}

          {sidebarCollapsed && (
            <div className="w-8 h-8 rounded bg-slate-900 text-amber-400 flex items-center justify-center mx-auto shadow-xs">
              <Scale className="w-4 h-4" />
            </div>
          )}

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Document Switcher Dropdown (When Expanded) */}
        {!sidebarCollapsed && documents.length > 0 && (
          <div className="p-3 border-b border-slate-100 relative">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Active Legal Document:
            </span>
            <button
              onClick={() => setDocMenuOpen(!docMenuOpen)}
              className="w-full text-left p-2 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between transition-colors"
              aria-expanded={docMenuOpen}
              aria-haspopup="listbox"
            >
              <div className="truncate pr-2">
                <span className="text-xs font-semibold text-slate-900 block truncate">
                  {activeDoc ? activeDoc.title : 'Select Document'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono block">
                  {activeDoc ? activeDoc.documentType : ''}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {docMenuOpen && (
              <div className="absolute left-3 right-3 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 max-h-60 overflow-y-auto">
                <span className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 block">
                  Switch Document
                </span>
                {documents.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleDocumentSwitch(d.id)}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between ${
                      d.id === activeDoc?.id ? 'bg-slate-50 font-semibold text-slate-950' : 'text-slate-700'
                    }`}
                  >
                    <span className="truncate pr-2">{d.title}</span>
                    <span className="text-[10px] text-red-600 font-mono">
                      {d.risks.filter((r) => r.severity === 'high').length} high
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Primary Navigation Links */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto" aria-label="Sidebar Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/app'
                ? pathname === '/app'
                : pathname.startsWith(item.href.split('?')[0]);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Sidebar Footer */}
        {!sidebarCollapsed && (
          <div className="p-3 border-t border-slate-200 bg-slate-50/60 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-500 text-[11px]">
              <span>Binder: {documents.length} contracts</span>
              <button
                onClick={handleResetSamples}
                className="text-slate-600 hover:text-slate-900 underline flex items-center gap-0.5"
                title="Reset library to standard samples"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
            <Link
              href="/privacy"
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-[11px]"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Zero-Retention Policy</span>
            </Link>
          </div>
        )}
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Contextual Top Bar */}
        <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-slate-500 truncate" aria-label="Breadcrumb">
            <Link href="/app" className="hover:text-slate-900 font-medium">
              Dashboard
            </Link>
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                {b.href ? (
                  <Link href={b.href} className="hover:text-slate-900 truncate">
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-slate-900 font-semibold truncate">{b.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* Quick Context & Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {activeDoc && (
              <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded text-xs">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-mono">{activeDoc.fileName}</span>
              </div>
            )}

            <Link
              href="/app/analyze"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-2xs transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Upload Document</span>
            </Link>

            {/* Mobile Drawer Trigger */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-md"
              aria-label="Open Document Menu"
            >
              <Layers className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex items-center justify-around h-16 shadow-lg"
        aria-label="Mobile Navigation Bar"
      >
        <Link
          href="/app"
          className={`flex flex-col items-center justify-center w-full h-full py-1 text-[10px] font-medium ${
            pathname === '/app' ? 'text-slate-950 font-bold' : 'text-slate-500'
          }`}
        >
          <FolderOpen className="w-5 h-5 mb-0.5" />
          <span>Dashboard</span>
        </Link>

        <Link
          href="/app/analyze"
          className={`flex flex-col items-center justify-center w-full h-full py-1 text-[10px] font-medium ${
            pathname.startsWith('/app/analyze') ? 'text-slate-950 font-bold' : 'text-slate-500'
          }`}
        >
          <PlusCircle className="w-5 h-5 mb-0.5 text-amber-600" />
          <span>Analyze</span>
        </Link>

        {activeDoc && (
          <Link
            href={`/app/document/${activeDoc.id}`}
            className={`flex flex-col items-center justify-center w-full h-full py-1 text-[10px] font-medium ${
              pathname.startsWith('/app/document') ? 'text-slate-950 font-bold' : 'text-slate-500'
            }`}
          >
            <FileText className="w-5 h-5 mb-0.5" />
            <span>Document</span>
          </Link>
        )}

        <Link
          href="/app/compare"
          className={`flex flex-col items-center justify-center w-full h-full py-1 text-[10px] font-medium ${
            pathname.startsWith('/app/compare') ? 'text-slate-950 font-bold' : 'text-slate-500'
          }`}
        >
          <GitCompare className="w-5 h-5 mb-0.5" />
          <span>Compare</span>
        </Link>

        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="flex flex-col items-center justify-center w-full h-full py-1 text-[10px] font-medium text-slate-500"
          aria-label="Open More Actions"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </nav>

      {/* Mobile Slide-Over Binder Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="relative ml-auto w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-bold text-slate-900 text-sm">Legal Documents Binder</span>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Your Contracts ({documents.length})
              </span>
              <div className="space-y-1.5">
                {documents.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleDocumentSwitch(d.id)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors ${
                      d.id === activeDoc?.id
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-semibold block truncate">{d.title}</span>
                    <span className={`text-[10px] block mt-0.5 ${d.id === activeDoc?.id ? 'text-slate-300' : 'text-slate-500'}`}>
                      {d.documentType}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
              <Link
                href={activeDoc ? `/app/action-plan?doc=${activeDoc.id}` : '/app/action-plan'}
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-2 py-2 text-slate-700 hover:text-slate-950 font-medium"
              >
                <CheckSquare className="w-4 h-4 text-amber-600" />
                <span>Action Plan & Checklist</span>
              </Link>
              <Link
                href={activeDoc ? `/app/consultation?doc=${activeDoc.id}` : '/app/consultation'}
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-2 py-2 text-slate-700 hover:text-slate-950 font-medium"
              >
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Consultation Memorandum</span>
              </Link>
              <Link
                href="/privacy"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-2 py-2 text-slate-700 hover:text-slate-950 font-medium"
              >
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Privacy & Zero Retention</span>
              </Link>
              <button
                onClick={handleResetSamples}
                className="w-full flex items-center justify-center gap-1.5 py-2 mt-2 rounded bg-slate-100 text-slate-700 font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Sample Contracts</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
