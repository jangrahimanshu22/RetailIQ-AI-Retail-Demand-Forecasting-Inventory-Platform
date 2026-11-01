import React from 'react';

export const LoadingSkeleton = ({ className = "h-40 w-full" }) => {
  return (
    <div className={`animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800/60 ${className}`}></div>
  );
};

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-2xl animate-pulse bg-slate-200 dark:bg-slate-800/60"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 rounded-2xl animate-pulse bg-slate-200 dark:bg-slate-800/60"></div>
        <div className="h-80 rounded-2xl animate-pulse bg-slate-200 dark:bg-slate-800/60"></div>
      </div>
    </div>
  );
};
