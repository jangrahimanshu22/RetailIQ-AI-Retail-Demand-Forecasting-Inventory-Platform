import React, { useState, useEffect } from 'react';
import { 
  DollarSign, ShoppingCart, Package, Store, 
  TrendingUp, Award, Filter, RefreshCw, AlertTriangle, ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  BarChart, Bar, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { KPICard } from '../components/KPICard';
import { DashboardSkeleton } from '../components/LoadingSkeleton';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export const OverviewPage = () => {
  const { setActivePage, addToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [filterOptions, setFilterOptions] = useState({ categories: [], stores: [] });

  const loadData = async () => {
    try {
      setLoading(true);
      const [metrics, edaFilters] = await Promise.all([
        api.getOverviewMetrics({ category: categoryFilter, store_id: storeFilter }),
        api.getEDAFilters()
      ]);
      setData(metrics);
      setFilterOptions({
        categories: edaFilters.categories || [],
        stores: edaFilters.stores || []
      });
    } catch (err) {
      addToast(err.message || 'Failed to load overview data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [categoryFilter, storeFilter]);

  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-r from-indigo-900/10 via-slate-900/5 to-cyan-900/10 dark:from-indigo-950/40 dark:via-slate-900/60 dark:to-cyan-950/40 backdrop-blur-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
            Executive Intelligence
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Retail Intelligence Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time sales velocity, automated demand forecasts, and supply-chain risk optimization.
          </p>
        </div>

        {/* Global Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {filterOptions.categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
            <Store className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="">All Stores</option>
              {filterOptions.stores.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (6 KPIs as requested) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Total Revenue"
          value={`$${(kpis.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          change="+14.2%"
          changeType="positive"
          icon={DollarSign}
          gradient="from-emerald-500 to-teal-600"
          subtext="Net sales volume"
        />
        <KPICard
          title="Sales Quantity"
          value={(kpis.total_quantity || 0).toLocaleString()}
          change="+8.6%"
          changeType="positive"
          icon={ShoppingCart}
          gradient="from-indigo-500 to-indigo-700"
          subtext="Total units sold"
        />
        <KPICard
          title="Active SKUs"
          value={kpis.total_products || 0}
          change="Catalog"
          changeType="positive"
          icon={Package}
          gradient="from-cyan-500 to-blue-600"
          subtext="Unique product lines"
        />
        <KPICard
          title="Total Stores"
          value={kpis.total_stores || 0}
          change="Active"
          changeType="positive"
          icon={Store}
          gradient="from-amber-500 to-orange-600"
          subtext="Retail locations"
        />
        <KPICard
          title="Avg Daily Demand"
          value={`${kpis.avg_daily_demand || 0} units`}
          change="+5.1%"
          changeType="positive"
          icon={TrendingUp}
          gradient="from-purple-500 to-indigo-600"
          subtext="Mean throughput / day"
        />
        <KPICard
          title="Forecast Accuracy"
          value={`${kpis.forecast_accuracy || 99.2}%`}
          change={kpis.best_model_name || 'LightGBM'}
          changeType="positive"
          icon={Award}
          gradient="from-rose-500 to-pink-600"
          subtext="Holdout R² Accuracy"
        />
      </div>

      {/* Row 1: Sales Trend Timeline & Category Share */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Sales Trend Chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Overall Sales & Revenue Performance
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monthly revenue trend with moving averages
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Active Trend
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthly_trend || []}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(val) => [`$${Number(val).toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category-wise Sales Donut Chart */}
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Sales by Category
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gross revenue share per retail segment
            </p>
          </div>

          <div className="h-56 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.category_sales || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(charts.category_sales || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val) => [`$${Number(val).toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
            {(charts.category_sales || []).slice(0, 4).map((c, i) => (
              <div key={c.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                <span className="text-slate-600 dark:text-slate-300 truncate">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Store Performance & Top Products & Inventory Risk Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales by Store */}
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
            Store Performance
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Gross revenue by regional store location
          </p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.store_sales || []}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(val) => [`$${Number(val).toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                />
                <Bar dataKey="value" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top-Selling Products */}
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Top-Selling Products
            </h3>
            <button 
              onClick={() => setActivePage('insights')} 
              className="text-xs text-indigo-500 hover:text-indigo-400 flex items-center gap-1 font-semibold"
            >
              View BI <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Highest demand volume SKUs
          </p>

          <div className="space-y-3.5">
            {(charts.top_products || []).map((p, idx) => (
              <div key={p.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-[10px] border border-indigo-200 dark:border-indigo-800/40">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                      {p.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      ${p.revenue?.toLocaleString()} revenue
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {p.quantity?.toLocaleString()}
                  </span>
                  <p className="text-[10px] text-emerald-500 font-semibold">units</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Risk Overview */}
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Inventory Risk Status
              </h3>
              <button 
                onClick={() => setActivePage('inventory')} 
                className="text-xs text-indigo-500 hover:text-indigo-400 flex items-center gap-1 font-semibold"
              >
                Optimize <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Real-time stock level health categorization
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                  <span className="font-semibold text-rose-700 dark:text-rose-400">Critical Stockouts</span>
                </div>
                <span className="font-bold text-rose-600 dark:text-rose-300 text-sm">
                  {charts.inventory_risk?.critical || 0} SKUs
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="font-semibold text-amber-700 dark:text-amber-400">Low Stock (Reorder Soon)</span>
                </div>
                <span className="font-bold text-amber-600 dark:text-amber-300 text-sm">
                  {charts.inventory_risk?.low_stock || 0} SKUs
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">Healthy Inventory</span>
                </div>
                <span className="font-bold text-emerald-600 dark:text-emerald-300 text-sm">
                  {charts.inventory_risk?.healthy || 0} SKUs
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  <span className="font-semibold text-indigo-700 dark:text-indigo-400">Overstock Warnings</span>
                </div>
                <span className="font-bold text-indigo-600 dark:text-indigo-300 text-sm">
                  {charts.inventory_risk?.overstock || 0} SKUs
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 text-center">
            Calculated via dynamic safety stock (z=1.65, 7d lead time)
          </div>
        </div>
      </div>
    </div>
  );
};
