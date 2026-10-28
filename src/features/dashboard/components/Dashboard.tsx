import React, { useState } from 'react';
import { RefreshCw, Map, TrendingUp, PieChart as PieChartIcon, BarChart3, ArrowLeft } from 'lucide-react';
import { DashboardKPIs, graphPanelItems, GraphSidePanel } from './DashboardCharts';

interface DashboardProps {
  onBack: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onBack }) => {
  const [activeGraphId, setActiveGraphId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col overflow-hidden">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shrink-0 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-slate-100 border border-slate-200 text-slate-600 transition-all hover:text-slate-900 cursor-pointer flex items-center justify-center active:scale-95"
            title="Back to Landing Page"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Revenue Sales Dashboard</h2>
            <p className="text-[11px] text-slate-500">Overview & Key Indicators (1,000 records)</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 font-semibold rounded-xl hover:bg-yellow-100 transition-all border border-yellow-200 text-xs active:scale-95 cursor-pointer">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </header>

      {/* Main content body */}
      <main className="flex-1 p-6 overflow-hidden max-w-[1600px] mx-auto w-full flex gap-6">
        {/* Left Side: Premium Overview (No scroll) */}
        <div className="flex-1 min-w-0 flex flex-col gap-6 overflow-y-auto pr-2 [scrollbar-width:thin]">
          {/* Welcome Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-8 text-white shadow-lg border border-slate-800 shrink-0">
            <div className="relative z-10 max-w-xl">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-3">
                Analytical Intelligence
              </span>
              <h3 className="text-xl font-black tracking-tight mb-2">Welcome to your DAgent Analytics</h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                Explore a high-level summary of your business performance below. For deeper regional insights, comparisons, or distributions, simply click any reporting chart from the access panel on the right.
              </p>
            </div>
            {/* Background decorative glows */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Grid of Summary Insights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600 shrink-0">
                  <Map className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">National Sales Coverage</h4>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Active footprint across 9 key regional hubs in India. Highest coverage recorded in Jaipur (65%) and Bengaluru (95%).
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">YoY Revenue Growth</h4>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Overall growth remains steady. Q1 highlights exceptional performance in North-East clusters, beating forecasts by 4.2%.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                  <PieChartIcon className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Sales Distribution</h4>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Central (31.2%) and North (29.6%) zones continue to contribute over 60% of total revenue share this fiscal year.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Product Categories</h4>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Truck tyres lead with $27.53M in sales. LCV and Car categories show the fastest expansion velocity at +12.4% YoY.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: KPIs and Chart Selection (Scrollable) */}
        <div className="w-56 shrink-0 flex flex-col gap-4 border-l border-slate-200 pl-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden bg-slate-50">
          {/* KPIs */}
          <DashboardKPIs />

          {/* Graph launch buttons */}
          <div className="flex items-center gap-2 pt-2">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Launch Charts</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          
          <div className="space-y-2 pb-6">
            {graphPanelItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveGraphId(item.id)}
                className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border transition-all duration-200 cursor-pointer group ${
                  activeGraphId === item.id
                    ? 'border-blue-300 bg-blue-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${item.color}`}>
                  <item.icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-bold text-slate-600 group-hover:text-slate-900 truncate">
                  {item.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Graph Side Panel overlay */}
      <GraphSidePanel activeGraphId={activeGraphId} onClose={() => setActiveGraphId(null)} />
    </div>
  );
};

