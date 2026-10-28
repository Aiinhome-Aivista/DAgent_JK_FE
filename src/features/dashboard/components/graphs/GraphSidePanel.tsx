import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart3,
  PieChart as PieChartIcon,
  Map,
  TrendingUp,
  BarChart2,
  X,
} from "lucide-react";

import { IndiaMapGraph } from "./IndiaCoverageMap";
import { YoYGrowthGraph } from "./YoYGrowthGraph";
import { YearComparisonChartDynamic } from "./YearComparisonChartDynamic";
import { ZonePieChartDynamic } from "./ZonePieChartDynamic";
import { TyreSalesChartDynamic } from "./TyreSalesChartDynamic";

export const graphPanelItems = [
  {
    id: "yearcomp",
    name: "Year-wise Comparison",
    icon: BarChart3,
    color: "text-violet-500 bg-violet-50",
  },
  {
    id: "zone",
    name: "Sales by Zone",
    icon: PieChartIcon,
    color: "text-amber-500 bg-amber-50",
  },
  {
    id: "map",
    name: "India Coverage",
    icon: Map,
    color: "text-cyan-500 bg-cyan-50",
  },
  {
    id: "yoy",
    name: "YoY Growth",
    icon: TrendingUp,
    color: "text-blue-500 bg-blue-50",
  },
  {
    id: "tyre",
    name: "Tyre Sales",
    icon: BarChart2,
    color: "text-emerald-500 bg-emerald-50",
  },
];

const graphComponents: Record<string, React.FC> = {
  map: IndiaMapGraph,
  yoy: YoYGrowthGraph,
  yearcomp: YearComparisonChartDynamic,
  zone: ZonePieChartDynamic,
  tyre: TyreSalesChartDynamic,
};

interface GraphSidePanelProps {
  activeGraphId: string | null;
  onClose: () => void;
  inline?: boolean;
}

export const GraphSidePanel: React.FC<GraphSidePanelProps> = ({
  activeGraphId,
  onClose,
  inline = false,
}) => {
  const GraphComponent = activeGraphId ? graphComponents[activeGraphId] : null;
  const activeItem = graphPanelItems.find((g) => g.id === activeGraphId);

  return (
    <AnimatePresence>
      {activeGraphId && GraphComponent && (
        <>
          {/* Backdrop */}
          {!inline && (
            <motion.div
              key="graph-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-transparent z-[60]"
            />
          )}
          {/* Panel */}
          <motion.div
            key="graph-panel"
            initial={inline ? { width: 0, opacity: 0 } : { x: "100%" }}
            animate={inline ? { width: 750, opacity: 1 } : { x: 0 }}
            exit={inline ? { width: 0, opacity: 0 } : { x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={
              inline
                ? "h-full shrink-0 border-l border-slate-200 bg-slate-50 flex flex-col relative z-[70] overflow-hidden"
                : "fixed top-0 right-0 h-full w-[750px] max-w-[90vw] bg-slate-50 shadow-2xl z-[70] flex flex-col"
            }
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white shrink-0">
              <div className="flex items-center gap-3">
                {activeItem && (
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeItem.color}`}
                  >
                    <activeItem.icon className="w-4 h-4" />
                  </div>
                )}
                <h3 className="text-base font-bold text-slate-800">
                  {activeItem?.name}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <GraphComponent />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
