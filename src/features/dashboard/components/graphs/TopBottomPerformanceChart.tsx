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
import { FilterSelect, useSessionId, queuedFetch } from "./dashboardHooks";
import { defaultConfig, API_ENDPOINTS } from "@/src/services/api.config";

const DIMENSION_OPTIONS = [
  { label: "Customers", value: "Customers" },
  { label: "Dealers", value: "Dealers" },
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
  Dealers: "Dealer Name",
  Territories: "Territory",
  Regions: "Region",
  Materials: "Material Description",
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
          const mapChartItems = (items: any[]) => {
            return (items || []).map((item: any) => {
              const val = Number(item.sales_value || 0);
              const plotValue = val >= 100000 ? val / 10000000 : val;
              return {
                name: item.name || "Unknown",
                value: plotValue,
                sales_value: val,
                rank: item.rank,
              };
            });
          };

          setTopData(mapChartItems(data.top_10));
          setBottomData(mapChartItems(data.bottom_10));
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

  const renderBarCard = (
    title: string,
    chartData: any[],
    isTop: boolean
  ) => {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
        <div className="flex items-start justify-between mb-4 gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-800 shrink-0">
              {title}
            </h3>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                isTop
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {isTop ? "Highest Sales" : "Lowest Positive Sales"}
            </span>
          </div>
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
                margin={{ top: 5, right: 30, left: 60, bottom: 20 }}
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
                  tickFormatter={(val) => (val === 0 ? "₹0" : `₹${Number(val).toFixed(2)} Cr`)}
                >
                  <Label
                    value="Sales Value (₹)"
                    offset={5}
                    position="bottom"
                    style={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
                  />
                </XAxis>
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#334155", fontWeight: 700 }}
                  axisLine={{ stroke: "#475569", strokeWidth: 1 }}
                  tickLine={false}
                  tickMargin={10}
                  width={110}
                  tickFormatter={(val) =>
                    String(val).length > 15 ? `${String(val).substring(0, 15)}...` : String(val)
                  }
                >
                  <Label
                    value={yAxisLabel}
                    angle={-90}
                    position="insideLeft"
                    style={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
                    offset={-10}
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
                    const salesValue = props?.payload?.sales_value;
                    if (salesValue !== undefined && salesValue !== null) {
                      const val = Number(salesValue);
                      const formatted = `₹${(val / 10000000).toFixed(2)} Cr`;
                      return [formatted, "Sales Value"];
                    }
                    return [`₹${Number(value).toFixed(2)} Cr`, "Sales Value"];
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
    <div className="flex flex-col gap-4">
      {/* Shared Filter Bar matching Dashboard style */}
      <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">
            Top 10 & Bottom 10 Sales Performance
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Side-by-side rolling window ranking comparing highest vs lowest positive contributors
          </p>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <FilterSelect
            label="Dimension"
            value={dimension}
            onChange={(e: any) => setDimension(e.target.value)}
            options={DIMENSION_OPTIONS}
          />
          <FilterSelect
            label="Rolling Window"
            value={days}
            onChange={(e: any) => setDays(e.target.value)}
            options={DAYS_OPTIONS}
          />
        </div>
      </div>

      {/* Side-by-Side Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderBarCard(`Top 10 ${dimension}`, topData, true)}
        {renderBarCard(`Bottom 10 ${dimension}`, bottomData, false)}
      </div>
    </div>
  );
};

