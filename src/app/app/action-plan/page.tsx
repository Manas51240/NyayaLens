'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckSquare,
  Calendar,
  HelpCircle,
  FolderPlus,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Filter,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  Download,
  X,
  FileText,
  User,
  ShieldAlert
} from 'lucide-react';
import { getStoredDocuments, getStoredDocumentById, saveStoredDocument } from '@/lib/storage';
import { LegalDocument, ActionItem } from '@/types/legal';
import { AppShell } from '@/components/layout/AppShell';
import { EmptyState } from '@/components/common/EmptyState';

function ActionPlanContent() {
  const searchParams = useSearchParams();
  const docIdParam = searchParams.get('doc');
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);

  // Form states
  const [formAction, setFormAction] = useState('');
  const [formPriority, setFormPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [formCategory, setFormCategory] = useState('Operational Review');
  const [formTimeline, setFormTimeline] = useState('');
  const [formResponsibleParty, setFormResponsibleParty] = useState('');
  const [formNoticePeriod, setFormNoticePeriod] = useState('');
  const [formDocsToGather, setFormDocsToGather] = useState('');

  useEffect(() => {
    const docs = getStoredDocuments();
    setDocuments(docs);
    let targetDocId = '';
    if (docIdParam && docs.some((d) => d.id === docIdParam)) {
      targetDocId = docIdParam;
    } else if (docs.length > 0) {
      targetDocId = docs[0].id;
    }
    setSelectedDocId(targetDocId);

    if (targetDocId) {
      loadDocState(targetDocId, docs);
    }
    setMounted(true);
  }, [docIdParam]);

  const loadDocState = (docId: string, docList: LegalDocument[]) => {
    const targetDoc = docList.find((d) => d.id === docId);
    if (!targetDoc) return;

    // Load completed status
    if (typeof window !== 'undefined') {
      try {
        const savedCompleted = localStorage.getItem(`nyayalens_action_plan_${docId}`);
        if (savedCompleted) {
          setCompletedItems(JSON.parse(savedCompleted));
        } else {
          setCompletedItems({});
        }

        // Load custom / modified action items if available
        const savedCustom = localStorage.getItem(`nyayalens_actions_${docId}`);
        if (savedCustom) {
          const parsed = JSON.parse(savedCustom);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setActionItems(parsed);
            return;
          }
        }
      } catch {
        // Ignore JSON error
      }
    }

    setActionItems(targetDoc.actionItems || []);
  };

  const handleSelectDoc = (newDocId: string) => {
    setSelectedDocId(newDocId);
    loadDocState(newDocId, documents);
  };

  const toggleComplete = (itemId: string) => {
    setCompletedItems((prev) => {
      const updated = {
        ...prev,
        [itemId]: !prev[itemId],
      };
      if (selectedDocId && typeof window !== 'undefined') {
        try {
          localStorage.setItem(`nyayalens_action_plan_${selectedDocId}`, JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  const handleResetChecklist = () => {
    const activeDoc = documents.find((d) => d.id === selectedDocId);
    if (!activeDoc) return;

    if (confirm('Reset action plan back to initial document findings? Custom additions will be cleared.')) {
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(`nyayalens_action_plan_${selectedDocId}`);
          localStorage.removeItem(`nyayalens_actions_${selectedDocId}`);
        } catch {}
      }
      setCompletedItems({});
      setActionItems(activeDoc.actionItems || []);
    }
  };

  const handleSaveActionItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAction.trim()) return;

    const docsList = formDocsToGather
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    let updatedList: ActionItem[];

    if (editingItem) {
      // Edit existing
      updatedList = actionItems.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              action: formAction.trim(),
              priority: formPriority,
              category: formCategory.trim(),
              timeline: formTimeline.trim() || undefined,
              responsibleParty: formResponsibleParty.trim() || undefined,
              noticePeriod: formNoticePeriod.trim() || undefined,
              documentsToGather: docsList.length > 0 ? docsList : item.documentsToGather,
            }
          : item
      );
    } else {
      // Add new
      const newItem: ActionItem = {
        id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        action: formAction.trim(),
        priority: formPriority,
        category: formCategory.trim(),
        timeline: formTimeline.trim() || undefined,
        responsibleParty: formResponsibleParty.trim() || undefined,
        noticePeriod: formNoticePeriod.trim() || undefined,
        suggestedQuestionsForLawyer: [],
        documentsToGather: docsList,
        status: 'pending',
      };
      updatedList = [newItem, ...actionItems];
    }

    setActionItems(updatedList);
    if (selectedDocId && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`nyayalens_actions_${selectedDocId}`, JSON.stringify(updatedList));
      } catch {}
    }

    closeModal();
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm('Delete this action item from your checklist?')) {
      const updatedList = actionItems.filter((i) => i.id !== itemId);
      setActionItems(updatedList);
      if (selectedDocId && typeof window !== 'undefined') {
        try {
          localStorage.setItem(`nyayalens_actions_${selectedDocId}`, JSON.stringify(updatedList));
        } catch {}
      }
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormAction('');
    setFormPriority('medium');
    setFormCategory('Operational Review');
    setFormTimeline('');
    setFormResponsibleParty('');
    setFormNoticePeriod('');
    setFormDocsToGather('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (item: ActionItem) => {
    setEditingItem(item);
    setFormAction(item.action);
    setFormPriority(item.priority);
    setFormCategory(item.category);
    setFormTimeline(item.timeline || '');
    setFormResponsibleParty(item.responsibleParty || '');
    setFormNoticePeriod(item.noticePeriod || '');
    setFormDocsToGather((item.documentsToGather || []).join('\n'));
    setIsAddModalOpen(true);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingItem(null);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleExportMarkdown = () => {
    const activeDoc = documents.find((d) => d.id === selectedDocId);
    if (!activeDoc) return;

    let md = `# Legal Action Plan & Execution Checklist: ${activeDoc.title}\n`;
    md += `**Document:** ${activeDoc.fileName} (${activeDoc.documentType})\n`;
    md += `**Generated Date:** ${new Date().toLocaleDateString()}\n`;
    md += `**Notice:** Prepared via NyayaLens AI for client due diligence & attorney consultation preparation.\n\n`;
    md += `---\n\n`;

    md += `## 1. High Priority Immediate Actions\n\n`;
    const high = actionItems.filter((a) => a.priority === 'high');
    if (high.length === 0) {
      md += `*No high-priority immediate flags recorded.*\n\n`;
    } else {
      high.forEach((item) => {
        const isDone = completedItems[item.id] ? '[x]' : '[ ]';
        md += `- ${isDone} **${item.action}**\n`;
        md += `  - Category: ${item.category}\n`;
        if (item.timeline) md += `  - Deadline: ${item.timeline}\n`;
        if (item.responsibleParty) md += `  - Responsible Party: ${item.responsibleParty}\n`;
        if (item.noticePeriod) md += `  - Notice Window: ${item.noticePeriod}\n`;
        if (item.documentsToGather && item.documentsToGather.length > 0) {
          md += `  - Documents to Gather: ${item.documentsToGather.join(', ')}\n`;
        }
      });
      md += `\n`;
    }

    md += `## 2. Operational Review Tasks\n\n`;
    const others = actionItems.filter((a) => a.priority !== 'high');
    if (others.length === 0) {
      md += `*No operational tasks recorded.*\n\n`;
    } else {
      others.forEach((item) => {
        const isDone = completedItems[item.id] ? '[x]' : '[ ]';
        md += `- ${isDone} **${item.action}**\n`;
        md += `  - Category: ${item.category} (${item.priority.toUpperCase()})\n`;
        if (item.timeline) md += `  - Deadline: ${item.timeline}\n`;
        if (item.responsibleParty) md += `  - Responsible Party: ${item.responsibleParty}\n`;
      });
      md += `\n`;
    }

    md += `## 3. Critical Dates & Timelines\n\n`;
    md += `- Effective Date: ${activeDoc.effectiveDate || 'Unspecified'}\n`;
    md += `- Expiration / Renewal: ${activeDoc.expirationDate || 'Unspecified'}\n`;
    if (activeDoc.keyDates) {
      activeDoc.keyDates.forEach((kd) => {
        md += `- ${kd.label}: ${kd.date}\n`;
      });
    }
    md += `\n`;

    md += `## 4. Counsel Questions Agenda\n\n`;
    activeDoc.risks.forEach((r, idx) => {
      md += `${idx + 1}. "${r.suggestedQuestionForLawyer}" (Focus: ${r.title})\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Action_Plan_${activeDoc.fileName.replace(/\.[^.]+$/, '')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const activeDoc = documents.find((d) => d.id === selectedDocId);
    if (!activeDoc) return;

    const exportPayload = {
      documentId: activeDoc.id,
      documentTitle: activeDoc.title,
      fileName: activeDoc.fileName,
      exportedAt: new Date().toISOString(),
      actionItems: actionItems.map((item) => ({
        ...item,
        isCompleted: Boolean(completedItems[item.id]),
      })),
      keyDates: activeDoc.keyDates,
      questionsForCounsel: activeDoc.risks.map((r) => ({
        question: r.suggestedQuestionForLawyer,
        category: r.category,
      })),
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Action_Plan_${activeDoc.fileName.replace(/\.[^.]+$/, '')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const activeDoc = documents.find((d) => d.id === selectedDocId);

  if (!mounted) return null;

  if (!activeDoc) {
    return (
      <div className="py-16">
        <EmptyState type="empty-binder" />
      </div>
    );
  }

  const highPriorityActions = actionItems.filter((a) => a.priority === 'high');
  const mediumPriorityActions = actionItems.filter((a) => a.priority !== 'high');

  return (
    <AppShell
      activeDocumentId={activeDoc.id}
      breadcrumbs={[
        { label: 'Documents', href: '/app' },
        { label: activeDoc.title, href: `/app/document/${activeDoc.id}` },
        { label: 'Action Plan' },
      ]}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 print-page">
        {/* Header with Print & Export Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6 no-print">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                Execution & Due Diligence Checklist
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Contract Action Plan
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Structured tasks, deadlines, and counsel questions for: <strong>{activeDoc.title}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {documents.length > 1 && (
              <select
                value={selectedDocId}
                onChange={(e) => handleSelectDoc(e.target.value)}
                className="text-xs p-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
                aria-label="Select document for action plan"
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
              title="Add a custom action item"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Action</span>
            </button>

            <button
              onClick={handleExportMarkdown}
              className="inline-flex items-center gap-1 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded-md transition-colors"
              title="Export Action Plan as Markdown file"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export MD</span>
            </button>

            <button
              onClick={handleExportJson}
              className="inline-flex items-center gap-1 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded-md transition-colors"
              title="Export Action Plan as JSON"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>JSON</span>
            </button>

            <button
              onClick={handleResetChecklist}
              className="inline-flex items-center gap-1 px-2.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-600 text-xs font-semibold rounded-md transition-colors"
              title="Reset checklist to original findings"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Print-Only Header */}
        <div className="hidden print:block mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold text-slate-900">Legal Action Plan & Checklist</h1>
          <p className="text-xs text-slate-600">Document: {activeDoc.title} ({activeDoc.fileName})</p>
          <p className="text-xs text-slate-600">Generated by NyayaLens AI for client review preparation</p>
        </div>

        {/* Section 1: High Priority Actions */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h2 className="text-base sm:text-lg font-bold">High Priority Immediate Actions</h2>
            </div>
            <span className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
              {highPriorityActions.length} items
            </span>
          </div>

          <div className="space-y-3">
            {highPriorityActions.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 italic">
                No high-priority immediate flags recorded for this agreement.
              </div>
            ) : (
              highPriorityActions.map((item) => {
                const isDone = !!completedItems[item.id];
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border transition-all ${
                      isDone
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : 'bg-white border-red-200 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => toggleComplete(item.id)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                          id={`check-${item.id}`}
                        />
                        <div className="space-y-1 flex-1">
                          <label
                            htmlFor={`check-${item.id}`}
                            className={`text-sm font-semibold cursor-pointer block ${
                              isDone ? 'line-through text-slate-500' : 'text-slate-900'
                            }`}
                          >
                            {item.action}
                          </label>

                          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                            <span className="font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                              {item.category}
                            </span>
                            {item.timeline && (
                              <span className="flex items-center gap-1 text-slate-600 font-medium">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {item.timeline}
                              </span>
                            )}
                            {item.responsibleParty && (
                              <span className="flex items-center gap-1 text-slate-600 font-medium">
                                <User className="w-3 h-3 text-slate-400" />
                                {item.responsibleParty}
                              </span>
                            )}
                            {item.noticePeriod && (
                              <span className="text-[11px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                                Notice: {item.noticePeriod}
                              </span>
                            )}
                          </div>

                          {/* Documents to Gather */}
                          {item.documentsToGather && item.documentsToGather.length > 0 && (
                            <div className="mt-2 text-xs bg-slate-50 rounded p-2.5 border border-slate-200">
                              <span className="font-bold text-slate-700 block mb-0.5">
                                Supporting Documents to Gather for Counsel:
                              </span>
                              <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                                {item.documentsToGather.map((doc, idx) => (
                                  <li key={idx}>{doc}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Edit / Delete actions */}
                      <div className="flex items-center gap-1 no-print">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                          title="Edit action item"
                          aria-label="Edit action item"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                          title="Delete action item"
                          aria-label="Delete action item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Section 2: Review Items & Operational Tasks */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900">
              <CheckSquare className="w-5 h-5 text-amber-600" />
              <h2 className="text-base sm:text-lg font-bold">Operational Review Checklist</h2>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              {mediumPriorityActions.length} items
            </span>
          </div>

          <div className="space-y-3">
            {mediumPriorityActions.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 italic">
                No operational review items recorded. Click "Add Action" to create one.
              </div>
            ) : (
              mediumPriorityActions.map((item) => {
                const isDone = !!completedItems[item.id];
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border transition-all ${
                      isDone
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : 'bg-white border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => toggleComplete(item.id)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                          id={`check-${item.id}`}
                        />
                        <div className="space-y-1 flex-1">
                          <label
                            htmlFor={`check-${item.id}`}
                            className={`text-sm font-semibold cursor-pointer block ${
                              isDone ? 'line-through text-slate-500' : 'text-slate-900'
                            }`}
                          >
                            {item.action}
                          </label>
                          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                            <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                              {item.category}
                            </span>
                            {item.timeline && (
                              <span className="flex items-center gap-1 text-slate-600">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {item.timeline}
                              </span>
                            )}
                            {item.responsibleParty && (
                              <span className="flex items-center gap-1 text-slate-600 font-medium">
                                <User className="w-3 h-3 text-slate-400" />
                                {item.responsibleParty}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 no-print">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                          title="Edit action item"
                          aria-label="Edit action item"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                          title="Delete action item"
                          aria-label="Delete action item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Section 3: Important Calendar Dates */}
        <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900">
            <Calendar className="w-4 h-4 text-slate-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Critical Dates & Notice Windows
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[10px] text-slate-500 uppercase tracking-wide block font-bold">
                Effective Date
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-900">
                {activeDoc.effectiveDate || 'Unspecified'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[10px] text-slate-500 uppercase tracking-wide block font-bold">
                Expiration / Term End
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-900">
                {activeDoc.expirationDate || 'Unspecified'}
              </span>
            </div>

            {activeDoc.keyDates?.map((kd, i) => (
              <div
                key={i}
                className={`p-3 rounded border ${
                  kd.isCritical
                    ? 'bg-red-50/70 border-red-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className={`text-[10px] uppercase tracking-wide block font-bold ${
                  kd.isCritical ? 'text-red-700' : 'text-slate-500'
                }`}>
                  {kd.label}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-900">
                  {kd.date}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Target Questions for Legal Professional */}
        <section className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2 text-slate-900">
            <HelpCircle className="w-4 h-4 text-slate-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Target Questions to Bring to Your Lawyer
            </h3>
          </div>
          <p className="text-xs text-slate-600">
            Bring these specific, grounded questions to your attorney meeting to prioritize high-risk terms and avoid unnecessary billable time.
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-800">
            {activeDoc.risks.map((r, idx) => (
              <li key={idx} className="bg-white border border-slate-200 rounded p-3 flex items-start gap-2.5">
                <span className="font-bold text-amber-700 shrink-0">Q{idx + 1}:</span>
                <div className="space-y-0.5">
                  <span className="font-medium italic text-slate-900">"{r.suggestedQuestionForLawyer}"</span>
                  <span className="text-[11px] text-slate-500 block">
                    Focus: {r.title} ({r.category})
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Add / Edit Action Item Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-5">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  {editingItem ? 'Edit Action Item' : 'Add New Action Item'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveActionItem} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Action Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={formAction}
                    onChange={(e) => setFormAction(e.target.value)}
                    placeholder="e.g. Provide written opt-out notice to landlord"
                    className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Review Priority
                    </label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value as 'high' | 'medium' | 'low')}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                    >
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      placeholder="e.g. Termination, Notice"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Timeline / Deadline
                    </label>
                    <input
                      type="text"
                      value={formTimeline}
                      onChange={(e) => setFormTimeline(e.target.value)}
                      placeholder="e.g. Within 30 days"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Responsible Party
                    </label>
                    <input
                      type="text"
                      value={formResponsibleParty}
                      onChange={(e) => setFormResponsibleParty(e.target.value)}
                      placeholder="e.g. Tenant, Legal Lead"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Notice Window (if applicable)
                  </label>
                  <input
                    type="text"
                    value={formNoticePeriod}
                    onChange={(e) => setFormNoticePeriod(e.target.value)}
                    placeholder="e.g. 60 days prior to renewal"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Documents to Gather (one per line)
                  </label>
                  <textarea
                    rows={2}
                    value={formDocsToGather}
                    onChange={(e) => setFormDocsToGather(e.target.value)}
                    placeholder="Original lease agreement&#10;Certified mail receipt"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-md shadow-xs"
                  >
                    {editingItem ? 'Update Item' : 'Add Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function ActionPlanPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-4 py-16 text-center text-xs text-slate-500">
          Loading Action Plan...
        </div>
      }
    >
      <ActionPlanContent />
    </Suspense>
  );
}
