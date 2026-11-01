import React, { useState } from 'react';
import { 
  LayoutDashboard, Database, Sparkles, BarChart3, 
  BrainCircuit, TrendingUp, PackageCheck, Lightbulb, 
  FileText, Settings, ChevronLeft, ChevronRight, Zap
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Sidebar = () => {
  const { activePage, setActivePage, datasetStatus } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  const navigationItems = [
    { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'dataset', label: 'Dataset Management', icon: Database },
    { id: 'cleaning', label: 'Data Cleaning', icon: Sparkles },
    { id: 'eda', label: 'Exploratory Data Analysis', icon: BarChart3 },
    { id: 'models', label: 'Model Training & Comp', icon: BrainCircuit },
    { id: 'forecast', label: 'Demand Forecasting', icon: TrendingUp },
    { id: 'inventory', label: 'Inventory Optimization', icon: PackageCheck },
    { id: 'insights', label: 'Business Intelligence', icon: Lightbulb },
    { id: 'reports', label: 'Reports & Export', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside 
      className={`relative h-[calc(100vh-4rem)] flex flex-col justify-between border-r transition-all duration-300 border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0b1120] select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Navigation List */}
      <div className="p-3 space-y-1.5 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group relative ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/50'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
              
              {!collapsed && (
                <span className="truncate tracking-wide">{item.label}</span>
              )}

              {isActive && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
        {!collapsed && (
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/10 via-cyan-500/5 to-transparent border border-indigo-500/20 dark:border-indigo-500/20">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>Engine Status</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Active Model: <span className="font-semibold text-slate-800 dark:text-slate-200">{datasetStatus.best_model || 'LightGBM'}</span>
            </p>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full w-[99.2%]"></div>
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full py-2 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
