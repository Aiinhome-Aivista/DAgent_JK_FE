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
import { FilterSelect, useAvailableYears, useSessionId } from "./dashboardHooks";
import { defaultConfig, API_ENDPOINTS } from "@/src/services/api.config";

export const TyreSalesChartDynamic = ({ zone }: { zone?: string | null }) => {
  const {
    availableYears,
    availableZones,
    availableRegions,
    availableCustomerTypes,
    availableConstructionTypes,
  } = useAvailableYears();

  const sessionId = useSessionId();

  const [tyreData, setTyreData] = useState<any[]>([]);
  const [isTyreLoading, setIsTyreLoading] = useState(true);
  const [tyreAxisLabels, setTyreAxisLabels] = useState({
    x: "Sales (₹)",
    y: "Tyre Type",
  });
  const [tyreChartTitle, setTyreChartTitle] = useState(
    "Top 10 Tyre Types by Sales",
  );

  const [tyreYear, setTyreYear] = useState("All");
  const [tyreCustomerCategory, setTyreCustomerCategory] = useState("All");
  const [tyreZone, setTyreZone] = useState("All");
  const [tyreRegion, setTyreRegion] = useState("All");
  const [tyreConstructionType, setTyreConstructionType] = useState("All");

  useEffect(() => {
    const fetchTyreData = async () => {
      setIsTyreLoading(true);
      try {
        const userId = localStorage.getItem("DAgent_user_id");
        if (!sessionId || sessionId === "null") {
          setIsTyreLoading(false);
          return;
        }
        const response = await fetch(
          `${defaultConfig.baseUrl}${API_ENDPOINTS.DASHBOARD.TYRE_SALES_DATA}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: sessionId,
              question: "Top 10 Tyre Types by Sales ",
              user_id: userId,
              year: tyreYear === "All" ? ["All"] : [Number(tyreYear)],
              customer_category: [tyreCustomerCategory],
              zone: zone && zone.toLowerCase() !== "all" 
                ? [zone] 
                : tyreZone.toLowerCase() === "all" ? ["All"] : [tyreZone],
              region: [tyreRegion],
              construction_type: [tyreConstructionType],
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
          const mappedData = data.visualizations[0].data.map((item: any) => {
            let val = Number(item.sales_value);
            let plotValue = val;
            if (val >= 100000) {
              plotValue = val / 10000000;
            }
            return {
              name: item.category,
              value: plotValue,
              sales_value: item.sales_value,
            };
          });

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
          let xLabel = formatLabel(viz.xKey) || "Sales Value";
          if (xLabel === "Sales Value") xLabel += " (₹)";
          let yLabel = formatLabel(viz.yKey) || "Tyre Type";
          setTyreAxisLabels({ x: xLabel, y: yLabel });
          if (viz.title) setTyreChartTitle(viz.title);

          setTyreData(mappedData);
        }
      } catch (err) {
        console.error("Failed to fetch tyre sales data:", err);
      } finally {
        setIsTyreLoading(false);
      }
    };
    fetchTyreData();
  }, [
    tyreYear,
    tyreCustomerCategory,
    tyreZone,
    tyreRegion,
    tyreConstructionType,
    sessionId,
    zone,
  ]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
      <div className="flex items-start justify-between mb-4 gap-4">
        <h3
          className="text-lg font-bold text-slate-800"
          style={{ flexShrink: 0 }}
        >
          {tyreChartTitle}
        </h3>
        <div
          className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-2 custom-h-scrollbar ml-auto"
          style={{ minWidth: 0 }}
        >
          <FilterSelect
            label="Year"
            value={tyreYear}
            onChange={(e) => setTyreYear(e.target.value)}
            options={availableYears}
          />
          <FilterSelect
            label="Zone"
            value={tyreZone}
            onChange={(e) => setTyreZone(e.target.value)}
            options={availableZones}
          />
          <FilterSelect
            label="Region"
            value={tyreRegion}
            onChange={(e) => setTyreRegion(e.target.value)}
            options={availableRegions}
          />
          <FilterSelect
            label="Customer Category"
            value={tyreCustomerCategory}
            onChange={(e) => setTyreCustomerCategory(e.target.value)}
            options={availableCustomerTypes}
          />
          <FilterSelect
            label="Construction Type"
            value={tyreConstructionType}
            onChange={(e) => setTyreConstructionType(e.target.value)}
            options={availableConstructionTypes}
          />
        </div>
      </div>
      <div className="flex-1 min-h-0">
        {isTyreLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : tyreData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 font-medium text-sm">
            No data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={tyreData}
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
                tickFormatter={(val) => (val === 0 ? "₹0" : `₹${val} Cr`)}
              >
                <Label
                  value={tyreAxisLabels.x}
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
                width={100}
              >
                <Label
                  value={tyreAxisLabels.y}
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
                  const salesValue = props.payload.sales_value;
                  if (salesValue) {
                    let val = Number(salesValue);
                    let formatted = `₹${(val / 10000000).toFixed(2)} Cr`;
                    return [formatted, tyreAxisLabels.x.replace(" (₹)", "")];
                  }
                  return [
                    `₹${Number(value).toFixed(2)} Cr`,
                    tyreAxisLabels.x.replace(" (₹)", ""),
                  ];
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                {tyreData.map((entry, index) => (
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
