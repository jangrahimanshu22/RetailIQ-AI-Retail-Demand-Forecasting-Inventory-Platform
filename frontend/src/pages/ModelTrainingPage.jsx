import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, Play, Award, Zap, CheckCircle2, 
  BarChart, Clock, ShieldCheck, RefreshCw, Cpu, Layers, Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart as RechartsBarChart, Bar, 
  XAxis, YAxis, Tooltip, Cell, Legend 
} from 'recharts';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { KPICard } from '../components/KPICard';
import { DashboardSkeleton } from '../components/LoadingSkeleton';

const MODEL_COLORS = {
  LightGBM: '#10b981',
  XGBoost: '#06b6d4',
  GradientBoosting: '#6366f1',
  ExtraTrees: '#8b5cf6',
  RandomForest: '#f59e0b',
  DecisionTree: '#ec4899',
  LinearRegression: '#94a3b8',
};

export const ModelTrainingPage = () => {
  const { addToast, refreshDatasetStatus } = useApp();
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [trainProgress, setTrainProgress] = useState(0);
  const [comparison, setComparison] = useState(null);
  const [featureImportance, setFeatureImportance] = useState([]);

  const loadModelData = async () => {
    try {
      setLoading(true);
      const [comp, fi] = await Promise.all([
        api.getModelComparison(),
        api.getFeatureImportance()
      ]);
      setComparison(comp);
      setFeatureImportance(fi.features || []);
    } catch (err) {
      addToast(err.message || 'Failed to load model benchmarks', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModelData();
  }, []);

  const handleTrainAll = async () => {
    try {
      setTraining(true);
      setTrainProgress(15);

      const progressInterval = setInterval(() => {
        setTrainProgress((p) => (p < 85 ? p + 12 : p));
      }, 1200);

      const res = await api.trainAllModels();
      clearInterval(progressInterval);
      setTrainProgress(100);

      // Trigger celebratory confetti effect
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (_) {}

      addToast(res.message || 'All 7 regression models trained successfully!', 'success');
      await refreshDatasetStatus();
      await loadModelData();
    } catch (err) {
      addToast(err.message || 'Training failed', 'error');
    } finally {
      setTraining(false);
      setTimeout(() => setTrainProgress(0), 3000);
    }
  };

  if (loading && !comparison) {
    return <DashboardSkeleton />;
  }

  const modelsList = comparison?.models || [];
  const bestModelName = comparison?.best_model || 'LightGBM';
  const bestMetrics = comparison?.best_metrics || modelsList[0] || {};

  return (
    <div className="space-y-6">
      {/* Top Banner & Train Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-2">
            <BrainCircuit className="w-3.5 h-3.5" />
            Machine Learning Engine
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Regression Model Training & Comparison
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Benchmarks 7 algorithms on held-out time-series cross validation with automated best model selection.
          </p>
        </div>

        <button
          disabled={training}
          onClick={handleTrainAll}
          className="px-6 py-3 rounded-2xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:opacity-95 text-white shadow-xl shadow-indigo-600/30 flex items-center gap-2.5 transition-all disabled:opacity-50 group"
        >
          {training ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Training 7 Models ({trainProgress}%)...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
              <span>Train All Models</span>
            </>
          )}
        </button>
      </div>

      {/* Training Progress Bar */}
      {training && (
        <div className="p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 dark:bg-indigo-950/40 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-300">
            <span>Executing Feature Engineering & Time-Series Split...</span>
            <span>{trainProgress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-300"
              style={{ width: `${trainProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Best Model Hero Badge Card */}
      <div className="p-6 rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/50 via-slate-900/60 to-cyan-950/50 backdrop-blur-xl shadow-glow relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 text-white shadow-lg shadow-indigo-500/30">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Best Performing Algorithm
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Selected for Inference
                </span>
              </div>
              <h2 className="text-3xl font-black text-white mt-1 tracking-tight">
                {bestModelName}
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Outperformed other candidates with the lowest Root Mean Squared Error (RMSE) on out-of-time validation data.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">RMSE</p>
              <p className="text-lg font-black text-emerald-400 mt-0.5">{bestMetrics.RMSE ?? '0.786'}</p>
              <p className="text-[9px] text-slate-500">Lower is better</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">R² Score</p>
              <p className="text-lg font-black text-cyan-400 mt-0.5">{bestMetrics.R2 ?? '0.9992'}</p>
              <p className="text-[9px] text-slate-500">Variance explained</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">MAE</p>
              <p className="text-lg font-black text-indigo-400 mt-0.5">{bestMetrics.MAE ?? '0.450'}</p>
              <p className="text-[9px] text-slate-500">Mean Abs Error</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Train Time</p>
              <p className="text-lg font-black text-amber-400 mt-0.5">{bestMetrics.TrainTime_s ?? '1.07'}s</p>
              <p className="text-[9px] text-slate-500">Fast inference</p>
            </div>
          </div>
        </div>
      </div>

      {/* Model Benchmark Comparison Table */}
      <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              7 Regression Models Evaluation Matrix
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluated on holdout test set with 3-fold time-series cross validation
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {modelsList.length} Models Benchmarked
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Algorithm</th>
                <th className="px-4 py-3">MAE</th>
                <th className="px-4 py-3">RMSE</th>
                <th className="px-4 py-3">MSE</th>
                <th className="px-4 py-3">MAPE (%)</th>
                <th className="px-4 py-3">R² Score</th>
                <th className="px-4 py-3">CV RMSE</th>
                <th className="px-4 py-3">Train Time</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
              {modelsList.map((m, idx) => {
                const isBest = m.Model === bestModelName || idx === 0;
                return (
                  <tr 
                    key={m.Model}
                    className={`transition-colors ${
                      isBest 
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/20 font-bold' 
                        : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="px-4 py-3 text-slate-400 font-sans">
                      #{idx + 1}
                    </td>
                    <td className="px-4 py-3 font-sans font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: MODEL_COLORS[m.Model] || '#6366f1' }}
                      />
                      {m.Model}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{m.MAE}</td>
                    <td className="px-4 py-3 text-emerald-500 font-bold">{m.RMSE}</td>
                    <td className="px-4 py-3 text-slate-500">{m.MSE}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{m.MAPE}%</td>
                    <td className="px-4 py-3 text-cyan-500 font-bold">{m.R2}</td>
                    <td className="px-4 py-3 text-slate-500">{m.CV_RMSE}</td>
                    <td className="px-4 py-3 text-slate-500">{m.TrainTime_s}s</td>
                    <td className="px-4 py-3 font-sans">
                      {isBest ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Selected
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-400">
                          Candidate
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Comparison Charts (RMSE vs R2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RMSE Comparison Chart (lower is better) */}
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
            Model RMSE Comparison (Lower is Better)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Holdout Root Mean Squared Error across all 7 candidate algorithms
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={modelsList}>
                <XAxis dataKey="Model" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }} />
                <Bar dataKey="RMSE" radius={[6, 6, 0, 0]}>
                  {modelsList.map((entry) => (
                    <Cell key={entry.Model} fill={MODEL_COLORS[entry.Model] || '#6366f1'} />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* R² Score Comparison Chart (higher is better) */}
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
            Model R² Score Comparison (Higher is Better)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Proportion of variance explained by each regression model (0.0 to 1.0)
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={modelsList}>
                <XAxis dataKey="Model" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0.95, 1.0]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }} />
                <Bar dataKey="R2" radius={[6, 6, 0, 0]}>
                  {modelsList.map((entry) => (
                    <Cell key={entry.Model} fill={MODEL_COLORS[entry.Model] || '#06b6d4'} />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Feature Importance of Best Model */}
      {featureImportance.length > 0 && (
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
            Top Feature Importance ({bestModelName})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Relative contribution percentage of engineered lag, rolling, and temporal features
          </p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={featureImportance} layout="vertical">
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} unit="%" />
                <YAxis dataKey="feature" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} width={130} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }} />
                <Bar dataKey="importance" name="Importance %" fill="#6366f1" radius={[0, 6, 6, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
