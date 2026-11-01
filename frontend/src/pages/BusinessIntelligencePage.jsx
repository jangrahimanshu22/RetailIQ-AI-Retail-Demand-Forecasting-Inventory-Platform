import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, TrendingUp, TrendingDown, DollarSign, 
  Store, Award, AlertTriangle, ArrowRight, Sparkles, CheckCircle2,
  PieChart as PieIcon, BarChart2
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend 
} from 'recharts';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { DashboardSkeleton } from '../components/LoadingSkeleton';

export const BusinessIntelligencePage = () => {
  const { addToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const res = await api.getBusinessInsights();
      setData(res);
    } catch (err) {
      addToast(err.message || 'Failed to generate business intelligence', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  const bestSelling = data?.best_selling || [];
  const worstSelling = data?.worst_selling || [];
  const highRevenue = data?.high_revenue_products || [];
  const lowStores = data?.low_performing_stores || [];
  const categories = data?.category_breakdown || [];
  const execRecs = data?.executive_recommendations || [];
  const seasonalOpp = data?.seasonal_opportunities || [];
  const promoElasticity = data?.promotion_elasticity || null;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-2">
            <Lightbulb className="w-3.5 h-3.5" />
            Strategic Business Intelligence
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Automated Retail Insights & Growth Diagnostics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Algorithmic identification of top revenue drivers, promotional uplift, seasonal windfalls, and underperforming assets.
          </p>
        </div>

        <div className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-indigo-500/20 text-xs">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Fastest-Moving Category</span>
          <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
            🔥 {data?.top_category || 'Electronics'}
          </span>
        </div>
      </div>

      {/* Strategic Executive Recommendations Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {execRecs.map((rec, i) => {
          let badgeColor = 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
          if (rec.priority === 'CRITICAL') badgeColor = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
          else if (rec.priority === 'HIGH') badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';

          return (
            <div 
              key={i} 
              className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeColor}`}>
                    {rec.priority} Priority
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">{rec.category}</span>
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed mt-2">
                  {rec.action}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-[11px] text-indigo-500 font-semibold">
                <span>Action Recommended</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Row 1: Best-Selling vs Worst-Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Selling Products */}
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                🏆 Top 5 Best-Selling Products
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Highest transactional volume in units
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            {bestSelling.map((p, idx) => (
              <div key={p.Product_ID} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                    #{idx + 1}
                  </span>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{p.Product_Name}</span>
                    <span className="block text-[10px] text-slate-400 font-mono">{p.Product_ID}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{p.Sales_Quantity?.toLocaleString()}</span>
                  <span className="block text-[10px] text-emerald-500 font-medium">units</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Worst Selling Products */}
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                📉 Bottom 5 Worst-Selling Products
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Slowest turning inventory lines needing clearance
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            {worstSelling.map((p, idx) => (
              <div key={p.Product_ID} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold flex items-center justify-center text-[10px]">
                    #{idx + 1}
                  </span>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{p.Product_Name}</span>
                    <span className="block text-[10px] text-slate-400 font-mono">{p.Product_ID}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{p.Sales_Quantity?.toLocaleString()}</span>
                  <span className="block text-[10px] text-rose-500 font-medium">units</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Highest Revenue SKUs & Lowest Performing Stores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Highest Revenue Products */}
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                💰 Top Revenue Generating SKUs
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Products contributing largest gross dollar volume
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            {highRevenue.map((p, idx) => (
              <div key={p.Product_ID} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 font-bold flex items-center justify-center text-[10px]">
                    #{idx + 1}
                  </span>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{p.Product_Name}</span>
                    <span className="block text-[10px] text-slate-400 font-mono">{p.Product_ID}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-500 font-mono">${Number(p.Revenue).toLocaleString()}</span>
                  <span className="block text-[10px] text-slate-400">gross sales</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lowest Performing Stores */}
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                ⚠️ Lowest Performing Retail Stores
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Locations generating lowest revenue requiring audit
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            {lowStores.map((s, idx) => (
              <div key={s.Store_ID} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-[10px]">
                    #{idx + 1}
                  </span>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{s.Store_ID}</span>
                    <span className="block text-[10px] text-slate-400">{s.Store_Location}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 dark:text-white font-mono">${Number(s.Revenue).toLocaleString()}</span>
                  <span className="block text-[10px] text-amber-500 font-medium">underperforming</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Seasonal Opportunities & Promotional Elasticity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Promotional Elasticity Impact */}
        {promoElasticity && (
          <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Promotional Elasticity & Uplift
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Empirical sales lift measured during active promotional campaigns
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">No Promotion</p>
                <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mt-1">{promoElasticity.non_promo_avg}</p>
                <p className="text-[10px] text-slate-400">units/day</p>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-center">
                <p className="text-[10px] text-indigo-500 uppercase font-semibold">With Promotion</p>
                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-300 mt-1">{promoElasticity.promo_avg}</p>
                <p className="text-[10px] text-indigo-400">units/day</p>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-center">
                <p className="text-[10px] text-emerald-500 uppercase font-semibold">Net Uplift</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">+{promoElasticity.uplift_pct}%</p>
                <p className="text-[10px] text-emerald-500">volume boost</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium pt-2">
              💡 {promoElasticity.conclusion}
            </p>
          </div>
        )}

        {/* Seasonal Opportunities */}
        <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] shadow-subtle space-y-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Seasonal Windfall Analysis
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Detected macroeconomic & seasonal catalysts
          </p>

          <div className="space-y-3 pt-2">
            {seasonalOpp.map((opp, i) => (
              <div key={i} className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs">
                <div className="flex items-center justify-between font-bold text-cyan-700 dark:text-cyan-300 mb-1">
                  <span>{opp.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">{opp.impact}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  {opp.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
