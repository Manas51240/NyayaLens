'use client';

import React from 'react';
import { CheckSquare, AlertTriangle, Clock, Layers } from 'lucide-react';

interface ActionPlanStatsProps {
  totalCount: number;
  highPriorityCount: number;
  completedCount: number;
  completionPercentage: number;
}

export const ActionPlanStats: React.FC<ActionPlanStatsProps> = ({
  totalCount,
  highPriorityCount,
  completedCount,
  completionPercentage,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 no-print">
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">Total Action Items</span>
          <Layers className="w-4 h-4 text-slate-400" />
        </div>
        <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalCount}</p>
        <span className="text-[10px] text-slate-400">Extracted & custom tasks</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">High Priority</span>
          <AlertTriangle className="w-4 h-4 text-red-500" />
        </div>
        <p className="text-2xl font-extrabold text-red-600 mt-1">{highPriorityCount}</p>
        <span className="text-[10px] text-red-600/80 font-medium">Critical review items</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">Completed</span>
          <CheckSquare className="w-4 h-4 text-emerald-500" />
        </div>
        <p className="text-2xl font-extrabold text-emerald-600 mt-1">{completedCount}</p>
        <span className="text-[10px] text-emerald-600/80 font-medium">Verified milestones</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">Execution Progress</span>
          <Clock className="w-4 h-4 text-amber-500" />
        </div>
        <p className="text-2xl font-extrabold text-slate-900 mt-1">{completionPercentage}%</p>
        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
          <div
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
