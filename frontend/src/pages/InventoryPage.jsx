import React, { useState, useEffect } from 'react';
import { 
  PackageCheck, AlertTriangle, ShieldCheck, Download, RefreshCw, 
  Search, Sliders, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownRight,
  TrendingDown, Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, Legend 
} from 'recharts';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { KPICard } from '../components/KPICard';
import { DashboardSkeleton } from '../components/LoadingSkeleton';

export const InventoryPage = () => {
  const { addToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ summary: {}, items: [] });

  // Filters & Parameters
  const [leadTime, setLeadTime] = useState(7);
  const [serviceLevel, setServiceLevel] = useState(0.95);
  const [filterAlert, setFilterAlert] = useState('ALL');
  const [search, setSearch] = useState('');

  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await api.getInventoryRecommendations(leadTime, serviceLevel, filterAlert, search);
      setData(res);
    } catch (err) {
      addToast(err.message || 'Failed to calculate inventory recommendations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [leadTime, serviceLevel, filterAlert]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadInventory();
  };

  const summary = data?.summary || {};
  const items = data?.items || [];

  // Chart data: Top items comparing Current Inventory vs Reorder Point
  const topCriticalItems = items
    .filter((i) => i.Status === 'Critical' || i.Status === 'Low Stock')
    .slice(0, 10)
    .map((i) => ({
      name: `${i.Product_ID} (${i.Store_ID})`,
      current: i.Current_Inventory,
      reorder_point: i.Reorder_Point,
      restock_qty: i.Recommended_Restock_Qty
    }));

  return (
    <div className="space-y-6">
      {/* Top Banner & Strategy Form */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-2">
            <PackageCheck className="w-3.5 h-3.5" />
            Inventory Optimization Engine
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Smart Stock Allocation & Restock Advisory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Dynamic safety stocks, reorder thresholds, and automated stockout risk mitigation.
          </p>
        </div>

        {/* Lead time & Service level controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs">
            <span className="text-slate-400">Lead Time:</span>
            <select
              value={leadTime}
              onChange={(e) => setLeadTime(Number(e.target.value))}
              className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value={3}>3 Days</option>
              <option value={7}>7 Days (Std)</option>
              <option value={14}>14 Days</option>
              <option value={21}>21 Days</option>
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs">
            <span className="text-slate-400">Service Level:</span>
            <select
              value={serviceLevel}
              onChange={(e) => setServiceLevel(Number(e.target.value))}
              className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value={0.90}>90% (z=1.64)</option>
              <option value={0.95}>95% (z=1.65)</option>
              <option value={0.98}>98% (z=2.05)</option>
              <option value={0.99}>99% (z=2.33)</option>
            </select>
          </div>

          <a
            href={api.getInventoryDownloadUrl(leadTime, serviceLevel)}
            download
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export Plan
          </a>
        </div>
      </div>

      {/* KPI Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-950/30 shadow-subtle">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Critical Stockouts</p>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
          </div>
          <h3 className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-2">
            {summary.critical_count || 0} <span className="text-xs font-normal">SKU Locations</span>
          </h3>
          <p className="text-[10px] text-rose-600/80 dark:text-rose-400/70 mt-1">Stock &lt; 50% reorder point</p>
        </div>

        <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/30 shadow-subtle">
          <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Low Stock (Reorder)</p>
          <h3 className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-2">
            {summary.low_stock_count || 0} <span className="text-xs font-normal">SKU Locations</span>
          </h3>
          <p className="text-[10px] text-amber-600/80 dark:text-amber-400/70 mt-1">Reorder threshold breached</p>
        </div>

        <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/30 shadow-subtle">
          <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Healthy Inventory</p>
          <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-2">
            {summary.healthy_count || 0} <span className="text-xs font-normal">SKU Locations</span>
          </h3>
          <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/70 mt-1">Balanced stock coverage</p>
        </div>

        <div className="p-5 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 dark:bg-indigo-950/30 shadow-subtle">
          <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Overstock Warnings</p>
          <h3 className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-2">
            {summary.overstock_count || 0} <span className="text-xs font-normal">SKU Locations</span>
          </h3>
          <p className="text-[10px] text-indigo-600/80 dark:text-indigo-400/70 mt-1">Inventory &gt; 2.5× demand</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-subtle">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Units to Restock</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {(summary.total_recommended_restock || 0).toLocaleString()} <span className="text-xs text-slate-400 font-normal">units</span>
          </h3>
          <p className="text-[10px] text-slate-500 mt-1">Across all retail stores</p>
        </div>
      </div>

      {/* Stockout Risk Visual: Current Inventory vs Reorder Point */}
      {topCriticalItems.length > 0 && (
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Critical Inventory Deficit (Current Stock vs Reorder Point)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visualizing top SKUs in immediate danger of stockout
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
              Immediate Action Required
            </span>
          </div>

          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCriticalItems}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }} />
                <Legend />
                <Bar dataKey="current" name="Current Stock" fill="#ef4444" radius={[6, 6, 0, 0]} />
                <Bar dataKey="reorder_point" name="Reorder Point" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="restock_qty" name="Restock Needed" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filter and Recommendations Table */}
      <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs">
            {['ALL', 'STOCKOUT RISK', 'REORDER SOON', 'OK', 'OVERSTOCK WARNING'].map((alert) => (
              <button
                key={alert}
                onClick={() => setFilterAlert(alert)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  filterAlert === alert
                    ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {alert === 'ALL' ? 'All Products' : alert}
              </button>
            ))}
          </div>

          {/* Search box */}
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search SKU or store..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500"
            >
              Filter
            </button>
          </form>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 max-h-96">
          <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 uppercase text-[10px] font-semibold sticky top-0">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Store</th>
                <th className="px-4 py-3">Current Stock</th>
                <th className="px-4 py-3">Avg Daily Demand</th>
                <th className="px-4 py-3">Safety Stock</th>
                <th className="px-4 py-3">Reorder Point</th>
                <th className="px-4 py-3">Recommended Restock</th>
                <th className="px-4 py-3">Health Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                    No matching inventory items found.
                  </td>
                </tr>
              ) : (
                items.map((r, idx) => {
                  let badge = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
                  if (r.Status === 'Critical') badge = 'bg-rose-500/20 text-rose-500 font-bold border border-rose-500/30';
                  else if (r.Status === 'Low Stock') badge = 'bg-amber-500/20 text-amber-500 font-bold border border-amber-500/30';
                  else if (r.Status === 'Healthy') badge = 'bg-emerald-500/20 text-emerald-500 font-bold border border-emerald-500/30';
                  else if (r.Status === 'Overstock') badge = 'bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30';

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 font-sans">
                      <td className="px-4 py-2.5">
                        <span className="font-bold text-slate-900 dark:text-white">{r.Product_Name}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">{r.Product_ID} • {r.Category}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{r.Store_ID}</span>
                        <span className="block text-[10px] text-slate-400">{r.Store_Location}</span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-900 dark:text-white font-bold">{r.Current_Inventory}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-500">{r.Avg_Daily_Demand}</td>
                      <td className="px-4 py-2.5 font-mono text-indigo-400">{r.Safety_Stock}</td>
                      <td className="px-4 py-2.5 font-mono text-amber-500 font-bold">{r.Reorder_Point}</td>
                      <td className="px-4 py-2.5 font-mono text-emerald-500 font-bold text-sm">
                        {r.Recommended_Restock_Qty > 0 ? `+${r.Recommended_Restock_Qty}` : '0'}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider ${badge}`}>
                          {r.Status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
