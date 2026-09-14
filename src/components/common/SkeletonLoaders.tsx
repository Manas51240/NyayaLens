'use client';

import React from 'react';

export const MetricCardSkeleton: React.FC = () => (
  <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
    <div className="flex items-center justify-between">
      <div className="h-3 w-24 rounded skeleton-shimmer"></div>
      <div className="h-4 w-4 rounded-full skeleton-shimmer"></div>
    </div>
    <div className="h-8 w-14 rounded skeleton-shimmer"></div>
    <div className="h-2.5 w-32 rounded skeleton-shimmer"></div>
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-8 animate-pulse" aria-busy="true" aria-label="Loading dashboard data">
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <div className="h-7 w-48 rounded skeleton-shimmer"></div>
        <div className="h-3.5 w-72 rounded skeleton-shimmer"></div>
      </div>
      <div className="h-9 w-32 rounded skeleton-shimmer"></div>
    </div>

    {/* Metric Cards Grid */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCardSkeleton />
      <MetricCardSkeleton />
      <MetricCardSkeleton />
      <MetricCardSkeleton />
    </div>

    {/* Table Shimmer */}
    <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div className="h-4 w-36 rounded skeleton-shimmer"></div>
        <div className="h-8 w-48 rounded skeleton-shimmer"></div>
      </div>
      <div className="space-y-3 pt-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 w-full rounded skeleton-shimmer"></div>
        ))}
      </div>
    </div>
  </div>
);

export const WorkspaceSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading document workspace">
    {/* Header */}
    <div className="bg-white border-b border-slate-200 p-6 space-y-3">
      <div className="h-4 w-32 rounded skeleton-shimmer"></div>
      <div className="h-7 w-72 rounded skeleton-shimmer"></div>
      <div className="h-4 w-96 rounded skeleton-shimmer"></div>
    </div>

    {/* Dual Pane */}
    <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="h-32 w-full rounded-lg skeleton-shimmer"></div>
        <div className="h-48 w-full rounded-lg skeleton-shimmer"></div>
        <div className="h-48 w-full rounded-lg skeleton-shimmer"></div>
      </div>
      <div className="space-y-4">
        <div className="h-64 w-full rounded-lg skeleton-shimmer"></div>
        <div className="h-48 w-full rounded-lg skeleton-shimmer"></div>
      </div>
    </div>
  </div>
);

export const RiskRadarSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading risk radar">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-24 rounded-lg skeleton-shimmer"></div>
      ))}
    </div>
    <div className="h-28 rounded-lg skeleton-shimmer"></div>
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-36 rounded-lg skeleton-shimmer"></div>
      ))}
    </div>
  </div>
);

export const ChatMessageSkeleton: React.FC = () => (
  <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg max-w-md animate-pulse">
    <div className="w-6 h-6 rounded-full skeleton-shimmer shrink-0"></div>
    <div className="space-y-2 flex-1">
      <div className="h-3 w-3/4 rounded skeleton-shimmer"></div>
      <div className="h-3 w-full rounded skeleton-shimmer"></div>
      <div className="h-3 w-1/2 rounded skeleton-shimmer"></div>
    </div>
  </div>
);
