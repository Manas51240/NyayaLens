'use client';

import React from 'react';
import { LegalObligation } from '@/types/legal';
import { Clock, Calendar, AlertCircle, RefreshCw, UserCheck, Shield } from 'lucide-react';

interface ObligationsTableProps {
  obligations: LegalObligation[];
}

export const ObligationsTable: React.FC<ObligationsTableProps> = ({ obligations }) => {
  if (!obligations || obligations.length === 0) {
    return (
      <div className="p-6 text-center bg-white rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-500">
        No specific operational covenants or deadlines detected in the parsed document.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop & Tablet Table View (hidden on mobile) */}
      <div className="hidden md:block overflow-hidden bg-white border border-slate-200 rounded-lg shadow-2xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th scope="col" className="px-4 py-3">Responsible Party</th>
                <th scope="col" className="px-4 py-3">Obligation Description</th>
                <th scope="col" className="px-4 py-3">Deadline / Cadence</th>
                <th scope="col" className="px-4 py-3">Consequences / Notes</th>
                <th scope="col" className="px-4 py-3 text-right">Section</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {obligations.map((ob) => (
                <tr key={ob.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                    {ob.party}
                  </td>
                  <td className="px-4 py-3.5 leading-relaxed max-w-sm font-sans">
                    {ob.description}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {ob.isRecurring ? (
                      <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs font-medium">
                        <RefreshCw className="w-3 h-3 text-slate-500" />
                        {ob.frequency || 'Recurring'}
                      </span>
                    ) : ob.deadline ? (
                      <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-xs font-semibold">
                        <Clock className="w-3 h-3 text-amber-600" />
                        {ob.deadline}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">Unspecified</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-600">
                    {ob.consequences ? (
                      <span className="text-red-700 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {ob.consequences}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right text-xs font-mono text-slate-500 whitespace-nowrap">
                    {ob.sourceSection || 'General'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Structured Cards View (Shown only on small screens) */}
      <div className="md:hidden space-y-3">
        {obligations.map((ob) => (
          <div
            key={ob.id}
            className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-2.5 text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 uppercase text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                {ob.party}
              </span>
              <span className="font-mono text-slate-500 text-[10px]">
                {ob.sourceSection}
              </span>
            </div>

            <p className="text-slate-800 leading-relaxed font-medium">
              {ob.description}
            </p>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Timeline:</span>
                {ob.isRecurring ? (
                  <span className="text-slate-700 font-medium">{ob.frequency || 'Recurring'}</span>
                ) : ob.deadline ? (
                  <span className="text-amber-800 font-semibold">{ob.deadline}</span>
                ) : (
                  <span className="text-slate-400">Unspecified</span>
                )}
              </div>

              {ob.consequences && (
                <div className="flex items-start justify-between text-red-700 pt-0.5">
                  <span className="text-slate-500 shrink-0">Impact:</span>
                  <span className="font-medium text-right pl-2">{ob.consequences}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
