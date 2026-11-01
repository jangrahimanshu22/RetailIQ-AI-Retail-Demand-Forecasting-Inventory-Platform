import React, { useState, useEffect } from 'react';
import { 
  Sparkles, CheckCircle2, AlertTriangle, Play, RefreshCw, 
  Trash2, ShieldAlert, ArrowRight, Table, Sliders
} from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { KPICard } from '../components/KPICard';

export const CleaningPage = () => {
  const { addToast, refreshDatasetStatus } = useApp();
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [cleanResult, setCleanResult] = useState(null);

  // Cleaning Configurations
  const [config, setConfig] = useState({
    handle_missing: true,
    remove_duplicates: true,
    cap_outliers: true,
    outlier_method: 'iqr'
  });

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const res = await api.getCleaningAnalysis();
      setAnalysis(res);
    } catch (err) {
      addToast(err.message || 'Failed to analyze raw dataset', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const handleRunCleaning = async () => {
    try {
      setCleaning(true);
      const res = await api.runCleaning(config);
      setCleanResult(res);
      addToast(res.message || 'Cleaning pipeline completed successfully!', 'success');
      await refreshDatasetStatus();
    } catch (err) {
      addToast(err.message || 'Cleaning pipeline failed', 'error');
    } finally {
      setCleaning(false);
    }
  };

  const missingList = analysis?.missing_summary || [];
  const outliersList = analysis?.outlier_analysis || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Data Preprocessing Pipeline
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Automated Data Cleansing & Validation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Detect anomalies, impute missing entries, eliminate duplicates, and cap statistical outliers.
          </p>
        </div>

        <button
          disabled={cleaning || loading}
          onClick={handleRunCleaning}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {cleaning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Running Cleansing Pipeline...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              Run Cleaning Pipeline
            </>
          )}
        </button>
      </div>

      {/* Cleaning Config Controls & Anomaly Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Card */}
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Cleaning Operations
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Handle Missing Values</p>
                  <p className="text-[11px] text-slate-400">Median for numeric, mode for categorical</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.handle_missing}
                  onChange={(e) => setConfig({ ...config, handle_missing: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Deduplicate Records</p>
                  <p className="text-[11px] text-slate-400">Drop identical transactions</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.remove_duplicates}
                  onChange={(e) => setConfig({ ...config, remove_duplicates: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Cap Outliers via IQR</p>
                  <p className="text-[11px] text-slate-400">Winsorize extreme values at Q1/Q3 ± 1.5×IQR</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.cap_outliers}
                  onChange={(e) => setConfig({ ...config, cap_outliers: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
            Pipeline transforms raw dataset into standard <code className="font-mono text-indigo-400">retail_sales_clean.csv</code>.
          </div>
        </div>

        {/* Before-and-After Comparison Summary */}
        <div className="lg:col-span-2 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Cleansing Benchmark & Telemetry
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              {cleanResult ? 'Pipeline Executed' : 'Ready for Execution'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
              <p className="text-[11px] text-slate-400 font-medium uppercase">Raw Rows</p>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {cleanResult?.log?.initial_rows ?? analysis?.total_rows ?? 0}
              </h4>
              <p className="text-[10px] text-slate-400 mt-1">Pre-cleansing</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
              <p className="text-[11px] text-slate-400 font-medium uppercase">Clean Rows</p>
              <h4 className="text-lg font-bold text-emerald-500 mt-1">
                {cleanResult?.log?.final_rows ?? analysis?.total_rows ?? 0}
              </h4>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">Post-cleansing</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
              <p className="text-[11px] text-slate-400 font-medium uppercase">Duplicates Purged</p>
              <h4 className="text-lg font-bold text-amber-500 mt-1">
                {cleanResult?.log?.duplicates_removed ?? analysis?.duplicate_count ?? 0}
              </h4>
              <p className="text-[10px] text-slate-400 mt-1">Exact duplicates</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
              <p className="text-[11px] text-slate-400 font-medium uppercase">Missing Resolved</p>
              <h4 className="text-lg font-bold text-cyan-500 mt-1">
                {cleanResult?.log?.initial_missing ?? (analysis?.missing_summary?.length || 0)}
              </h4>
              <p className="text-[10px] text-slate-400 mt-1">Cells imputed</p>
            </div>
          </div>

          {/* Outliers summary by column */}
          <div className="mt-6">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Outliers Capped by Feature (IQR Range)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {outliersList.map((col) => (
                <div key={col.column} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{col.column}</span>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>Detected:</span>
                    <span className="font-bold text-rose-500">{col.iqr_outliers} ({col.iqr_pct}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Outlier & Missing Analysis Detail Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outlier Statistics Table */}
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
            Outlier Distribution & Quantiles
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            IQR bounds (Q1, Median, Q3, Min, Max) for continuous features
          </p>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[10px] uppercase font-semibold">
                <tr>
                  <th className="px-3 py-2.5">Feature</th>
                  <th className="px-3 py-2.5">Min</th>
                  <th className="px-3 py-2.5">Q1</th>
                  <th className="px-3 py-2.5">Median</th>
                  <th className="px-3 py-2.5">Q3</th>
                  <th className="px-3 py-2.5">Max</th>
                  <th className="px-3 py-2.5">IQR Outliers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {outliersList.map((item) => (
                  <tr key={item.column} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-3 py-2 font-sans font-semibold text-slate-800 dark:text-slate-200">{item.column}</td>
                    <td className="px-3 py-2 text-slate-500">{item.min}</td>
                    <td className="px-3 py-2 text-slate-500">{item.q25}</td>
                    <td className="px-3 py-2 text-slate-900 dark:text-white font-bold">{item.median}</td>
                    <td className="px-3 py-2 text-slate-500">{item.q75}</td>
                    <td className="px-3 py-2 text-slate-500">{item.max}</td>
                    <td className="px-3 py-2 text-rose-500 font-bold">{item.iqr_outliers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Missing Values Table */}
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
            Missing Value Resolution
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Audit of null entries and automated imputation strategies
          </p>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[10px] uppercase font-semibold">
                <tr>
                  <th className="px-3 py-2.5">Column</th>
                  <th className="px-3 py-2.5">Missing Count</th>
                  <th className="px-3 py-2.5">Missing %</th>
                  <th className="px-3 py-2.5">Type</th>
                  <th className="px-3 py-2.5">Imputation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {missingList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-emerald-500 font-medium">
                      ✓ Zero missing values detected in the dataset.
                    </td>
                  </tr>
                ) : (
                  missingList.map((m) => (
                    <tr key={m.column}>
                      <td className="px-3 py-2 font-semibold text-slate-800 dark:text-slate-200">{m.column}</td>
                      <td className="px-3 py-2 text-rose-500 font-bold">{m.missing_count}</td>
                      <td className="px-3 py-2 text-slate-500">{m.missing_pct}%</td>
                      <td className="px-3 py-2 font-mono text-slate-400">{m.dtype}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold text-[10px]">
                          {m.suggested_imputation}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cleaned Dataset Preview */}
      {cleanResult?.preview && (
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Cleaned Dataset Preview (First 30 Rows)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verified preprocessed data ready for model training and feature extraction
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Clean Pipeline Ready
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  {cleanResult.columns.slice(0, 10).map((col) => (
                    <th key={col} className="px-4 py-3 whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                {cleanResult.preview.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    {cleanResult.columns.slice(0, 10).map((col) => (
                      <td key={col} className="px-4 py-2 whitespace-nowrap text-slate-700 dark:text-slate-300">
                        {row[col] !== undefined ? String(row[col]) : ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
