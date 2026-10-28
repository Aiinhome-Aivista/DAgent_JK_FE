import React, { useRef } from "react";
import { Download } from "lucide-react";
import { toPng } from "html-to-image";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { dummyYoYData } from "./mockData";

export const YoYGrowthGraph = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!chartRef.current) return;
    try {
      const dataUrl = await toPng(chartRef.current, {
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = "yoy-growth-graph.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download chart", err);
    }
  };

  return (
    <div
      ref={chartRef}
      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[500px]"
    >
      <div className="flex items-center justify-between mb-4 gap-2">
        <h3 className="text-lg font-bold text-slate-800">
          YoY Growth by Region
        </h3>
        <button
          onClick={handleDownload}
          className="flex items-center justify-center p-1.5 md:p-2 rounded-lg transition-all text-slate-500 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          title="Download Graph"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={[
              {
                name: "FY 2026",
                ...dummyYoYData.reduce(
                  (acc, curr) => ({ ...acc, [curr.name]: curr.y2026 }),
                  {},
                ),
              },
              {
                name: "FY 2025",
                ...dummyYoYData.reduce(
                  (acc, curr) => ({ ...acc, [curr.name]: curr.y2025 }),
                  {},
                ),
              },
            ]}
            margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
            barGap={0}
            barCategoryGap="20%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fontWeight: "bold" }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => `$${val}M`}
            />
            <RechartsTooltip
              wrapperStyle={{ zIndex: 1000 }}
              cursor={{ fill: "#f8fafc" }}
              contentStyle={{
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            {dummyYoYData.slice(0, 10).map((region, index) => {
              const colors = [
                "#3b82f6",
                "#ef4444",
                "#0ea5e9",
                "#f97316",
                "#10b981",
                "#8b5cf6",
                "#f43f5e",
                "#06b6d4",
                "#84cc16",
                "#14b8a6",
              ];
              return (
                <Bar
                  key={region.name}
                  dataKey={region.name}
                  fill={colors[index % colors.length]}
                  radius={[2, 2, 0, 0]}
                  barSize={4}
                />
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
