import React from 'react';
import { LegalObligation } from '@/types/legal';
import { Clock, Calendar, AlertCircle, RefreshCw } from 'lucide-react';

interface ObligationsTableProps {
  obligations: LegalObligation[];
}

export const ObligationsTable: React.FC<ObligationsTableProps> = ({ obligations }) => {
  if (!obligations || obligations.length === 0) {
    return (
      <div className="p-6 text-center bg-white rounded-lg border border-slate-200 text-sm text-slate-500">
        No specific operational obligations detected in the parsed document.
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white border border-slate-200 rounded-lg shadow-2xs">
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
                <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                  {ob.party}
                </td>
                <td className="px-4 py-3 leading-relaxed max-w-sm">
                  {ob.description}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {ob.isRecurring ? (
                    <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs">
                      <RefreshCw className="w-3 h-3 text-slate-500" />
                      {ob.frequency || 'Recurring'}
                    </span>
                  ) : ob.deadline ? (
                    <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-xs font-medium">
                      <Clock className="w-3 h-3 text-amber-600" />
                      {ob.deadline}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs">Unspecified</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {ob.consequences ? (
                    <span className="text-red-700 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {ob.consequences}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-xs font-mono text-slate-500 whitespace-nowrap">
                  {ob.sourceSection || 'General'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
