import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Label,
  Cell,
} from "recharts";
import { COLORS } from "./mockData";
import { useSessionId, queuedFetch } from "./dashboardHooks";
import { defaultConfig, API_ENDPOINTS } from "@/src/services/api.config";

const DIMENSION_OPTIONS = [
  { label: "Customers", value: "Customers" },
  { label: "Tyres", value: "Tyres" },
  { label: "Territories", value: "Territories" },
  { label: "Regions", value: "Regions" },
  { label: "Materials", value: "Materials" },
];

const DAYS_OPTIONS = [
  { label: "2 Days", value: "2" },
  { label: "3 Days", value: "3" },
  { label: "4 Days", value: "4" },
  { label: "5 Days", value: "5" },
  { label: "6 Days", value: "6" },
];

const Y_AXIS_LABEL_MAP: Record<string, string> = {
  Customers: "Customer Name",
  Tyres: "Tyre Type",
  Territories: "Territory",
  Regions: "Region",
  Materials: "Material Description",
};

// Custom YAxis tick component with hover title to reveal the full untruncated name
const CustomYAxisTick = (props: any) => {
  const { x, y, payload } = props;
  const fullName = String(payload?.value ?? "");
  const displayName = fullName.length > 13 ? `${fullName.substring(0, 13)}...` : fullName;

  return (
    <g transform={`translate(${x},${y})`}>
      <title>{fullName}</title>
      <text
        x={-6}
        y={3}
        textAnchor="end"
        fill="#334155"
        fontSize={10}
        fontWeight={700}
        className="cursor-pointer select-none"
      >
        {displayName}
      </text>
    </g>
  );
};

// Dynamic unit configuration based on actual values in each section
const getUnitConfig = (items: any[]) => {
  const maxVal = Math.max(0, ...items.map((it) => Number(it.sales_value || 0)));

  // If >= ₹5 Lakhs, format in Crores (standard in JK Tyre dashboard)
  if (maxVal >= 500000) {
    return {
      divisor: 10000000,
      unit: "Cr",
      axisLabel: "Sales Value (₹)",
      formatTick: (val: number) => {
        if (val === 0) return "0";
        const formatted = Number(val.toFixed(2)).toString();
        return `₹${formatted} Cr`;
      },
      formatTooltip: (rawVal: number) => {
        const crVal = (rawVal / 10000000).toFixed(2);
        return `₹${crVal} Cr`;
      },
    };
  } else if (maxVal >= 100000) {
    // 1 Lakh to 5 Lakhs
    return {
      divisor: 100000,
      unit: "L",
      axisLabel: "Sales Value (₹ Lakh)",
      formatTick: (val: number) => {
        if (val === 0) return "0";
        const formatted = Number(val.toFixed(2)).toString();
        return `₹${formatted} L`;
      },
      formatTooltip: (rawVal: number) => {
        const lVal = (rawVal / 100000).toFixed(2);
        return `₹${lVal} Lakh (₹${Number(rawVal).toLocaleString("en-IN")})`;
      },
    };
  } else if (maxVal >= 1000) {
    // 1 Thousand to 1 Lakh
    return {
      divisor: 1000,
      unit: "K",
      axisLabel: "Sales Value (₹ K)",
      formatTick: (val: number) => {
        if (val === 0) return "0";
        const formatted = Number(val.toFixed(2)).toString();
        return `₹${formatted} K`;
      },
      formatTooltip: (rawVal: number) => {
        return `₹${(rawVal / 1000).toFixed(2)} K (₹${Number(rawVal).toLocaleString("en-IN")})`;
      },
    };
  } else {
    // Under ₹1,000 (direct rupees)
    return {
      divisor: 1,
      unit: "",
      axisLabel: "Sales Value (₹)",
      formatTick: (val: number) => {
        if (val === 0) return "0";
        return `₹${Number(val.toFixed(0)).toString()}`;
      },
      formatTooltip: (rawVal: number) => `₹${Number(rawVal).toLocaleString("en-IN")}`,
    };
  }
};

