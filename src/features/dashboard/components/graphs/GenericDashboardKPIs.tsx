import React from "react";
import { useConnectorContext } from "../../../../context/ConnectorContext";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";

export const GenericDashboardKPIs = () => {
  const { connectorResults } = useConnectorContext();
  const kpis = connectorResults?.report_content?.kpis || [];

  const safeKpiValue = (val: any): string => {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'object') return Object.entries(val).map(([k, v]) => `${k}: ${v}`).join(' | ');
    return String(val);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1 mb-1">
        Key Metrics
      </div>
      
      {kpis.length === 0 ? (
        <div className="text-center text-xs text-slate-400 py-4">
          No metrics available
        </div>
      ) : (
        kpis.map((kpi: any, idx: number) => {
          const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : Minus;
          const trendColor = kpi.trend === 'up' ? 'text-emerald-500' : kpi.trend === 'down' ? 'text-rose-500' : 'text-slate-400';

          return (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 line-clamp-1">
                {kpi.title}
              </h4>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xl font-bold text-slate-800">
                  {safeKpiValue(kpi.value)}
                </span>
                <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />
              </div>
              <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">
                {kpi.description}
              </p>
            </div>
          );
        })
      )}
    </div>
  );
};
