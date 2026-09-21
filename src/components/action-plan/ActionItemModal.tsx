'use client';

import React, { useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';
import { ActionItem } from '@/types/legal';

interface ActionItemModalProps {
  isOpen: boolean;
  editingItem: ActionItem | null;
  formAction: string;
  setFormAction: (val: string) => void;
  formPriority: 'high' | 'medium' | 'low';
  setFormPriority: (val: 'high' | 'medium' | 'low') => void;
  formCategory: string;
  setFormCategory: (val: string) => void;
  formTimeline: string;
  setFormTimeline: (val: string) => void;
  formResponsibleParty: string;
  setFormResponsibleParty: (val: string) => void;
  formNoticePeriod: string;
  setFormNoticePeriod: (val: string) => void;
  formDocsToGather: string;
  setFormDocsToGather: (val: string) => void;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
}

export const ActionItemModal: React.FC<ActionItemModalProps> = ({
  isOpen,
  editingItem,
  formAction,
  setFormAction,
  formPriority,
  setFormPriority,
  formCategory,
  setFormCategory,
  formTimeline,
  setFormTimeline,
  formResponsibleParty,
  setFormResponsibleParty,
  formNoticePeriod,
  setFormNoticePeriod,
  formDocsToGather,
  setFormDocsToGather,
  onClose,
  onSave,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Save active element for focus restoration upon modal dismissal
    triggerRef.current = document.activeElement as HTMLElement | null;

    // Focus first input field
    const timer = setTimeout(() => {
      firstInputRef.current?.focus();
    }, 50);

    // Prevent body scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Strict circular keyboard focus trap handler
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (!dialogRef.current) return;

        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Backward tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Forward tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      // Restore focus to triggering button
      triggerRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      aria-hidden="false"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-modal-title"
        className="bg-white border border-slate-200 rounded-lg shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <h3 id="action-modal-title" className="text-sm font-bold text-slate-900">
            {editingItem ? 'Edit Action Item' : 'Add New Action Item'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={onSave} className="p-6 space-y-4 text-xs">
          <div>
            <label htmlFor="action-title-input" className="font-semibold text-slate-700 block mb-1">
              Action Description <span className="text-red-500">*</span>
            </label>
            <input
              id="action-title-input"
              ref={firstInputRef}
              type="text"
              required
              value={formAction}
              onChange={(e) => setFormAction(e.target.value)}
              placeholder="e.g. Provide written opt-out notice to landlord"
              className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="action-priority-select" className="font-semibold text-slate-700 block mb-1">
                Priority Level
              </label>
              <select
                id="action-priority-select"
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as 'high' | 'medium' | 'low')}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>

            <div>
              <label htmlFor="action-category-input" className="font-semibold text-slate-700 block mb-1">
                Category
              </label>
              <input
                id="action-category-input"
                type="text"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="e.g. Termination, Notice"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="action-timeline-input" className="font-semibold text-slate-700 block mb-1">
                Timeline / Deadline
              </label>
              <input
                id="action-timeline-input"
                type="text"
                value={formTimeline}
                onChange={(e) => setFormTimeline(e.target.value)}
                placeholder="e.g. Within 30 days"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label htmlFor="action-responsible-input" className="font-semibold text-slate-700 block mb-1">
                Responsible Party
              </label>
              <input
                id="action-responsible-input"
                type="text"
                value={formResponsibleParty}
                onChange={(e) => setFormResponsibleParty(e.target.value)}
                placeholder="e.g. Tenant, Legal Lead"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label htmlFor="action-notice-input" className="font-semibold text-slate-700 block mb-1">
              Required Notice Window
            </label>
            <input
              id="action-notice-input"
              type="text"
              value={formNoticePeriod}
              onChange={(e) => setFormNoticePeriod(e.target.value)}
              placeholder="e.g. 60 days prior to renewal"
              className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div>
            <label htmlFor="action-docs-textarea" className="font-semibold text-slate-700 block mb-1">
              Documents to Gather (one per line)
            </label>
            <textarea
              id="action-docs-textarea"
              rows={2}
              value={formDocsToGather}
              onChange={(e) => setFormDocsToGather(e.target.value)}
              placeholder="Original lease agreement&#10;Certified mail receipt"
              className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors font-semibold inline-flex items-center gap-1.5 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{editingItem ? 'Update Action' : 'Save Action Item'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