export const TopBottomPerformanceChart = () => {
  const sessionId = useSessionId();

  const [dimension, setDimension] = useState<string>("Customers");
  const [days, setDays] = useState<string>("2");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [topData, setTopData] = useState<any[]>([]);
  const [bottomData, setBottomData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const userId = localStorage.getItem("DAgent_user_id");
        if (!sessionId || sessionId === "null") {
          setIsLoading(false);
          return;
        }

        const response = await queuedFetch(
          `${defaultConfig.baseUrl}${API_ENDPOINTS.DASHBOARD.TOP_BOTTOM_PERFORMANCE}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: sessionId,
              user_id: userId,
              dimension: dimension,
              days: Number(days),
            }),
          }
        );

        const data = await response.json();
        if (data.status === "success") {
          setTopData(data.top_10 || []);
          setBottomData(data.bottom_10 || []);
        } else {
          setTopData([]);
          setBottomData([]);
        }
      } catch (err) {
        console.error("Failed to fetch top/bottom performance data:", err);
        setTopData([]);
        setBottomData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sessionId, dimension, days]);

  const yAxisLabel = Y_AXIS_LABEL_MAP[dimension] || "Entity";

  const renderSection = (
    title: string,
    rawItems: any[],
    isTop: boolean
  ) => {
    const config = getUnitConfig(rawItems);
    const chartData = rawItems.map((item) => ({
      name: item.name || "Unknown",
      value: Number((Number(item.sales_value || 0) / config.divisor).toFixed(4)),
      sales_value: Number(item.sales_value || 0),
      rank: item.rank,
    }));

    return (
      <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-4 sm:p-5 flex flex-col h-[400px]">
        <div className="flex items-center justify-between mb-3 gap-2">
          <h3 className="text-base font-bold text-slate-800">
            {title}
          </h3>
        </div>

        <div className="flex-1 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 font-medium text-sm">
              No data available for the last {days} days.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 10, right: 25, left: 35, bottom: 25 }}
              >
                <CartesianGrid
                  vertical={true}
                  horizontal={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  type="number"
                  padding={{ left: 1 }}
                  tick={{ fontSize: 10, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={config.formatTick}
                >
                  <Label
                    value={config.axisLabel}
                    offset={5}
                    position="bottom"
                    style={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
                  />
                </XAxis>
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={<CustomYAxisTick />}
                  axisLine={{ stroke: "#475569", strokeWidth: 1 }}
                  tickLine={false}
                  tickMargin={5}
                  width={115}
                >
                  <Label
                    value={yAxisLabel}
                    angle={-90}
                    position="left"
                    style={{ textAnchor: "middle", fill: "#64748b", fontSize: 11, fontWeight: 600 }}
                  />
                </YAxis>
                <RechartsTooltip
                  wrapperStyle={{ zIndex: 1000 }}
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value: any, name: any, props: any) => {
                    const rawVal = props?.payload?.sales_value ?? value;
                    return [config.formatTooltip(Number(rawVal)), "Sales Value"];
                  }}
                  labelFormatter={(label: any) => `${yAxisLabel}: ${label}`}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-6">
      {/* Top Header of the card */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-800">
            Toppers and Draggers
          </h2>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {/* Dimension dropdown (Includes Tyres, Customers, Territories, Regions, Materials) */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-50 transition-colors focus-within:border-slate-300 focus-within:shadow-sm">
            <select
              value={dimension}
              onChange={(e) => setDimension(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-transparent outline-none cursor-pointer"
            >
              {DIMENSION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Rolling Window selector pills */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 shrink-0">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
              Days:
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {DAYS_OPTIONS.map((d) => {
                const isSelected = days === d.value;
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDays(d.value)}
                    className={`px-2.5 py-0.5 text-xs font-bold rounded transition-all border shrink-0 cursor-pointer ${
                      isSelected
                        ? "border-amber-400 bg-amber-50 text-amber-900 shadow-xs"
                        : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {d.value}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Inside the Container: Two side-by-side cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderSection(`Top 10 ${dimension}`, topData, true)}
        {renderSection(`Worst 10 ${dimension}`, bottomData, false)}
      </div>
    </div>
  );
};
