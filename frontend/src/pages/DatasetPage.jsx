import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Database, FileSpreadsheet, Download, RefreshCw, 
  Search, CheckCircle2, AlertTriangle, Layers, ChevronLeft, ChevronRight,
  HardDrive, HelpCircle, FileText
} from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

export const DatasetPage = () => {
  const { addToast, refreshDatasetStatus } = useApp();
  const [activeTab, setActiveTab] = useState('raw'); // 'raw', 'clean', 'features'
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Preview & Pagination
  const [previewData, setPreviewData] = useState({ columns: [], data: [], total_rows: 0, total_pages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState(null);

  const fileInputRef = useRef(null);

  const fetchDatasetData = async () => {
    try {
      setLoading(true);
      const [prev, statData] = await Promise.all([
        api.getDatasetPreview(page, 20, search, activeTab),
        api.getDatasetStats(activeTab)
      ]);
      setPreviewData(prev);
      setStats(statData);
    } catch (err) {
      addToast(err.message || 'Failed to load dataset details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasetData();
  }, [page, activeTab]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDatasetData();
  };

  const handleFileUpload = async (file) => {
    if (!file || !file.name.endsWith('.csv')) {
      addToast('Please upload a valid CSV file.', 'warning');
      return;
    }
    try {
      setUploading(true);
      const res = await api.uploadDataset(file);
      addToast(`Dataset uploaded: ${res.rows.toLocaleString()} rows imported.`, 'success');
      await refreshDatasetStatus();
      setPage(1);
      fetchDatasetData();
    } catch (err) {
      addToast(err.message || 'Failed to upload dataset', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleLoadSample = async (sampleName) => {
    try {
      setLoading(true);
      const res = await api.loadSampleDataset(sampleName);
      addToast(`Loaded ${sampleName}: ${res.rows.toLocaleString()} rows.`, 'success');
      await refreshDatasetStatus();
      setPage(1);
      fetchDatasetData();
    } catch (err) {
      addToast(err.message || 'Failed to load sample dataset', 'error');
    } finally {
      setLoading(false);
    }
  };

  const summary = stats?.summary || {};

  return (
    <div className="space-y-6">
      {/* Header & Sample Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-2">
            <Database className="w-3.5 h-3.5" />
            Dataset Management
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Retail Data Source & Ingestion
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Upload custom retail CSV datasets, inspect data schemas, and preview raw or cleaned partitions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleLoadSample('sample_2023_2024')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Load 2023-2024 Sample
          </button>

          <button
            onClick={() => handleLoadSample('july_2026')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-cyan-500/30 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-300 hover:bg-cyan-100 transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Load July 2026 Sample
          </button>

          <a
            href={api.getDatasetDownloadUrl(activeTab)}
            download
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </a>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
          }
        }}
        className={`p-8 rounded-3xl border-2 border-dashed transition-all duration-200 text-center ${
          dragActive
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
            : 'border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-indigo-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />

        <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
          <Upload className={`w-6 h-6 ${uploading ? 'animate-bounce' : ''}`} />
        </div>

        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {uploading ? 'Uploading and validating dataset...' : 'Drag and drop your retail sales CSV file'}
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
          Requires columns: Date, Product_ID, Store_ID, Sales_Quantity, Unit_Price, Revenue, Inventory_Level.
        </p>

        <button
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
        >
          Browse Files from Computer
        </button>
      </div>

      {/* Dataset Statistics Quick Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-subtle">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Total Rows</p>
          <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {(summary.total_rows || 0).toLocaleString()}
          </h4>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-subtle">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Total Columns</p>
          <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {summary.total_columns || 0}
          </h4>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-subtle">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Duplicate Rows</p>
          <h4 className="text-xl font-bold text-amber-500 mt-1">
            {summary.duplicate_rows || 0}
          </h4>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-subtle">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Missing Values</p>
          <h4 className="text-xl font-bold text-rose-500 mt-1">
            {summary.missing_cells || 0}
          </h4>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-subtle">
          <p className="text-[11px] font-medium text-slate-400 uppercase">Memory Footprint</p>
          <h4 className="text-xl font-bold text-indigo-500 mt-1">
            {summary.memory_mb || 0} MB
          </h4>
        </div>
      </div>

      {/* Dataset Partition Tabs & Search */}
      <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          {/* Partition Selector */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs">
            <button
              onClick={() => { setActiveTab('raw'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'raw'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Raw Dataset
            </button>
            <button
              onClick={() => { setActiveTab('clean'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'clean'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Cleaned Partition
            </button>
            <button
              onClick={() => { setActiveTab('features'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'features'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Engineered Features
            </button>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search records..."
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

        {/* Data Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
          <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="px-4 py-3">#</th>
                {previewData.columns.slice(0, 10).map((col) => (
                  <th key={col} className="px-4 py-3 whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-[#0f172a]">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2" />
                    Loading records...
                  </td>
                </tr>
              ) : previewData.data.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    No matching records found.
                  </td>
                </tr>
              ) : (
                previewData.data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-2.5 text-slate-400 font-mono text-[10px]">
                      {(page - 1) * 20 + idx + 1}
                    </td>
                    {previewData.columns.slice(0, 10).map((col) => (
                      <td key={col} className="px-4 py-2.5 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                        {row[col] !== undefined && row[col] !== null ? String(row[col]) : '-'}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
          <span>
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, previewData.total_rows)} of {previewData.total_rows.toLocaleString()} entries
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Page {page} of {previewData.total_pages || 1}
            </span>
            <button
              disabled={page >= previewData.total_pages}
              onClick={() => setPage((p) => Math.min(previewData.total_pages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
