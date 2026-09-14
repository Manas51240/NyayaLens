'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Scale,
  FileSearch,
  GitCompare,
  CheckSquare,
  FileText,
  ShieldCheck,
  Menu,
  X,
  PlusCircle,
  FolderOpen
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/app', label: 'Dashboard', icon: FolderOpen },
    { href: '/app/analyze', label: 'Analyze', icon: PlusCircle },
    { href: '/app/compare', label: 'Compare', icon: GitCompare },
    { href: '/app/action-plan', label: 'Action Plan', icon: CheckSquare },
    { href: '/app/consultation', label: 'Consultation Brief', icon: FileText },
  ];

  const isActive = (href: string) => {
    if (href === '/app') return pathname === '/app';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-800 rounded-md py-1"
              aria-label="NyayaLens Home"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center shadow-sm">
                <Scale className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-slate-900 leading-none">
                  NYAYALENS
                </span>
                <span className="text-[10px] font-medium tracking-wide text-slate-500 uppercase mt-0.5">
                  Legal Understanding AI
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? 'bg-slate-100 text-slate-950 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-slate-900' : 'text-slate-500'}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action & Trust Badges */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/privacy"
              className="text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-md hover:bg-slate-100 inline-flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zero Retention</span>
            </Link>
            <Link
              href="/app/analyze"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-all shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>New Analysis</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-base font-medium ${
                  active
                    ? 'bg-slate-100 text-slate-950 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="w-5 h-5 text-slate-500" />
                <span>{link.label}</span>
              </Link>
            );
          })}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link
              href="/app/analyze"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-md"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>Upload Document</span>
            </Link>
            <div className="flex items-center justify-around py-2 text-xs text-slate-500">
              <Link href="/privacy" onClick={() => setMobileMenuOpen(false)} className="hover:underline">
                Privacy Controls
              </Link>
              <span>•</span>
              <Link href="/disclaimer" onClick={() => setMobileMenuOpen(false)} className="hover:underline">
                Legal Disclaimer
              </Link>
              <span>•</span>
              <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="hover:underline">
                About
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
