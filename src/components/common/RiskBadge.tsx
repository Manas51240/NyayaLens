import React from 'react';
import { RiskSeverity } from '@/types/legal';
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

interface RiskBadgeProps {
  severity: RiskSeverity;
  size?: 'sm' | 'md' | 'lg';
  showSubtext?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ severity, size = 'md', showSubtext = false }) => {
  const configs = {
    high: {
      bg: 'bg-red-50 text-red-800 border-red-200',
      indicator: 'bg-red-500',
      label: 'High Review Priority',
      icon: AlertTriangle,
    },
    medium: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      indicator: 'bg-amber-500',
      label: 'Medium Review Priority',
      icon: AlertCircle,
    },
    low: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      indicator: 'bg-emerald-500',
      label: 'Low Review Priority',
      icon: CheckCircle2,
    },
    informational: {
      bg: 'bg-slate-50 text-slate-700 border-slate-200',
      indicator: 'bg-slate-400',
      label: 'Informational',
      icon: Info,
    },
  };

  const config = configs[severity] || configs.informational;
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-medium px-3 py-1.5 gap-2',
  }[size];

  return (
    <div className="inline-flex flex-col items-start">
      <span
        className={`inline-flex items-center rounded-md border ${config.bg} ${sizeClasses}`}
        role="status"
        aria-label={`Severity: ${config.label}`}
      >
        <IconComponent className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{config.label}</span>
      </span>
      {showSubtext && (
        <span className="text-[10px] text-slate-500 mt-0.5 ml-0.5">
          AI review priority (not legal enforceability)
        </span>
      )}
    </div>
  );
};
