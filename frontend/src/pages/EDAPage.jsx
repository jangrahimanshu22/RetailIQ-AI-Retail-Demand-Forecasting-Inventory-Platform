import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Filter, RefreshCw, Calendar, Tag, Store, 
  Package, Sun, Sparkles, TrendingUp, HelpCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, AreaChart, Area, 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend 
} from 'recharts';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { DashboardSkeleton } from '../components/LoadingSkeleton';

const PALETTE = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];

export const EDAPage = () => {
  const { addToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);

  // Filters
  const [filterOptions, setFilterOptions] = useState({ products: [], stores: [], categories: [], date_min: '', date_max: '' });
  const [filters, setFilters] = useState({
    product_id: '',
    store_id: '',
    category: '',
    start_date: '',
    end_date: '',
  });

  const loadFilterOptions = async () => {
    try {
      const opts = await api.getEDAFilters();
      setFilterOptions(opts);
    } catch (err) {
      console.warn('Filter options error:', err);
    }
  };

  const loadCharts = async () => {
    try {
      setLoading(true);
      const data = await api.getEDACharts(filters);
      setChartData(data);
    } catch (err) {
      addToast(err.message || 'Failed to load EDA charts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    loadCharts();
  }, [filters]);

  if (loading && !chartData) {
    return <DashboardSkeleton />;
  }

  const summary = chartData?.summary || {};

  return (
    <div className="space-y-6">
      {/* Top Banner & Filter Controls */}
      <div className="flex flex-col gap-4 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-2">
              <BarChart3 className="w-3.5 h-3.5" />
              Exploratory Data Analysis
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Retail Analytics & Distribution Engine
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Multi-dimensional analysis across temporal patterns, promotional elasticity, holidays, and correlations.
            </p>
          </div>

          <button
            onClick={() => {
              setFilters({ product_id: '', store_id: '', category: '', start_date: '', end_date: '' });
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 self-start md:self-center"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset All Filters
          </button>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {filterOptions.categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={filters.store_id}
              onChange={(e) => setFilters({ ...filters, store_id: e.target.value })}
              className="w-full bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="">All Stores</option>
              {filterOptions.stores.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={filters.product_id}
              onChange={(e) => setFilters({ ...filters, product_id: e.target.value })}
              className="w-full bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="">All Products</option>
              {filterOptions.products.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="w-full bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none text-xs"
              title="Start Date"
            />
          </div>
        </div>
      </div>

      {/* 1. Daily Sales Trend */}
      <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              1. Daily Sales Throughput Trend
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daily aggregate sales quantity over time
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            Continuous Series
          </span>
        </div>

        <div className="h-72 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData?.daily_trend || []}>
              <defs>
                <linearGradient id="dailySalesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }} />
              <Area type="monotone" dataKey="sales_quantity" name="Sales Quantity" stroke="#6366f1" strokeWidth={2} fill="url(#dailySalesGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2 & 3: Monthly Revenue & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Trend */}
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
            2. Monthly Revenue Trend
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Aggregated gross revenue by calendar month
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData?.monthly_trend || []}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(val) => [`$${Number(val).toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category-wise Sales Distribution */}
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
            3. Category-Wise Sales Distribution
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Total units sold and revenue per retail product category
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData?.category_distribution || []} layout="vertical">
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis dataKey="category" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} width={100} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }} />
                <Bar dataKey="sales_quantity" name="Units Sold" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4 & 5: Store-wise & Product-wise Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store-wise Performance */}
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
            4. Store-Wise Sales Performance
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Gross revenue generated per retail location
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData?.store_performance || []}>
                <XAxis dataKey="store" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(val) => [`$${Number(val).toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                />
                <Bar dataKey="revenue" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product-wise Sales Quantity */}
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
            5. Top Products by Sales Quantity
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Leading SKUs ranked by total units demanded
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData?.product_performance || []} layout="vertical">
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis dataKey="product" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} width={120} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }} />
                <Bar dataKey="sales_quantity" name="Quantity Sold" fill="#f59e0b" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 6. Correlation Heatmap */}
      <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
          6. Feature Correlation Heatmap Matrix
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Pearson correlation coefficients (-1.0 to +1.0) among continuous features
        </p>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-center text-xs divide-y divide-slate-200 dark:divide-slate-800 font-mono">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 uppercase text-[10px] font-semibold">
              <tr>
                <th className="px-3 py-2.5 text-left font-sans">Feature</th>
                {(chartData?.numeric_cols || []).map((col) => (
                  <th key={col} className="px-3 py-2.5 whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {(chartData?.correlation_matrix || []).map((row) => (
                <tr key={row.variable}>
                  <td className="px-3 py-2.5 text-left font-sans font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {row.variable}
                  </td>
                  {(chartData?.numeric_cols || []).map((col) => {
                    const val = row[col] !== undefined ? row[col] : 0;
                    // Color based on correlation intensity
                    let cellBg = 'bg-transparent text-slate-500';
                    if (val >= 0.7) cellBg = 'bg-indigo-600/30 text-indigo-300 font-bold';
                    else if (val >= 0.3) cellBg = 'bg-indigo-500/15 text-indigo-400';
                    else if (val <= -0.7) cellBg = 'bg-rose-600/30 text-rose-300 font-bold';
                    else if (val <= -0.3) cellBg = 'bg-rose-500/15 text-rose-400';
                    
                    return (
                      <td key={col} className={`px-3 py-2.5 ${cellBg}`}>
                        {val.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7 & 8: Sales Quantity Distribution & Category Boxplots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Quantity Distribution Histogram */}
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
            7. Sales Quantity Frequency Distribution
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Histogram bin frequencies for transactional demand volumes
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData?.sales_distribution || []}>
                <XAxis dataKey="bin" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }} />
                <Bar dataKey="count" name="Transactions" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Boxplots by Category */}
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
            8. Category Demand Quantiles (Min, Q1, Median, Q3, Max)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Statistical spread and average sales throughput across categories
          </p>

          <div className="space-y-3 pt-2">
            {(chartData?.category_boxplots || []).map((b) => (
              <div key={b.category} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 text-xs">
                <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                  <span>{b.category}</span>
                  <span className="text-indigo-500">Median: {b.median} units (Avg: {b.avg})</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Min: {b.min}</span>
                  <span>Q1: {b.q1}</span>
                  <span>Q3: {b.q3}</span>
                  <span>Max: {b.max}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 9, 10, 11: Seasonal, Promotion, Holiday Impact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Seasonal Demand Analysis */}
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
            9. Seasonal Demand
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Average demand by season
          </p>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData?.seasonal_analysis || []}>
                <XAxis dataKey="season" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }} />
                <Bar dataKey="avg_quantity" name="Avg Demand" fill="#ec4899" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Holiday Impact Analysis */}
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
            10. Holiday Impact
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Holiday vs Non-Holiday sales
          </p>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData?.holiday_analysis || []}>
                <XAxis dataKey="status" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }} />
                <Bar dataKey="avg_quantity" name="Avg Demand" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Promotion Impact Analysis */}
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
            11. Promotion Lift
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Discount elasticity impact
          </p>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData?.promotion_analysis || []}>
                <XAxis dataKey="status" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }} />
                <Bar dataKey="avg_quantity" name="Avg Demand" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
