'use client';

import React from 'react';
import {
  CheckSquare,
  Square,
  Edit2,
  Trash2,
  Clock,
  User,
  AlertTriangle,
  FileText,
  HelpCircle,
  Plus
} from 'lucide-react';
import { ActionItem } from '@/types/legal';

interface ActionPlanTableProps {
  items: ActionItem[];
  completedItems: Record<string, boolean>;
  onToggleComplete: (id: string) => void;
  onEdit: (item: ActionItem) => void;
  onDelete: (id: string) => void;
  onOpenAddModal: () => void;
}

export const ActionPlanTable: React.FC<ActionPlanTableProps> = ({
  items,
  completedItems,
  onToggleComplete,
  onEdit,
  onDelete,
  onOpenAddModal,
}) => {
  if (items.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-3 no-print">
        <p className="text-slate-500 text-xs sm:text-sm">
          No action items match the current filter criteria.
        </p>
        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Action Item</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isDone = !!completedItems[item.id];
        const isHigh = item.priority === 'high';
        const isMedium = item.priority === 'medium';

        return (
          <article
            key={item.id}
            className={`bg-white border rounded-lg p-4 sm:p-5 transition-all shadow-xs ${
              isDone
                ? 'border-slate-200 bg-slate-50/70 opacity-80'
                : isHigh
                ? 'border-red-200 hover:border-red-300'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              {/* Checkbox and Title */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => onToggleComplete(item.id)}
                  className={`mt-0.5 rounded p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 transition-colors ${
                    isDone
                      ? 'text-emerald-600 hover:text-emerald-700'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  aria-label={isDone ? `Mark "${item.action}" as incomplete` : `Mark "${item.action}" as completed`}
                >
                  {isDone ? (
                    <CheckSquare className="w-5 h-5 fill-emerald-50" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs sm:text-sm font-bold tracking-tight ${
                        isDone ? 'line-through text-slate-500' : 'text-slate-900'
                      }`}
                    >
                      {item.action}
                    </span>

                    {/* Priority Badge */}
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded font-mono ${
                        isHigh
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : isMedium
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {item.priority} Priority
                    </span>

                    {/* Category */}
                    <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">
                      {item.category}
                    </span>
                  </div>

                  {/* Metadata Row: Timeline, Party, Notice */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-0.5 font-sans">
                    {item.timeline && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Timeline: <strong>{item.timeline}</strong></span>
                      </span>
                    )}

                    {item.responsibleParty && (
                      <span className="inline-flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Owner: <strong>{item.responsibleParty}</strong></span>
                      </span>
                    )}

                    {item.noticePeriod && (
                      <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Notice Window: {item.noticePeriod}</span>
                      </span>
                    )}
                  </div>

                  {/* Documents to Gather */}
                  {item.documentsToGather && item.documentsToGather.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1 mb-1">
                        <FileText className="w-3 h-3 text-slate-400" />
                        <span>Documents to Gather:</span>
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1">
                        {item.documentsToGather.map((doc, dIdx) => (
                          <li key={dIdx}>{doc}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Attorney Questions */}
                  {item.suggestedQuestionsForLawyer && item.suggestedQuestionsForLawyer.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1 mb-1">
                        <HelpCircle className="w-3 h-3 text-amber-600" />
                        <span>Targeted Attorney Questions:</span>
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1 italic">
                        {item.suggestedQuestionsForLawyer.map((q, qIdx) => (
                          <li key={qIdx}>&ldquo;{q}&rdquo;</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: Edit / Delete */}
              <div className="flex items-center gap-1 shrink-0 no-print">
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-slate-900"
                  aria-label={`Edit ${item.action}`}
                  title="Edit action item"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-red-600"
                  aria-label={`Delete ${item.action}`}
                  title="Delete action item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};
