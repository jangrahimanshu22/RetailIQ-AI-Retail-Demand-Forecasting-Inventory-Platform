import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Calendar, Package, Store, Download, 
  RefreshCw, Play, AlertCircle, ArrowUpRight, ArrowDownRight,
  ShieldCheck, BarChart2, Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, ComposedChart, Line, Area, 
  XAxis, YAxis, Tooltip, Legend 
} from 'recharts';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { KPICard } from '../components/KPICard';
import { DashboardSkeleton } from '../components/LoadingSkeleton';

export const ForecastPage = () => {
  const { addToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [forecasting, setForecasting] = useState(false);
  const [options, setOptions] = useState({ products: [], stores: [], horizons: [] });

  // Forecast Selection Form
  const [productId, setProductId] = useState('');
  const [storeId, setStoreId] = useState('');
  const [horizon, setHorizon] = useState('30 Days');

  // Forecast Results
  const [result, setResult] = useState(null);

  const loadOptions = async () => {
    try {
      setLoading(true);
      const opt = await api.getForecastOptions();
      setOptions(opt);

      // Default selection
      const firstProd = opt.products[0]?.id || 'P001';
      const firstStore = opt.stores[0]?.id || 'S01';
      setProductId(firstProd);
      setStoreId(firstStore);

      // Generate initial forecast
      await handleGenerate(firstProd, firstStore, '30 Days');
    } catch (err) {
      addToast(err.message || 'Failed to initialize forecast options', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (pId = productId, sId = storeId, hor = horizon) => {
    if (!pId || !sId) return;
    try {
      setForecasting(true);
      const res = await api.generateForecast(pId, sId, hor);
      setResult(res);
    } catch (err) {
      addToast(err.message || 'Failed to generate demand forecast', 'error');
    } finally {
      setForecasting(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  if (loading && !result) {
    return <DashboardSkeleton />;
  }

  const summary = result?.summary || {};
  const chartData = result?.chart_data || [];
  const tableData = result?.forecast_table || [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Horizon / Parameter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            Recursive Demand Forecasting
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Future Demand Prediction Engine
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generates forward-looking SKU sales predictions using the auto-selected best regression model.
          </p>
        </div>

        {/* Forecast Configuration Form */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Product Select */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs">
            <Package className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[140px]"
            >
              {options.products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Store Select */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs">
            <Store className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[140px]"
            >
              {options.stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Horizon Select */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={horizon}
              onChange={(e) => setHorizon(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="7 Days">7 Days</option>
              <option value="30 Days">30 Days</option>
              <option value="90 Days">90 Days</option>
              <option value="6 Months">6 Months</option>
              <option value="1 Year">1 Year</option>
            </select>
          </div>

          {/* Generate Button */}
          <button
            disabled={forecasting}
            onClick={() => handleGenerate()}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${forecasting ? 'animate-spin' : ''}`} />
            Generate
          </button>

          {/* Download CSV */}
          <a
            href={api.getForecastDownloadUrl(productId, storeId, horizon)}
            download
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Download Forecast CSV"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Expected Total Demand</p>
          <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {(summary.total_demand || 0).toLocaleString()} <span className="text-xs text-slate-400 font-normal">units</span>
          </h3>
          <p className="text-[10px] text-slate-500 mt-1">Sum across {horizon}</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Avg Daily Demand</p>
          <h3 className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1">
            {summary.avg_daily_demand || 0} <span className="text-xs text-slate-400 font-normal">units/day</span>
          </h3>
          <p className="text-[10px] text-slate-500 mt-1">Mean forecast throughput</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Demand Growth %</p>
          <h3 className={`text-2xl font-black mt-1 flex items-center gap-1 ${
            (summary.growth_percentage || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'
          }`}>
            {(summary.growth_percentage || 0) >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
            {summary.growth_percentage || 0}%
          </h3>
          <p className="text-[10px] text-slate-500 mt-1">vs prior equivalent period</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Peak Demand Date</p>
          <h3 className="text-lg font-black text-amber-500 mt-1">
            {summary.peak_date || 'N/A'}
          </h3>
          <p className="text-[10px] text-slate-500 mt-1">Peak: {summary.peak_demand || 0} units</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Required Stock Buffer</p>
          <h3 className="text-2xl font-black text-emerald-500 mt-1">
            {(summary.stock_requirement || 0).toLocaleString()} <span className="text-xs text-slate-400 font-normal">units</span>
          </h3>
          <p className="text-[10px] text-slate-500 mt-1">Includes +15% safety buffer</p>
        </div>
      </div>

      {/* Main Interactive Forecast Chart */}
      <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Actual vs Predicted Demand Timeline with 95% Confidence Bounds
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Target: {productId} at Store {storeId} — Horizon: {horizon}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-slate-400"></span>
              <span className="text-slate-500 dark:text-slate-400">Historical Sales</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-indigo-500"></span>
              <span className="text-indigo-600 dark:text-indigo-400">Predicted Demand</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-indigo-500/20"></span>
              <span className="text-indigo-400/80">95% Confidence Band</span>
            </div>
          </div>
        </div>

        <div className="h-80 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }} 
              />
              <Area 
                type="monotone" 
                dataKey="upper_bound" 
                stroke="transparent" 
                fill="url(#ciGrad)" 
                name="Confidence Interval" 
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                name="Actual Sales" 
                stroke="#94a3b8" 
                strokeWidth={2} 
                dot={false} 
              />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                name="Predicted Sales" 
                stroke="#6366f1" 
                strokeWidth={2.5} 
                dot={{ r: 2, fill: '#6366f1' }} 
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Forecast Data Table */}
      <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Forecast Predictions Ledger
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Detailed step-by-step recursive daily predictions
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {tableData.length} Forecast Days
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 max-h-72">
          <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800 font-mono">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 uppercase text-[10px] font-semibold sticky top-0">
              <tr>
                <th className="px-4 py-3">Step</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Product ID</th>
                <th className="px-4 py-3">Store ID</th>
                <th className="px-4 py-3">Predicted Sales (Units)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {tableData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 text-slate-400">#{idx + 1}</td>
                  <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white">{row.Date}</td>
                  <td className="px-4 py-2.5 text-indigo-500 font-semibold">{row.Product_ID}</td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{row.Store_ID}</td>
                  <td className="px-4 py-2.5 text-emerald-500 font-bold">{row.Predicted_Sales_Quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
