import React, { useState, useEffect } from "react";
import {
  BarChart3,
  LineChart as LineChartIcon,
  AreaChart as AreaChartIcon,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  Label,
} from "recharts";
import {
  FilterSelect,
  useAvailableYears,
  useSessionId,
} from "./dashboardHooks";
import { defaultConfig, API_ENDPOINTS } from "@/src/services/api.config";

export const YearComparisonChartDynamic = ({ zone }: { zone?: string | null }) => {
  const {
    availableYears,
    availableZones,
    availableRegions,
    availableMonths,
    availableCustomerTypes,
    isAvailableYearsLoading,
  } = useAvailableYears();

  const sessionId = useSessionId();

  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [chartType, setChartType] = useState<"column" | "line" | "area">(
    "column",
  );

  useEffect(() => {
    if (availableYears.length > 0 && selectedYears.length === 0) {
      setSelectedYears([availableYears[0]]);
    }
  }, [availableYears]);

  const [yearComparisonData, setYearComparisonData] = useState<any[]>([]);
  const [isYearComparisonLoading, setIsYearComparisonLoading] = useState(true);
  const [yearComparisonAxisLabels, setYearComparisonAxisLabels] = useState({
    x: "Month",
    y: "Sales Value (₹)",
  });
  const [yearComparisonTitle, setYearComparisonTitle] = useState(
    "Year Wise Comparison",
  );
  const [yearComparisonZone, setYearComparisonZone] = useState("All");
  const [yearComparisonRegion, setYearComparisonRegion] = useState("All");
  const [yearComparisonMonth, setYearComparisonMonth] = useState("All");
  const [yearComparisonCustomerType, setYearComparisonCustomerType] =
    useState("All");
  const [yearComparisonConstructionType, setYearComparisonConstructionType] =
    useState("All");

  useEffect(() => {
    const fetchYearComparisonData = async () => {
      if (selectedYears.length === 0) {
        setIsYearComparisonLoading(false);
        return;
      }
      setIsYearComparisonLoading(true);
      try {
        const userId = localStorage.getItem("DAgent_user_id");
        if (!sessionId || sessionId === "null") {
          setIsYearComparisonLoading(false);
          return;
        }
        const response = await fetch(
          `${defaultConfig.baseUrl}${API_ENDPOINTS.DASHBOARD.YEAR_WISE_FILTER}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: sessionId,
              selected_years: selectedYears,
              selected_zones:
                zone && zone.toLowerCase() !== "all" 
                  ? [zone] 
                  : yearComparisonZone.toLowerCase() === "all"
                  ? ["all"]
                  : [yearComparisonZone],
              selected_regions:
                yearComparisonRegion.toLowerCase() === "all"
                  ? ["all"]
                  : [yearComparisonRegion],
              selected_months:
                yearComparisonMonth.toLowerCase() === "all"
                  ? ["all"]
                  : [yearComparisonMonth],
              selected_customer_types:
                yearComparisonCustomerType.toLowerCase() === "all"
                  ? ["all"]
                  : [yearComparisonCustomerType],
              selected_construction_types:
                yearComparisonConstructionType.toLowerCase() === "all"
                  ? ["all"]
                  : [yearComparisonConstructionType],
            }),
          },
        );
        const data = await response.json();
        if (data && data.visualization) {
          const formatLabel = (key: string) => {
            if (!key) return "";
            return key
              .split("_")
              .map(
                (word: string) => word.charAt(0).toUpperCase() + word.slice(1),
              )
              .join(" ");
          };
          let xLabel = formatLabel(data.xKey) || "Month";
          let yLabel = formatLabel(data.yKey) || "Sales Value";
          if (yLabel === "Sales Value") yLabel += " (₹)";
          setYearComparisonAxisLabels({ x: xLabel, y: yLabel });
          if (data.title) setYearComparisonTitle(data.title);

          const map: any = {};
          data.visualization.forEach((item: any) => {
            let month = item.month
              ? item.month.substring(0, 3).toUpperCase()
              : "";
            if (!map[month]) map[month] = { month };
            map[month][`y${item.year}`] = item.sales_value / 10000000;
            map[month][`sales_value_${item.year}`] = item.sales_value;
          });
          const MONTH_ORDER = [
            "JAN",
            "FEB",
            "MAR",
            "APR",
            "MAY",
            "JUN",
            "JUL",
            "AUG",
            "SEP",
            "OCT",
            "NOV",
            "DEC",
          ];
          const pivoted = Object.values(map).sort(
            (a: any, b: any) =>
              MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month),
          );
          setYearComparisonData(pivoted);
        }
      } catch (err) {
        console.error("Failed to fetch year comparison data:", err);
      } finally {
        setIsYearComparisonLoading(false);
      }
    };
    fetchYearComparisonData();
  }, [
    sessionId,
    selectedYears,
    yearComparisonZone,
    yearComparisonRegion,
    yearComparisonMonth,
    yearComparisonCustomerType,
    yearComparisonConstructionType,
    zone
  ]);

  const yearColors: Record<number, string> = {
    2022: "#3b82f6", // Blue
    2023: "#10b981", // Emerald
    2024: "#8b5cf6", // Violet
    2025: "#f59e0b", // Amber
    2026: "#ef4444", // Red
  };

  const getYearColor = (year: number) => {
    if (yearColors[year]) return yearColors[year];
    const colors = ["#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#a855f7"];
    return colors[year % colors.length];
  };

  const toggleYear = (year: number) => {
    setSelectedYears((prev) =>
      prev.includes(year)
        ? prev.filter((y) => y !== year)
        : [...prev, year].sort(),
    );
  };

  const renderChart = () => {
    const commonProps = {
      data: yearComparisonData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    const commonAxes = (
      <>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#e2e8f0"
        />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(val) => `₹${val} Cr`}
        >
          <Label
            value={yearComparisonAxisLabels.y}
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
            const yearStr = String(name);
            const originalVal = props.payload[`sales_value_${yearStr}`];
            if (originalVal) {
              return [
                `₹${(Number(originalVal) / 10000000).toFixed(2)} Cr`,
                name,
              ];
            }
            return [`₹${Number(value).toFixed(2)} Cr`, name];
          }}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
      </>
    );

    if (chartType === "line") {
      return (
        <LineChart {...commonProps}>
          {commonAxes}
          {selectedYears.map((year) => (
            <Line
              key={year}
              type="monotone"
              dataKey={`y${year}`}
              stroke={getYearColor(year)}
              name={`${year}`}
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      );
    }

    if (chartType === "area") {
      return (
        <AreaChart {...commonProps}>
          {commonAxes}
          {selectedYears.map((year) => (
            <Area
              key={year}
              type="monotone"
              dataKey={`y${year}`}
              stroke={getYearColor(year)}
              fill={getYearColor(year)}
              name={`${year}`}
              fillOpacity={0.3}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      );
    }

    return (
      <BarChart {...commonProps} barGap={7}>
        {commonAxes}
        {selectedYears.map((year) => (
          <Bar
            key={year}
            dataKey={`y${year}`}
            fill={getYearColor(year)}
            name={`${year}`}
            radius={[4, 4, 0, 0]}
            barSize={22}
          />
        ))}
      </BarChart>
    );
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[450px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h3 className="text-lg font-bold text-slate-800">
          {yearComparisonTitle}
        </h3>

        <div
          className="flex flex-nowrap items-center gap-3 md:gap-4 overflow-x-auto pb-2 w-full md:w-auto custom-h-scrollbar"
          style={{ minWidth: 0 }}
        >
          <FilterSelect
            label="Zone"
            value={yearComparisonZone}
            onChange={(e) => setYearComparisonZone(e.target.value)}
            options={availableZones}
          />
          <FilterSelect
            label="Region"
            value={yearComparisonRegion}
            onChange={(e) => setYearComparisonRegion(e.target.value)}
            options={availableRegions}
          />
          <FilterSelect
            label="Month"
            value={yearComparisonMonth}
            onChange={(e) => setYearComparisonMonth(e.target.value)}
            options={availableMonths}
          />
          <FilterSelect
            label="Customer Type"
            value={yearComparisonCustomerType}
            onChange={(e) => setYearComparisonCustomerType(e.target.value)}
            options={availableCustomerTypes}
          />

          <div
            className="flex items-center gap-2 shrink-0"
            style={{ flexShrink: 0 }}
          >
            <span className="text-sm font-medium text-slate-400">Years</span>
            <div
              className="flex items-center gap-1.5 min-h-[32px] shrink-0"
              style={{ flexShrink: 0 }}
            >
              {isAvailableYearsLoading ? (
                <Loader2
                  className="w-4 h-4 text-slate-400 animate-spin mx-2 shrink-0"
                  style={{ flexShrink: 0 }}
                />
              ) : availableYears.length === 0 ? (
                <span
                  className="text-xs text-slate-400 mx-2 shrink-0"
                  style={{ flexShrink: 0 }}
                >
                  No years available
                </span>
              ) : (
                availableYears.map((year) => {
                  const isSelected = selectedYears.includes(year);
                  return (
                    <button
                      key={year}
                      onClick={() => toggleYear(year)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border shrink-0 ${
                        isSelected
                          ? "border-yellow-200 bg-yellow-50 text-yellow-700 shadow-sm"
                          : "border-transparent text-slate-500 hover:bg-slate-100"
                      }`}
                      style={{ flexShrink: 0 }}
                    >
                      {year}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div
            className="w-px h-6 bg-slate-200 hidden md:block shrink-0"
            style={{ flexShrink: 0 }}
          ></div>

          <div
            className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200 shrink-0"
            style={{ flexShrink: 0 }}
          >
            <button
              onClick={() => setChartType("column")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                chartType === "column"
                  ? "bg-yellow-100 text-yellow-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Column
            </button>
            <button
              onClick={() => setChartType("line")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                chartType === "line"
                  ? "bg-yellow-100 text-yellow-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              Line
            </button>
            <button
              onClick={() => setChartType("area")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                chartType === "area"
                  ? "bg-yellow-100 text-yellow-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <AreaChartIcon className="w-3.5 h-3.5" />
              Area
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {isYearComparisonLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : selectedYears.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 font-medium text-sm">
            Please select at least one year to view the comparison.
          </div>
        ) : yearComparisonData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 font-medium text-sm">
            No data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
