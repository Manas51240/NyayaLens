'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckSquare,
  Printer,
  Download,
  FileCode,
  RotateCcw,
  Plus,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  HelpCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { getStoredDocuments, saveStoredDocument } from '@/lib/storage';
import { LegalDocument, ActionItem } from '@/types/legal';
import { AppShell } from '@/components/layout/AppShell';
import { EmptyState } from '@/components/common/EmptyState';
import { ActionPlanStats } from '@/components/action-plan/ActionPlanStats';
import { ActionPlanFilters } from '@/components/action-plan/ActionPlanFilters';
import { ActionPlanTable } from '@/components/action-plan/ActionPlanTable';
import { ActionItemModal } from '@/components/action-plan/ActionItemModal';

function ActionPlanContent() {
  const searchParams = useSearchParams();
  const docIdParam = searchParams.get('doc');
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');

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

  const loadDocState = (docId: string, docList: LegalDocument[]) => {
    const targetDoc = docList.find((d) => d.id === docId);
    if (!targetDoc) return;

    if (typeof window !== 'undefined') {
      try {
        const savedCompleted = localStorage.getItem(`nyayalens_action_plan_${docId}`);
        if (savedCompleted) {
          setCompletedItems(JSON.parse(savedCompleted));
        } else {
          setCompletedItems({});
        }

        const savedCustom = localStorage.getItem(`nyayalens_actions_${docId}`);
        if (savedCustom) {
          const parsed = JSON.parse(savedCustom);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setActionItems(parsed);
            return;
          }
        }
      } catch {
        // Fall back gracefully on storage parse error
      }
    }

    setActionItems(targetDoc.actionItems || []);
  };

  useEffect(() => {
    const docs = getStoredDocuments();
    setDocuments(docs);

    if (docIdParam) {
      const match = docs.find((d) => d.id === docIdParam);
      if (match) {
        setSelectedDocId(docIdParam);
        loadDocState(docIdParam, docs);
        setMounted(true);
        return;
      } else {
        // Asynchronously fetch from server session storage if not in client storage
        fetch(`/api/documents/${docIdParam}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.document) {
              const updated = [data.document, ...docs.filter((d) => d.id !== data.document.id)];
              setDocuments(updated);
              saveStoredDocument(data.document);
              setSelectedDocId(data.document.id);
              loadDocState(data.document.id, updated);
            } else if (docs.length > 0) {
              setSelectedDocId(docs[0].id);
              loadDocState(docs[0].id, docs);
            }
          })
          .catch(() => {
            if (docs.length > 0) {
              setSelectedDocId(docs[0].id);
              loadDocState(docs[0].id, docs);
            }
          })
          .finally(() => {
            setMounted(true);
          });
        return;
      }
    } else if (docs.length > 0) {
      setSelectedDocId(docs[0].id);
      loadDocState(docs[0].id, docs);
    }
    setMounted(true);
  }, [docIdParam]);

  const activeDoc = documents.find((d) => d.id === selectedDocId);

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

    setIsAddModalOpen(false);
    setEditingItem(null);
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

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleExportMarkdown = () => {
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
    (activeDoc.risks || []).forEach((r, idx) => {
      md += `${idx + 1}. "${r.suggestedQuestionForLawyer}" (Focus: ${r.title})\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeDocName = (activeDoc.fileName || activeDoc.title || 'document').replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `Action_Plan_${safeDocName}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
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
      questionsForCounsel: (activeDoc.risks || []).map((r) => ({
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
    const safeDocName = (activeDoc.fileName || activeDoc.title || 'document').replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `Action_Plan_${safeDocName}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Distinct category list for filter dropdown
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    actionItems.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set);
  }, [actionItems]);

  // Filtered action items based on active criteria
  const filteredActionItems = useMemo(() => {
    return actionItems.filter((item) => {
      if (filterPriority !== 'all' && item.priority !== filterPriority) return false;
      if (filterCategory !== 'all' && item.category !== filterCategory) return false;
      const isDone = !!completedItems[item.id];
      if (filterStatus === 'pending' && isDone) return false;
      if (filterStatus === 'completed' && !isDone) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchAction = item.action.toLowerCase().includes(q);
        const matchCategory = item.category.toLowerCase().includes(q);
        const matchParty = item.responsibleParty?.toLowerCase().includes(q);
        const matchNotice = item.noticePeriod?.toLowerCase().includes(q);
        if (!matchAction && !matchCategory && !matchParty && !matchNotice) return false;
      }
      return true;
    });
  }, [actionItems, filterPriority, filterCategory, filterStatus, searchQuery, completedItems]);

  const highPriorityCount = actionItems.filter((a) => a.priority === 'high').length;
  const completedCount = actionItems.filter((a) => completedItems[a.id]).length;
  const completionPercentage = actionItems.length > 0 ? Math.round((completedCount / actionItems.length) * 100) : 0;
  const hasActiveFilters = filterPriority !== 'all' || filterCategory !== 'all' || filterStatus !== 'all' || !!searchQuery.trim();

  if (!mounted) return null;

  if (!activeDoc) {
    return (
      <div className="py-16">
        <EmptyState type="empty-binder" />
      </div>
    );
  }

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
        {/* Header & Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6 no-print">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href={`/app/document/${activeDoc.id}`}
                className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Document</span>
              </Link>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Execution & Due Diligence Action Plan
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Prioritized operational milestones, notice windows, and legal review checklists.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {documents.length > 1 && (
              <select
                value={selectedDocId}
                onChange={(e) => handleSelectDoc(e.target.value)}
                className="text-xs p-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
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
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Action</span>
            </button>

            <button
              onClick={handleExportMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded-md shadow-2xs transition-colors"
              title="Export formatted Markdown checklist"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export MD</span>
            </button>

            <button
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded-md shadow-2xs transition-colors"
              title="Export structured JSON data"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded-md shadow-2xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={handleResetChecklist}
              className="p-2 border border-slate-300 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
              title="Reset checklist to initial document state"
              aria-label="Reset checklist"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Metrics Summary Stats */}
        <ActionPlanStats
          totalCount={actionItems.length}
          highPriorityCount={highPriorityCount}
          completedCount={completedCount}
          completionPercentage={completionPercentage}
        />

        {/* Filters and Search Bar */}
        <ActionPlanFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterPriority={filterPriority}
          onPriorityChange={setFilterPriority}
          filterCategory={filterCategory}
          onCategoryChange={setFilterCategory}
          filterStatus={filterStatus}
          onStatusChange={setFilterStatus}
          categories={uniqueCategories}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={() => {
            setSearchQuery('');
            setFilterPriority('all');
            setFilterCategory('all');
            setFilterStatus('all');
          }}
        />

        {/* Action Items List Table */}
        <ActionPlanTable
          items={filteredActionItems}
          completedItems={completedItems}
          onToggleComplete={toggleComplete}
          onEdit={openEditModal}
          onDelete={handleDeleteItem}
          onOpenAddModal={openAddModal}
        />

        {/* Critical Dates Section */}
        {activeDoc.keyDates && activeDoc.keyDates.length > 0 && (
          <section className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Identified Key Contract Milestones & Dates</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {activeDoc.keyDates.map((kd, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="text-slate-500 block font-medium text-[11px]">{kd.label}</span>
                  <span className="text-slate-900 font-bold mt-0.5 block">{kd.date}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Accessible Add/Edit Action Item Modal with strict circular focus trap */}
        <ActionItemModal
          isOpen={isAddModalOpen}
          editingItem={editingItem}
          formAction={formAction}
          setFormAction={setFormAction}
          formPriority={formPriority}
          setFormPriority={setFormPriority}
          formCategory={formCategory}
          setFormCategory={setFormCategory}
          formTimeline={formTimeline}
          setFormTimeline={setFormTimeline}
          formResponsibleParty={formResponsibleParty}
          setFormResponsibleParty={setFormResponsibleParty}
          formNoticePeriod={formNoticePeriod}
          setFormNoticePeriod={setFormNoticePeriod}
          formDocsToGather={formDocsToGather}
          setFormDocsToGather={setFormDocsToGather}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingItem(null);
          }}
          onSave={handleSaveActionItem}
        />
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
