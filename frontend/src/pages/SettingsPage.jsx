import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, Sun, Moon, Database, ShieldCheck, 
  Save, RefreshCw, Cpu, HardDrive, CheckCircle2, Server
} from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

export const SettingsPage = () => {
  const { theme, toggleTheme, addToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiHealth, setApiHealth] = useState('checking');

  const [config, setConfig] = useState({
    default_horizon: '30 Days',
    default_lead_time_days: 7,
    default_service_level: 0.95,
    enable_auto_retrain: false,
    platform_name: 'RetailIQ AI SaaS Enterprise',
    api_version: '2.4.0',
  });

  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await api.getSettings();
      setConfig(res);
      setApiHealth('healthy');
    } catch (err) {
      setApiHealth('error');
      addToast('Could not load settings from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.updateSettings(config);
      setConfig(res.settings);
      addToast('System configuration saved successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-2">
            <SettingsIcon className="w-3.5 h-3.5" />
            System Configuration
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Platform & Modeling Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure default prediction horizons, safety stock lead times, service levels, and server endpoints.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save Configuration
        </button>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: General & Appearance */}
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Appearance & Brand
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Customize the user interface theme
          </p>

          <div className="pt-2">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-2">
              Color Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => theme === 'light' && toggleTheme()}
                className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  theme === 'dark'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                Dark Theme
              </button>

              <button
                type="button"
                onClick={() => theme === 'dark' && toggleTheme()}
                className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  theme === 'light'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                Light Theme
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
              Platform Display Title
            </label>
            <input
              type="text"
              value={config.platform_name || ''}
              onChange={(e) => setConfig({ ...config, platform_name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Center: Inventory & Forecasting Defaults */}
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Engine Defaults
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Default parameters applied to forecasting & safety stock calculations
          </p>

          <div className="space-y-4 pt-2 text-xs">
            <div>
              <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Default Forecast Horizon
              </label>
              <select
                value={config.default_horizon}
                onChange={(e) => setConfig({ ...config, default_horizon: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="7 Days">7 Days</option>
                <option value="30 Days">30 Days</option>
                <option value="90 Days">90 Days</option>
                <option value="6 Months">6 Months</option>
                <option value="1 Year">1 Year</option>
              </select>
            </div>

            <div>
              <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Default Supplier Lead Time (Days)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={config.default_lead_time_days}
                onChange={(e) => setConfig({ ...config, default_lead_time_days: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Default Service Level (Z-Score Target)
              </label>
              <select
                value={config.default_service_level}
                onChange={(e) => setConfig({ ...config, default_service_level: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value={0.90}>90% Availability (z=1.64)</option>
                <option value={0.95}>95% Availability (z=1.65)</option>
                <option value={0.98}>98% Availability (z=2.05)</option>
                <option value={0.99}>99% Availability (z=2.33)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right: Server & API Health */}
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Backend & Telemetry
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            FastAPI microservice infrastructure status
          </p>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">API Status:</span>
              <span className="flex items-center gap-1.5 font-bold text-emerald-500">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Operational
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">FastAPI Host:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">http://127.0.0.1:8000</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">API Version:</span>
              <span className="font-mono text-indigo-400">{config.api_version}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">ML Engine:</span>
              <span className="text-slate-800 dark:text-slate-200">LightGBM / Scikit-learn</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            Interactive OpenAPI swagger docs available at{' '}
            <a 
              href="http://127.0.0.1:8000/docs" 
              target="_blank" 
              rel="noreferrer" 
              className="text-indigo-500 underline font-semibold"
            >
              /docs
            </a>.
          </div>
        </div>
      </div>
    </div>
  );
};
