import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const KPICard = ({ 
  title, 
  value, 
  change, 
  changeType = 'positive', 
  icon: Icon, 
  gradient = 'from-indigo-500 to-indigo-700',
  subtext 
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 card-hover-border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle hover:shadow-premium">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {title}
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </h3>
        </div>

        {Icon && (
          <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${gradient} text-white shadow-md shadow-indigo-500/20`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs">
        {change && (
          <span 
            className={`inline-flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded-md ${
              changeType === 'positive' 
                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60' 
                : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60'
            }`}
          >
            {changeType === 'positive' ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5" />
            )}
            {change}
          </span>
        )}
        <span className="text-slate-400 dark:text-slate-500 truncate">
          {subtext || 'vs prior period'}
        </span>
      </div>
    </div>
  );
};
