import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, FileSpreadsheet, FileCode, CheckCircle2, 
  ExternalLink, Sparkles, Printer, ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

export const ReportsPage = () => {
  const { addToast } = useApp();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const list = await api.getReportsList();
        setReports(list);
      } catch (err) {
        addToast(err.message || 'Failed to fetch report templates', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleDownload = (reportId, format) => {
    const url = api.getReportExportUrl(reportId, format);
    window.open(url, '_blank');
    addToast(`Generating ${format.toUpperCase()} export for ${reportId}...`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-2">
            <FileText className="w-3.5 h-3.5" />
            Executive Reports & Export Center
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Enterprise Intelligence Dossiers & Data Exports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generate publication-ready PDF summaries, multi-tab Excel workbooks, and raw CSV feeds.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Real-time Data Sync Active</span>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => (
          <div
            key={report.id}
            className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all card-hover-border"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-200 dark:border-indigo-800/50">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1.5">
                  {report.formats.map((fmt) => (
                    <span 
                      key={fmt} 
                      className="px-2 py-0.5 rounded-md text-[10px] uppercase font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    >
                      {fmt}
                    </span>
                  ))}
                </div>
              </div>

              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                {report.title}
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {report.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2">
              {report.formats.includes('pdf') && (
                <button
                  onClick={() => handleDownload(report.id, 'pdf')}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  PDF Export
                </button>
              )}

              {report.formats.includes('xlsx') && (
                <button
                  onClick={() => handleDownload(report.id, 'xlsx')}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Excel (.xlsx)
                </button>
              )}

              {report.formats.includes('csv') && (
                <button
                  onClick={() => handleDownload(report.id, 'csv')}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  CSV Data
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
