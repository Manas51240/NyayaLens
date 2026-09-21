'use client';

import React from 'react';
import { Filter, Search, RotateCcw } from 'lucide-react';

interface ActionPlanFiltersProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  filterPriority: string;
  onPriorityChange: (val: string) => void;
  filterCategory: string;
  onCategoryChange: (val: string) => void;
  filterStatus: 'all' | 'pending' | 'completed';
  onStatusChange: (val: 'all' | 'pending' | 'completed') => void;
  categories: string[];
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

export const ActionPlanFilters: React.FC<ActionPlanFiltersProps> = ({
  searchQuery,
  onSearchChange,
  filterPriority,
  onPriorityChange,
  filterCategory,
  onCategoryChange,
  filterStatus,
  onStatusChange,
  categories,
  hasActiveFilters,
  onResetFilters,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 no-print">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search action items, parties, or notice clauses..."
            className="w-full text-xs pl-9 pr-3.5 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-md shrink-0">
          {(['all', 'pending', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => onStatusChange(status)}
              className={`px-3 py-1 text-xs font-semibold rounded capitalize transition-colors ${
                filterStatus === status
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Dropdown Filters & Reset */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Filters:</span>
        </div>

        {/* Priority Filter */}
        <select
          value={filterPriority}
          onChange={(e) => onPriorityChange(e.target.value)}
          className="text-xs py-1 px-2.5 border border-slate-200 rounded bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
        >
          <option value="all">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>

        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="text-xs py-1 px-2.5 border border-slate-200 rounded bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900 text-xs font-medium ml-auto"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>
    </div>
  );
};
