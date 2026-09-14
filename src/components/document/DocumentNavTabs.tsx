'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Radar, MessageSquareText, CheckSquare, Briefcase } from 'lucide-react';

interface DocumentNavTabsProps {
  documentId: string;
  riskCount?: number;
}

export const DocumentNavTabs: React.FC<DocumentNavTabsProps> = ({ documentId, riskCount = 0 }) => {
  const pathname = usePathname();

  const tabs = [
    {
      label: 'Document Overview',
      href: `/app/document/${documentId}`,
      icon: FileText,
      active: pathname === `/app/document/${documentId}`,
    },
    {
      label: 'Legal Risk Radar',
      href: `/app/document/${documentId}/risks`,
      icon: Radar,
      badge: riskCount > 0 ? riskCount : undefined,
      active: pathname === `/app/document/${documentId}/risks`,
    },
    {
      label: 'Ask Document',
      href: `/app/document/${documentId}/ask`,
      icon: MessageSquareText,
      active: pathname === `/app/document/${documentId}/ask`,
    },
    {
      label: 'Action Plan',
      href: `/app/action-plan?doc=${documentId}`,
      icon: CheckSquare,
      active: pathname.startsWith('/app/action-plan'),
    },
    {
      label: 'Consultation Brief',
      href: `/app/consultation?doc=${documentId}`,
      icon: Briefcase,
      active: pathname.startsWith('/app/consultation'),
    },
  ];

  return (
    <nav className="border-b border-slate-200 bg-white" aria-label="Document Section Navigation">
      <div className="flex space-x-1 sm:space-x-4 overflow-x-auto px-4 py-2 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                tab.active
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              aria-current={tab.active ? 'page' : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 ${tab.active ? 'text-amber-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    tab.active ? 'bg-amber-400 text-slate-950' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
