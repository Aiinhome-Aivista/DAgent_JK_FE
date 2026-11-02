import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { COLORS } from "./mockData";
import {FilterSelect, useDashboardFilters, useSessionId, queuedFetch } from "./dashboardHooks";
import { defaultConfig, API_ENDPOINTS } from "@/src/services/api.config";

export const ZonePieChartDynamic = ({ zone }: { zone?: string | null }) => {
  const filters = useDashboardFilters();
  const sessionId = useSessionId();

  const [zoneConstructionType, setZoneConstructionType] = useState("All");
  const [zoneTyreType, setZoneTyreType] = useState("All");
  const [zoneYear, setZoneYear] = useState("All");
  const [zoneMonth, setZoneMonth] = useState("All");
  const [zoneData, setZoneData] = useState<any[]>([]);
  const [isZoneLoading, setIsZoneLoading] = useState(true);
  const [zoneAxisLabels, setZoneAxisLabels] = useState({
    x: "Name",
    y: "Sales Value (₹)",
  });
  const [zoneChartTitle, setZoneChartTitle] = useState("Sales by Zone");

  useEffect(() => {
    const fetchZoneData = async () => {
      setIsZoneLoading(true);
      try {
        if (!sessionId || sessionId === "null") {
          setIsZoneLoading(false);
          return;
        }
        const response = await queuedFetch(
          `${defaultConfig.baseUrl}${API_ENDPOINTS.DASHBOARD.SALES_BY_ZONE}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: sessionId,
              construction_type: zoneConstructionType,
              tyre_type: zoneTyreType,
              years: zoneYear === "All" ? "All" : [Number(zoneYear)],
              months: zoneMonth,
              selected_zones: zone && zone.toLowerCase() !== "all" ? [zone] : []
            }),
          },
        );
        const data = await response.json();
        if (
          data.status === "success" &&
          data.visualizations &&
          data.visualizations[0] &&
          data.visualizations[0].data
        ) {
          const viz = data.visualizations[0];
          const formatLabel = (key: string) => {
            if (!key) return "";
            return key
              .split("_")
              .map(
                (word: string) => word.charAt(0).toUpperCase() + word.slice(1),
              )
              .join(" ");
          };
          let xLabel = formatLabel(viz.xKey) || "Name";
          let yLabel = formatLabel(viz.yKey) || "Sales Value";
          if (yLabel === "Sales Value") yLabel += " (₹)";
          setZoneAxisLabels({ x: xLabel, y: yLabel });
          if (viz.title) setZoneChartTitle(viz.title);

          const mappedData = data.visualizations[0].data.map((item: any) => {
            const rawSales = Number(item.sales_value ?? item.value ?? 0);
            const pct = item.percentage !== undefined && item.percentage !== null && !isNaN(Number(item.percentage))
              ? Number(item.percentage)
              : undefined;
            return {
              name: item.name || item.zone || item.zone_name,
              value: rawSales,
              percentage: pct,
              sales_value: rawSales,
            };
          });
          setZoneData(mappedData);
        }
      } catch (err) {
        console.error("Failed to fetch zone sales data:", err);
      } finally {
        setIsZoneLoading(false);
      }
    };
    fetchZoneData();
  }, [
    sessionId,
    zoneConstructionType,
    zoneTyreType,
    zoneYear,
    zoneMonth,
    zone,
  ]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[450px]">
      <div className="flex items-start justify-between mb-4 gap-4">
        <h3
          className="text-lg font-bold text-slate-800"
          style={{ flexShrink: 0 }}
        >
          {zoneChartTitle}
        </h3>
        <div
          className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-2 custom-h-scrollbar ml-auto"
          style={{ minWidth: 0 }}
        >
          <FilterSelect
            label="Year"
            value={zoneYear}
            onChange={(e) => setZoneYear(e.target.value)}
            options={filters.years}
          />
          <FilterSelect
            label="Month"
            value={zoneMonth}
            onChange={(e) => setZoneMonth(e.target.value)}
            options={filters.months}
          />

          <FilterSelect
            label="Construction Type"
            value={zoneConstructionType}
            onChange={(e) => setZoneConstructionType(e.target.value)}
            options={filters.constructions}
          />
          <FilterSelect
            label="Tyre Type"
            value={zoneTyreType}
            onChange={(e) => setZoneTyreType(e.target.value)}
            options={filters.tyreTypes}
          />
        </div>
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center">
        {isZoneLoading ? (
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        ) : zoneData.length === 0 ? (
          <div className="text-slate-400 font-medium text-sm">
            No data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={zoneData}
                cx="50%"
                cy="48%"
                outerRadius={110}
                fill="#8884d8"
                dataKey="value"
                minAngle={4}
                label={({ name, percent }) => {
                  const pctVal = percent * 100;
                  const displayPct = pctVal < 0.1 && pctVal > 0 ? "<0.1%" : `${pctVal.toFixed(1)}%`;
                  return `${name}: ${displayPct}`;
                }}
                labelLine={true}
                stroke="#ffffff"
                strokeWidth={1}
              >
                {zoneData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ paddingTop: "8px", fontSize: "12px" }}
              />
              <RechartsTooltip
                wrapperStyle={{ zIndex: 1000 }}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value: any, name: any, props: any) => {
                  const salesValue = props?.payload?.sales_value ?? value;
                  const pct = props?.payload?.percentage !== undefined
                    ? Number(props.payload.percentage).toFixed(1)
                    : (props?.payload?.percent ? (props.payload.percent * 100).toFixed(1) : "0.0");
                  const displayPct = Number(pct) < 0.1 && Number(pct) > 0 ? "<0.1%" : `${pct}%`;
                  if (salesValue !== undefined && salesValue !== null) {
                    let val = Number(salesValue);
                    let formatted = val >= 10000000
                      ? `₹${(val / 10000000).toFixed(2)} Cr`
                      : val >= 100000
                        ? `₹${(val / 100000).toFixed(2)} L`
                        : `₹${val.toLocaleString()}`;
                    return [
                      `${displayPct} | ${zoneAxisLabels.y.replace(" (₹)", "")}: ${formatted}`,
                      name,
                    ];
                  }
                  return [displayPct, name];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
