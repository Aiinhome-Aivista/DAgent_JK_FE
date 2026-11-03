import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart3,
  LineChart as LineChartIcon,
  AreaChart as AreaChartIcon,
  Loader2,
  AlertCircle,
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
  useSessionId,
  queuedFetch,
} from "./dashboardHooks";
import { defaultConfig, API_ENDPOINTS } from "@/src/services/api.config";

interface FilterOptionItem {
  label: string;
  value: string | number;
  zone_code?: string;
}

// Dynamic color palette for multi-year series comparison (no hardcoded year colors)
const DYNAMIC_PALETTE = [
  "#ef4444", // Red
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#6366f1", // Indigo
  "#14b8a6", // Teal
];

export const YearComparisonChartDynamic = ({ zone }: { zone?: string | null }) => {
  const sessionId = useSessionId();

  // Dynamic filter lists fetched from backend APIs (zero hardcoding)
  const [zonesList, setZonesList] = useState<FilterOptionItem[]>([]);
  const [regionsList, setRegionsList] = useState<FilterOptionItem[]>([]);
  const [customerTypesList, setCustomerTypesList] = useState<FilterOptionItem[]>([]);
  const [monthsList, setMonthsList] = useState<FilterOptionItem[]>([]);
  const [yearsList, setYearsList] = useState<FilterOptionItem[]>([]);

  // Selected filter states
  const [selectedZone, setSelectedZone] = useState<string>("ALL");
  const [selectedRegion, setSelectedRegion] = useState<string>("ALL");
  const [selectedCustomerType, setSelectedCustomerType] = useState<string>("ALL");
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");
  const [selectedYears, setSelectedYears] = useState<number[]>([]);

  // Chart and loading states
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isRegionLoading, setIsRegionLoading] = useState<boolean>(false);
  const [isCustomerTypeLoading, setIsCustomerTypeLoading] = useState<boolean>(false);
  const [isYearComparisonLoading, setIsYearComparisonLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [chartType, setChartType] = useState<"column" | "line" | "area">("column");
  const [yearComparisonData, setYearComparisonData] = useState<any[]>([]);
  const [yearComparisonTitle, setYearComparisonTitle] = useState("Year-wise Sales Comparison");
  const [yearComparisonAxisLabels, setYearComparisonAxisLabels] = useState({
    x: "Month",
    y: "Sales Value (₹)",
  });

  const effectiveZone = useMemo(() => {
    if (zone && zone.toLowerCase() !== "all") {
      return zone;
    }
    return selectedZone;
  }, [zone, selectedZone]);

  // Available numeric years from yearsList
  const numericAvailableYears = useMemo(() => {
    return yearsList
      .filter((y) => String(y.value).toUpperCase() !== "ALL")
      .map((y) => Number(y.value))
      .filter((y) => !isNaN(y))
      .sort((a, b) => b - a);
  }, [yearsList]);

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Initial Load: Fetch All Master Filters from API
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const fetchInitialFilters = async () => {
      if (!sessionId || sessionId === "null") {
        setIsInitialLoading(false);
        return;
      }
      setIsInitialLoading(true);
      try {
        const filterEndpoint =
          (API_ENDPOINTS.DASHBOARD as any).DYNAMIC_FILTERS ||
          "/api/dashboard/filters";
        const url = `${defaultConfig.baseUrl}${filterEndpoint}?session_id=${sessionId}`;

        const res = await fetch(url);
        const data = await res.json();

        if (isMounted && data && data.status === "success") {
          const fetchedZones = data.zones || [];
          const fetchedRegions = data.regions || [];
          const fetchedCustTypes = data.customer_types || [];
          const fetchedMonths = data.months || [];
          const fetchedYears = data.years || [];

          setZonesList(fetchedZones);
          setRegionsList(fetchedRegions);
          setCustomerTypesList(fetchedCustTypes);
          setMonthsList(fetchedMonths);
          setYearsList(fetchedYears);

          // By default, select all available numeric years for comparison
          const numYears = fetchedYears
            .filter((y: any) => String(y.value).toUpperCase() !== "ALL")
            .map((y: any) => Number(y.value))
            .filter((y: number) => !isNaN(y));
          if (numYears.length > 0) {
            setSelectedYears(numYears);
          }
        }
      } catch (err: any) {
        console.error("Failed to fetch initial filters:", err);
      } finally {
        if (isMounted) {
          setIsInitialLoading(false);
        }
      }
    };

    fetchInitialFilters();
    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Zone Change Handler (Zone -> Dependent Region & Customer Type)
  // ─────────────────────────────────────────────────────────────────────────
  const handleZoneChange = useCallback(
    async (newZone: string) => {
      setSelectedZone(newZone);
      setSelectedRegion("ALL");
      setSelectedCustomerType("ALL");
      setSelectedMonth("ALL");

      if (!sessionId || sessionId === "null") return;
      setIsRegionLoading(true);
      setIsCustomerTypeLoading(true);

      try {
        const baseUrl = defaultConfig.baseUrl;
        const regEp = (API_ENDPOINTS.DASHBOARD as any).REGIONS || "/api/dashboard/filters/regions";
        const custEp = (API_ENDPOINTS.DASHBOARD as any).CUSTOMER_TYPES || "/api/dashboard/filters/customer-types";

        const [regRes, custRes] = await Promise.all([
          fetch(`${baseUrl}${regEp}?session_id=${sessionId}&zone=${encodeURIComponent(newZone)}`),
          fetch(`${baseUrl}${custEp}?session_id=${sessionId}&zone=${encodeURIComponent(newZone)}&region=ALL`),
        ]);

        const regData = await regRes.json();
        const custData = await custRes.json();

        if (regData?.regions) setRegionsList(regData.regions);
        if (custData?.customer_types) setCustomerTypesList(custData.customer_types);
      } catch (err) {
        console.error("Error updating dependent filters for Zone:", err);
      } finally {
        setIsRegionLoading(false);
        setIsCustomerTypeLoading(false);
      }
    },
    [sessionId]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Region Change Handler (Region -> Dependent Customer Type)
  // ─────────────────────────────────────────────────────────────────────────
  const handleRegionChange = useCallback(
    async (newRegion: string) => {
      setSelectedRegion(newRegion);
      setSelectedCustomerType("ALL");
      setSelectedMonth("ALL");

      if (!sessionId || sessionId === "null") return;
      setIsCustomerTypeLoading(true);

      try {
        const baseUrl = defaultConfig.baseUrl;
        const custEp = (API_ENDPOINTS.DASHBOARD as any).CUSTOMER_TYPES || "/api/dashboard/filters/customer-types";

        const custRes = await fetch(
          `${baseUrl}${custEp}?session_id=${sessionId}&zone=${encodeURIComponent(effectiveZone)}&region=${encodeURIComponent(newRegion)}`
        );
        const custData = await custRes.json();

        if (custData?.customer_types) setCustomerTypesList(custData.customer_types);
      } catch (err) {
        console.error("Error updating dependent filters for Region:", err);
      } finally {
        setIsCustomerTypeLoading(false);
      }
    },
    [sessionId, effectiveZone]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Customer Type Change Handler
  // ─────────────────────────────────────────────────────────────────────────
  const handleCustomerTypeChange = useCallback((newCustType: string) => {
    setSelectedCustomerType(newCustType);
    setSelectedMonth("ALL");
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Month Change Handler
  // ─────────────────────────────────────────────────────────────────────────
  const handleMonthChange = useCallback((newMonth: string) => {
    setSelectedMonth(newMonth);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // 6. Year Toggle Handler (Pill toggle with instant render)
  // ─────────────────────────────────────────────────────────────────────────
  const toggleYear = useCallback(
    (year: number) => {
      setSelectedYears((prev) => {
        if (prev.includes(year)) {
          if (prev.length === 1) {
            // Keep at least one selected, or revert to all
            return numericAvailableYears;
          }
          return prev.filter((y) => y !== year);
        } else {
          return [...prev, year].sort((a, b) => b - a);
        }
      });
    },
    [numericAvailableYears]
  );

  const selectAllYears = useCallback(() => {
    setSelectedYears(numericAvailableYears);
  }, [numericAvailableYears]);

  // ─────────────────────────────────────────────────────────────────────────
  // 7. Fetch Year-wise Sales Comparison Data
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let isCancelled = false;

    const fetchSalesData = async () => {
      if (!sessionId || sessionId === "null") {
        setIsYearComparisonLoading(false);
        return;
      }
      if (selectedYears.length === 0 && numericAvailableYears.length === 0) {
        setIsYearComparisonLoading(false);
        return;
      }

      setIsYearComparisonLoading(true);
      setErrorMessage(null);

      try {
        const salesEndpoint =
          (API_ENDPOINTS.DASHBOARD as any).YEAR_WISE_SALES ||
          API_ENDPOINTS.DASHBOARD.YEAR_WISE_FILTER ||
          "/api/dashboard/year-wise-sales";

        const postBody = {
          session_id: sessionId,
          selected_zones: effectiveZone.toUpperCase() === "ALL" ? ["all"] : [effectiveZone],
          selected_regions: selectedRegion.toUpperCase() === "ALL" ? ["all"] : [selectedRegion],
          selected_customer_types: selectedCustomerType.toUpperCase() === "ALL" ? ["all"] : [selectedCustomerType],
          selected_months: selectedMonth.toUpperCase() === "ALL" ? ["all"] : [selectedMonth],
          selected_years: selectedYears.length > 0 ? selectedYears : ["all"],
        };

        const response = await queuedFetch(`${defaultConfig.baseUrl}${salesEndpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postBody),
        });

        const data = await response.json();

        if (isCancelled) return;

        if (data && data.visualization) {
          if (data.title) setYearComparisonTitle(data.title);
          if (data.xKey || data.yKey) {
            setYearComparisonAxisLabels({
              x: data.xKey ? data.xKey.charAt(0).toUpperCase() + data.xKey.slice(1) : "Month",
              y: data.yKey ? "Sales Value (₹)" : "Sales Value (₹)",
            });
          }

          // Pivot rows by month
          const monthMap: Record<string, any> = {};
          data.visualization.forEach((item: any) => {
            const m = String(item.month || "").toUpperCase().substring(0, 3);
            if (!m) return;
            if (!monthMap[m]) monthMap[m] = { month: m };
            const yr = String(item.year);
            const val = Number(item.sales_value || 0);
            monthMap[m][`y${yr}`] = val / 10000000; // in Crores
            monthMap[m][`sales_value_${yr}`] = val;
          });

          const MONTH_ORDER = [
            "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
            "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
          ];

          const pivoted = Object.values(monthMap).sort(
            (a: any, b: any) => MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month)
          );

          setYearComparisonData(pivoted);
        } else if (data?.status === "error") {
          setErrorMessage(data.message || "Failed to load sales data.");
          setYearComparisonData([]);
        } else {
          setYearComparisonData([]);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error("Failed to fetch year comparison sales data:", err);
          setErrorMessage(err.message || "Failed to load sales data.");
          setYearComparisonData([]);
        }
      } finally {
        if (!isCancelled) {
          setIsYearComparisonLoading(false);
        }
      }
    };

    fetchSalesData();

    return () => {
      isCancelled = true;
    };
  }, [
    sessionId,
    effectiveZone,
    selectedRegion,
    selectedCustomerType,
    selectedMonth,
    selectedYears,
    numericAvailableYears,
  ]);

  // Dynamic series years present in the current dataset or selected
  const activeSeriesYears = useMemo(() => {
    if (selectedYears.length > 0) {
      return [...selectedYears].sort();
    }
    return numericAvailableYears.sort();
  }, [selectedYears, numericAvailableYears]);

  const getSeriesColor = (year: number, index: number) => {
    return DYNAMIC_PALETTE[index % DYNAMIC_PALETTE.length];
  };

  const isAllYearsSelected =
    numericAvailableYears.length > 0 &&
    numericAvailableYears.every((y) => selectedYears.includes(y));

  // ─────────────────────────────────────────────────────────────────────────
  // Render Chart Types
  // ─────────────────────────────────────────────────────────────────────────
  const renderChart = () => {
    const commonProps = {
      data: yearComparisonData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    const commonAxes = (
      <>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: "#64748b" }}
          axisLine={{ stroke: "#cbd5e1" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#64748b" }}
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
            const originalVal = props.payload?.[`sales_value_${yearStr}`];
            if (originalVal !== undefined && originalVal !== null) {
              return [`₹${(Number(originalVal) / 10000000).toFixed(2)} Cr`, `Year ${name}`];
            }
            return [`₹${Number(value).toFixed(2)} Cr`, `Year ${name}`];
          }}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
      </>
    );

    if (chartType === "line") {
      return (
        <LineChart {...commonProps}>
          {commonAxes}
          {activeSeriesYears.map((year, idx) => (
            <Line
              key={year}
              type="monotone"
              dataKey={`y${year}`}
              stroke={getSeriesColor(year, idx)}
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
          {activeSeriesYears.map((year, idx) => {
            const color = getSeriesColor(year, idx);
            return (
              <Area
                key={year}
                type="monotone"
                dataKey={`y${year}`}
                stroke={color}
                fill={color}
                name={`${year}`}
                fillOpacity={0.25}
                strokeWidth={2}
              />
            );
          })}
        </AreaChart>
      );
    }

    return (
      <BarChart {...commonProps} barGap={6}>
        {commonAxes}
        {activeSeriesYears.map((year, idx) => (
          <Bar
            key={year}
            dataKey={`y${year}`}
            fill={getSeriesColor(year, idx)}
            name={`${year}`}
            radius={[4, 4, 0, 0]}
            barSize={20}
          />
        ))}
      </BarChart>
    );
  };

  const renderFilterSelect = (
    label: string,
    value: string | number,
    onChange: (e: any) => void,
    options: FilterOptionItem[],
    defaultLabel = "ALL",
    isLoading = false
  ) => (
    <div
      className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-50 transition-colors focus-within:border-slate-300 focus-within:shadow-sm"
      style={{ minWidth: "130px", flexShrink: 0 }}
    >
      <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
        {label}:
      </span>
      {isLoading ? (
        <div className="flex items-center gap-1 w-full py-0.5">
          <span className="text-xs text-slate-400">Loading...</span>
          <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0 ml-auto" />
        </div>
      ) : (
        <select
          value={value}
          onChange={onChange}
          className="text-xs font-medium text-slate-700 bg-transparent outline-none cursor-pointer w-full"
        >
          <option value="ALL">{defaultLabel}</option>
          {options
            .filter((opt) => String(opt.value).trim().toUpperCase() !== "ALL")
            .map((opt, idx) => (
              <option key={`${String(opt.value)}_${idx}`} value={opt.value}>
                {opt.label || opt.value}
              </option>
            ))}
        </select>
      )}
    </div>
  );

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[480px]">
      {/* Top Header & Dynamic Filters Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-slate-800 whitespace-nowrap">
            {yearComparisonTitle}
          </h3>
        </div>

        {/* Filters and Controls Bar: Single horizontal scrollable row without wrap */}
        <div className="flex flex-nowrap items-center gap-2.5 overflow-x-auto pb-2 w-full lg:w-auto custom-h-scrollbar">
          {/* 1. Zone Dropdown */}
          {renderFilterSelect("Zone", selectedZone, (e) => handleZoneChange(e.target.value), zonesList, "ALL", false)}

          {/* 2. Region Dropdown */}
          {renderFilterSelect("Region", selectedRegion, (e) => handleRegionChange(e.target.value), regionsList, "ALL", isRegionLoading)}

          {/* 3. Customer Type Dropdown */}
          {renderFilterSelect("Customer Type", selectedCustomerType, (e) => handleCustomerTypeChange(e.target.value), customerTypesList, "ALL", isCustomerTypeLoading)}

          {/* 4. Month Dropdown */}
          {renderFilterSelect("Month", selectedMonth, (e) => handleMonthChange(e.target.value), monthsList, "ALL", false)}

          {/* 5. Year Selector Pills (No ALL button - all available years active by default) */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 shrink-0">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
              Years:
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {numericAvailableYears.map((year) => {
                const isSelected = selectedYears.includes(year);
                return (
                  <button
                    key={year}
                    type="button"
                    onClick={() => toggleYear(year)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded transition-all border shrink-0 ${
                      isSelected
                        ? "border-amber-400 bg-amber-50 text-amber-900 shadow-xs"
                        : "border-transparent text-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    {year}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-px h-6 bg-slate-200 hidden md:block shrink-0"></div>

          {/* Chart Type Toggle */}
          <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200 shrink-0">
            <button
              onClick={() => setChartType("column")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                chartType === "column"
                  ? "bg-amber-100 text-amber-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Column
            </button>
            <button
              onClick={() => setChartType("line")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                chartType === "line"
                  ? "bg-amber-100 text-amber-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              Line
            </button>
            <button
              onClick={() => setChartType("area")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                chartType === "area"
                  ? "bg-amber-100 text-amber-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <AreaChartIcon className="w-3.5 h-3.5" />
              Area
            </button>
          </div>
        </div>
      </div>

      {/* Main Chart Body */}
      <div className="flex-1 min-h-0 relative">
        {isInitialLoading || isYearComparisonLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="text-xs text-slate-400 font-medium">
              Loading sales comparison data...
            </span>
          </div>
        ) : errorMessage ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 font-medium text-sm gap-2">
            <AlertCircle className="w-6 h-6 text-amber-500" />
            <span>{errorMessage}</span>
          </div>
        ) : selectedYears.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 font-medium text-sm">
            Please select at least one year to view comparison.
          </div>
        ) : yearComparisonData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 font-medium text-sm gap-1">
            <span>No sales data found matching the selected criteria.</span>
            <span className="text-xs text-slate-400">
              Try choosing &quot;ALL&quot; or selecting different filter options.
            </span>
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
