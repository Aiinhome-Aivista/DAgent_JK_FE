import { queuedFetch, useAvailableYears } from "./dashboardHooks";
import React, { useState, useEffect, useRef, useMemo } from "react";
import toast from "react-hot-toast";
import { RefreshCw, Calendar, ChevronDown, ChevronLeft, ChevronRight, RotateCcw, X } from "lucide-react";
import { defaultConfig } from "@/src/services/api.config";

interface FilterParams {
  year?: string;
  month?: number;
  months?: number[];
  start_date?: string;
  end_date?: string;
}

export const DashboardKPIs = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState({ question: "", answer: "" });
  const [metrics, setMetrics] = useState([
    {
      label: "Total Sales Revenue",
      value: "",
      subtext: "",
    },
    {
      label: "Top Performing Tyre",
      value: "",
      subtext: "",
    },
    {
      label: "Leading Region",
      value: "",
      subtext: "",
    },
    {
      label: "Year-Over-Year",
      value: "",
      subtext: "",
    },
  ]);

  // Dynamic filters from backend API /available-years
  const { availableYears, availableMonths } = useAvailableYears();

  const dynamicYears = useMemo(() => {
    const list = (availableYears || [])
      .map((y: any) => {
        const val = typeof y === "object" && y !== null ? (y.value ?? y.label) : y;
        return String(val).trim();
      })
      .filter((y: string) => y && y.toUpperCase() !== "ALL");

    const unique = Array.from(new Set(list));
    unique.sort((a, b) => (parseInt(b, 10) || 0) - (parseInt(a, 10) || 0));
    return unique;
  }, [availableYears]);

  const dynamicMonths = useMemo(() => {
    const list = (availableMonths || [])
      .filter((m: any) => {
        const val = typeof m === "object" && m !== null ? (m.value ?? m.label) : m;
        return String(val).trim().toUpperCase() !== "ALL";
      })
      .map((m: any, idx: number) => {
        if (typeof m === "object" && m !== null) {
          const num = typeof m.value === "number" ? m.value : parseInt(m.value, 10) || idx + 1;
          const name = String(m.label || m.name || m.value);
          return { num, name };
        }
        return { num: idx + 1, name: String(m) };
      });

    return list.length > 0
      ? list
      : [
          { num: 1, name: "Jan" },
          { num: 2, name: "Feb" },
          { num: 3, name: "Mar" },
          { num: 4, name: "Apr" },
          { num: 5, name: "May" },
          { num: 6, name: "Jun" },
          { num: 7, name: "Jul" },
          { num: 8, name: "Aug" },
          { num: 9, name: "Sep" },
          { num: 10, name: "Oct" },
          { num: 11, name: "Nov" },
          { num: 12, name: "Dec" },
        ];
  }, [availableMonths]);

  // Filter & Calendar States
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<"month" | "range">("month");
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [activeFilterLabel, setActiveFilterLabel] = useState<string | null>(null);
  const [isFilterActive, setIsFilterActive] = useState(false);

  // Custom Date Picker Popup State (for Date Range tab - 100% dynamic without browser 2022/2023)
  const [activePicker, setActivePicker] = useState<"start" | "end" | null>(null);
  const [pickerYear, setPickerYear] = useState<string>("2026");
  const [pickerMonth, setPickerMonth] = useState<number>(11);

  // Sync selectedYear & pickerYear with latest available dynamic year once loaded
  useEffect(() => {
    if (dynamicYears.length > 0) {
      if (!selectedYear || !dynamicYears.includes(selectedYear)) {
        setSelectedYear(dynamicYears[0]);
      }
      if (!pickerYear || !dynamicYears.includes(pickerYear)) {
        setPickerYear(dynamicYears[0]);
      }
    }
  }, [dynamicYears, selectedYear, pickerYear]);

  const handlePrevPickerMonth = () => {
    if (pickerMonth === 1) {
      const yrIdx = dynamicYears.indexOf(pickerYear);
      if (yrIdx !== -1 && yrIdx < dynamicYears.length - 1) {
        setPickerYear(dynamicYears[yrIdx + 1]);
        setPickerMonth(12);
      }
    } else {
      setPickerMonth((prev) => prev - 1);
    }
  };

  const handleNextPickerMonth = () => {
    if (pickerMonth === 12) {
      const yrIdx = dynamicYears.indexOf(pickerYear);
      if (yrIdx > 0) {
        setPickerYear(dynamicYears[yrIdx - 1]);
        setPickerMonth(1);
      }
    } else {
      setPickerMonth((prev) => prev + 1);
    }
  };

  const handlePickerDaySelect = (day: number) => {
    const yr = pickerYear || (dynamicYears[0] ?? "2026");
    const mStr = String(pickerMonth).padStart(2, "0");
    const dStr = String(day).padStart(2, "0");
    const chosen = `${yr}-${mStr}-${dStr}`;

    if (activePicker === "start") {
      setStartDate(chosen);
      if (endDate && chosen > endDate) {
        setEndDate("");
      }
      setActivePicker("end");
    } else if (activePicker === "end") {
      if (startDate && chosen < startDate) {
        setEndDate(startDate);
        setStartDate(chosen);
      } else {
        setEndDate(chosen);
      }
      setActivePicker(null);
    }
  };

  const activeFilterRef = useRef<FilterParams | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close calendar popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    if (isCalendarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCalendarOpen]);

  const formatSyncTime = (timeStr: string | null) => {
    if (!timeStr) return "";
    try {
      const clean = timeStr.replace(" GMT", "").trim();
      const parts = clean.split(" ");
      const timePart = parts.length > 1 ? parts[parts.length - 1] : parts[0];
      if (timePart.includes(":")) {
        const [h, m] = timePart.split(":");
        const hour = parseInt(h, 10);
        if (!isNaN(hour)) {
          const ampm = hour >= 12 ? "PM" : "AM";
          const displayHour = hour % 12 || 12;
          return `${displayHour.toString().padStart(2, "0")}:${m} ${ampm}`;
        }
      }
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return timeStr.split(" ")[1] || timeStr;
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return timeStr;
    }
  };

  const getSessionId = () =>
    localStorage.getItem("DAgent_session_id") ||
    localStorage.getItem("chatSessionId") ||
    "";

  const fetchMetrics = async (question: string, answer: string) => {
    setIsLoading(true);
    try {
      const response = await queuedFetch(`${defaultConfig.baseUrl}/graph-metrics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question, answer }),
      });
      const data = await response.json();
      if (data.status === "success" && data.data) {
        if (Object.keys(data.data).length > 0) {
          const sortedKeys = Object.keys(data.data).sort((a, b) => {
            const numA = parseInt(a.replace(/\D/g, "")) || 0;
            const numB = parseInt(b.replace(/\D/g, "")) || 0;
            return numA - numB;
          });
          const sortedMetrics = sortedKeys
            .map((k) => data.data[k])
            .filter(Boolean) as Array<{
            label?: string;
            name?: string;
            value?: string;
            revenue?: string;
            change?: string;
            subtext?: string;
          }>;

          setMetrics(
            sortedMetrics.map((m, i) => ({
              label: m.label ?? "Metric " + (i + 1),
              value: m.value ?? m.revenue ?? m.change ?? "N/A",
              subtext: m.subtext ?? m.name ?? "",
            }))
          );
        }
      }
    } catch (error) {
      console.error("Failed to fetch graph metrics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDefaultMetrics = async (
    sessionId: string,
    forceRefresh: boolean = false,
    filter?: FilterParams | null
  ) => {
    setIsLoading(true);
    try {
      const url = `${defaultConfig.baseUrl}/default-dashboard-metrics`;
      const payload: Record<string, any> = {
        session_id: sessionId,
        force_refresh: forceRefresh,
      };

      if (filter) {
        if (filter.year) payload.year = filter.year;
        if (filter.months && filter.months.length > 0) {
          payload.months = filter.months;
          if (filter.months.length === 1) payload.month = filter.months[0];
        } else if (filter.month) {
          payload.month = filter.month;
        }
        if (filter.start_date) payload.start_date = filter.start_date;
        if (filter.end_date) payload.end_date = filter.end_date;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.status === "success" && data.data) {
        if (data._last_synced_at) {
          setLastSyncedTime(data._last_synced_at);
        }
        if (Object.keys(data.data).length > 0) {
          const sortedKeys = Object.keys(data.data).sort((a, b) => {
            const numA = parseInt(a.replace(/\D/g, "")) || 0;
            const numB = parseInt(b.replace(/\D/g, "")) || 0;
            return numA - numB;
          });
          const sortedMetrics = sortedKeys
            .map((k) => data.data[k])
            .filter(Boolean) as Array<{
            label?: string;
            value?: string;
            subtext?: string;
          }>;

          setMetrics(
            sortedMetrics.map((m, i) => ({
              label: m.label ?? "Metric " + (i + 1),
              value: m.value ?? "N/A",
              subtext: m.subtext ?? "",
            }))
          );
        }
      } else if (data.status === "error") {
        toast.error(
          data.message || data.details || "Failed to fetch default metrics"
        );
      }
    } catch (error) {
      console.error("Failed to fetch default metrics:", error);
      toast.error("Failed to fetch default metrics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const sessionId = getSessionId();
    fetchDefaultMetrics(sessionId, false);

    const handleSessionIdUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.sessionId) {
        fetchDefaultMetrics(
          customEvent.detail.sessionId,
          false,
          activeFilterRef.current
        );
      }
    };

    window.addEventListener("session-id-updated", handleSessionIdUpdated);
    return () => {
      window.removeEventListener("session-id-updated", handleSessionIdUpdated);
    };
  }, []);

  useEffect(() => {
    const handleChatMetricsUpdate = (event: CustomEvent) => {
      const { question, answer } = event.detail;
      setLastQuery({ question, answer });
      fetchMetrics(question, answer);
    };

    window.addEventListener(
      "chat-metrics-update",
      handleChatMetricsUpdate as EventListener
    );
    return () => {
      window.removeEventListener(
        "chat-metrics-update",
        handleChatMetricsUpdate as EventListener
      );
    };
  }, []);

  const handleRefresh = () => {
    const sessionId = getSessionId();
    if (sessionId) {
      fetchDefaultMetrics(sessionId, true, activeFilterRef.current);
    } else {
      toast.error("No active session ID found.");
    }
  };

  // Toggle Month in multi-select
  const toggleMonth = (mNum: number) => {
    setSelectedMonths((prev) =>
      prev.includes(mNum) ? prev.filter((m) => m !== mNum) : [...prev, mNum]
    );
  };

  // Quick Quarter selection
  const handleSelectQuarter = (qMonths: number[], qName: string) => {
    setSelectedMonths(qMonths);
    handleApplyMonthFilter(qMonths, qName);
  };

  // Apply Month / Year Filter (Supports single month, multi-months, and full year)
  const handleApplyMonthFilter = (customMonths?: number[], customLabel?: string) => {
    const targetMonths = customMonths !== undefined ? customMonths : selectedMonths;
    const sessionId = getSessionId();
    if (!sessionId) {
      toast.error("No active session ID found.");
      return;
    }

    let filter: FilterParams = {};
    let label = "";

    if (customLabel) {
      label = `${customLabel} ${selectedYear}`;
      filter = { year: selectedYear, months: targetMonths };
      if (targetMonths.length === 1) filter.month = targetMonths[0];
    } else if (targetMonths && targetMonths.length > 0) {
      const sorted = [...targetMonths].sort((a, b) => a - b);
      if (sorted.length === 1) {
        filter = { year: selectedYear, month: sorted[0], months: sorted };
        const mObj = dynamicMonths.find((m) => m.num === sorted[0]);
        label = `${mObj?.name || sorted[0]} ${selectedYear}`;
      } else {
        filter = { year: selectedYear, months: sorted };
        const jsonStr = JSON.stringify(sorted);
        if (jsonStr === JSON.stringify([1, 2, 3])) {
          label = `Q1 (Jan-Mar) ${selectedYear}`;
        } else if (jsonStr === JSON.stringify([4, 5, 6])) {
          label = `Q2 (Apr-Jun) ${selectedYear}`;
        } else if (jsonStr === JSON.stringify([7, 8, 9])) {
          label = `Q3 (Jul-Sep) ${selectedYear}`;
        } else if (jsonStr === JSON.stringify([10, 11, 12])) {
          label = `Q4 (Oct-Dec) ${selectedYear}`;
        } else {
          const names = sorted.map((num) => dynamicMonths.find((m) => m.num === num)?.name || num);
          label = `${names.slice(0, 3).join(", ")}${names.length > 3 ? "..." : ""} ${selectedYear}`;
        }
      }
    } else {
      // Full Year selected
      filter = { year: selectedYear };
      label = `Year ${selectedYear}`;
    }

    activeFilterRef.current = filter;
    setIsFilterActive(true);
    setActiveFilterLabel(label);
    setIsCalendarOpen(false);
    fetchDefaultMetrics(sessionId, false, filter);
  };

  // Allowed Date Boundaries (100% dynamic from API dynamicYears)
  const minAllowedYear = dynamicYears.length > 0 ? dynamicYears[dynamicYears.length - 1] : "";
  const maxAllowedYear = dynamicYears.length > 0 ? dynamicYears[0] : "";
  const minAllowedDate = minAllowedYear ? `${minAllowedYear}-01-01` : undefined;
  const maxAllowedDate = maxAllowedYear ? `${maxAllowedYear}-12-31` : undefined;

  // Apply Custom Date Range Filter
  const handleApplyDateRangeFilter = () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates.");
      return;
    }
    if (startDate > endDate) {
      toast.error("Start date cannot be after end date.");
      return;
    }
    if (minAllowedDate && startDate < minAllowedDate) {
      toast.error(`Please select a date from ${minAllowedYear} onwards.`);
      return;
    }
    if (maxAllowedDate && endDate > maxAllowedDate) {
      toast.error(`Please select a date up to ${maxAllowedYear}.`);
      return;
    }
    const sessionId = getSessionId();
    if (!sessionId) {
      toast.error("No active session ID found.");
      return;
    }

    const filter: FilterParams = { start_date: startDate, end_date: endDate };
    const label = `${startDate} to ${endDate}`;

    activeFilterRef.current = filter;
    setIsFilterActive(true);
    setActiveFilterLabel(label);
    setIsCalendarOpen(false);
    fetchDefaultMetrics(sessionId, false, filter);
  };

  // Reset Filter back to default lifetime metrics
  const handleResetFilter = () => {
    activeFilterRef.current = null;
    setIsFilterActive(false);
    setActiveFilterLabel(null);
    setSelectedMonths([]);
    setStartDate("");
    setEndDate("");
    setIsCalendarOpen(false);

    const sessionId = getSessionId();
    if (sessionId) {
      fetchDefaultMetrics(sessionId, false, null);
    }
  };

  const renderSkeleton = () => (
    <div className="flex flex-col gap-2 w-full flex-1 min-h-0 overflow-y-auto pr-1">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="bg-white p-[14px] rounded-xl border border-slate-200 shadow-xs flex flex-col gap-2 shrink-0 animate-pulse"
        >
          <div className="h-2.5 bg-slate-200 rounded w-24"></div>
          <div className="min-w-0 flex flex-col gap-1.5 my-0.5">
            <div className="h-5 bg-slate-300 rounded w-28"></div>
            <div className="h-2 bg-slate-200 rounded w-32"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-2.5 w-full h-full">
      {/* Header */}
      <div className="flex justify-between items-center px-1 shrink-0">
        <div className="flex flex-col">
          <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">
            Key Metrics
          </h3>
          {lastSyncedTime && (
            <span
              className="text-[9px] font-semibold text-slate-900 mt-0.5"
              title={`Synced: ${lastSyncedTime}`}
            >
              Synced: {formatSyncTime(lastSyncedTime)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {isFilterActive && (
            <button
              onClick={handleResetFilter}
              className="p-1 rounded-md border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 shadow-2xs transition-all flex items-center gap-1 text-[10px] font-semibold px-1.5 cursor-pointer"
              title="Reset to default metrics"
            >
              <RotateCcw className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />
              <span>Reset</span>
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className={`p-1.5 rounded-lg border transition-all duration-200 cursor-pointer flex items-center justify-center ${
              isLoading
                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm ring-2 ring-indigo-200"
                : "bg-white border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 shadow-xs active:scale-95"
            }`}
            title="Refresh Metrics"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isLoading ? "animate-spin text-white" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Calendar Filter Dropdown Control */}
      <div className="relative px-0.5 shrink-0" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsCalendarOpen(!isCalendarOpen)}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
            isFilterActive
              ? "bg-indigo-50/90 border-indigo-300 text-indigo-700 shadow-xs"
              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 shadow-2xs"
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <Calendar
              className={`w-3.5 h-3.5 shrink-0 ${
                isFilterActive ? "text-indigo-600" : "text-slate-400"
              }`}
            />
            <span className="truncate text-[11px] font-medium">
              {activeFilterLabel || "Filter by Date / Period"}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-1">
            {isFilterActive && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetFilter();
                }}
                className="p-0.5 hover:bg-indigo-200/60 rounded text-indigo-600 transition-colors"
                title="Clear filter"
              >
                <X className="w-3 h-3" />
              </span>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isCalendarOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {/* Dropdown Popover */}
        {isCalendarOpen && (
          <div className="absolute top-full left-0 right-0 w-full mt-1.5 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-2 text-slate-700 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-100">
            {/* Mode Switcher */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-[10px] font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setFilterMode("month")}
                className={`flex-1 py-1 rounded-md text-center transition-all ${
                  filterMode === "month"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "hover:text-slate-900"
                }`}
              >
                Month / Year
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("range")}
                className={`flex-1 py-1 rounded-md text-center transition-all ${
                  filterMode === "range"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "hover:text-slate-900"
                }`}
              >
                Date Range
              </button>
            </div>

            {filterMode === "month" ? (
              <div className="flex flex-col gap-2">
                {/* Dynamic Year Select Pills */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Select Year
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {dynamicYears.map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setSelectedYear(yr)}
                        className={`py-1 text-xs font-semibold rounded-md border text-center transition-all ${
                          selectedYear === yr
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quarter Shortcuts */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Quarter Shortcuts
                  </span>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { name: "Q1", label: "Q1 (Jan-Mar)", months: [1, 2, 3] },
                      { name: "Q2", label: "Q2 (Apr-Jun)", months: [4, 5, 6] },
                      { name: "Q3", label: "Q3 (Jul-Sep)", months: [7, 8, 9] },
                      { name: "Q4", label: "Q4 (Oct-Dec)", months: [10, 11, 12] },
                    ].map((q) => {
                      const isQActive =
                        JSON.stringify([...selectedMonths].sort((a, b) => a - b)) ===
                        JSON.stringify(q.months);
                      return (
                        <button
                          key={q.name}
                          type="button"
                          onClick={() => handleSelectQuarter(q.months, q.name)}
                          className={`py-1 text-[10px] font-semibold rounded-md border text-center transition-all cursor-pointer ${
                            isQActive
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {q.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dynamic Month Grid (Multi-Select) */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Select Month(s)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMonths([]);
                        handleApplyMonthFilter([]);
                      }}
                      className="text-[10px] text-indigo-600 hover:underline font-semibold cursor-pointer"
                    >
                      Entire Year
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {dynamicMonths.map((m) => {
                      const isSelected = selectedMonths.includes(m.num);
                      return (
                        <button
                          key={m.num}
                          type="button"
                          onClick={() => toggleMonth(m.num)}
                          className={`py-1 text-[10px] font-medium rounded-md border text-center transition-all cursor-pointer ${
                            isSelected
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-xs font-semibold"
                              : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/50"
                          }`}
                        >
                          {m.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Apply Selected Months Button */}
                <button
                  type="button"
                  onClick={() => handleApplyMonthFilter()}
                  className="w-full mt-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md shadow-xs transition-colors cursor-pointer text-center"
                >
                  {selectedMonths.length === 0
                    ? `Apply Entire Year ${selectedYear}`
                    : selectedMonths.length === 1
                    ? `Apply ${dynamicMonths.find((m) => m.num === selectedMonths[0])?.name || ""} ${selectedYear}`
                    : `Apply Filter (${selectedMonths.length} Months)`}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {/* Start Date Button / Field */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Start Date
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setActivePicker(activePicker === "start" ? null : "start");
                      if (startDate) {
                        const [y, m] = startDate.split("-");
                        if (y) setPickerYear(y);
                        if (m) setPickerMonth(parseInt(m, 10));
                      }
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md border transition-all cursor-pointer ${
                      activePicker === "start"
                        ? "border-indigo-500 ring-1 ring-indigo-200 bg-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className={startDate ? "text-slate-800 font-semibold" : "text-slate-400 font-normal"}>
                      {startDate || "YYYY-MM-DD"}
                    </span>
                    <Calendar className={`w-3.5 h-3.5 ${activePicker === "start" ? "text-indigo-600" : "text-slate-400"}`} />
                  </button>
                </div>

                {/* End Date Button / Field */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    End Date
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setActivePicker(activePicker === "end" ? null : "end");
                      if (endDate) {
                        const [y, m] = endDate.split("-");
                        if (y) setPickerYear(y);
                        if (m) setPickerMonth(parseInt(m, 10));
                      }
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md border transition-all cursor-pointer ${
                      activePicker === "end"
                        ? "border-indigo-500 ring-1 ring-indigo-200 bg-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className={endDate ? "text-slate-800 font-semibold" : "text-slate-400 font-normal"}>
                      {endDate || "YYYY-MM-DD"}
                    </span>
                    <Calendar className={`w-3.5 h-3.5 ${activePicker === "end" ? "text-indigo-600" : "text-slate-400"}`} />
                  </button>
                </div>

                {/* Custom Interactive Calendar */}
                {activePicker && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 flex flex-col gap-1.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between px-0.5">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase">
                        Pick {activePicker === "start" ? "Start Date" : "End Date"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActivePicker(null)}
                        className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Month / Year Selectors */}
                    <div className="flex items-center justify-between gap-1 w-full">
                      <button
                        type="button"
                        onClick={handlePrevPickerMonth}
                        className="p-1 -ml-0.5 hover:bg-slate-200/80 rounded-md text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer shrink-0"
                        title="Previous Month"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <div className="flex-1 flex items-center justify-center gap-1.5 min-w-0">
                        {/* Month Select */}
                        <div className="flex-1 min-w-0">
                          <select
                            value={pickerMonth}
                            onChange={(e) => setPickerMonth(Number(e.target.value))}
                            className="w-full bg-white border border-slate-200 hover:border-indigo-300 rounded-md py-1 px-1 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none text-center shadow-2xs"
                          >
                            {dynamicMonths.map((m) => {
                              const shortName = m.name.length > 3 ? m.name.slice(0, 3) : m.name;
                              return (
                                <option key={m.num} value={m.num}>
                                  {shortName}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* Year Select */}
                        <div className="flex-1 min-w-0">
                          <select
                            value={pickerYear}
                            onChange={(e) => setPickerYear(e.target.value)}
                            className="w-full bg-white border border-slate-200 hover:border-indigo-300 rounded-md py-1 px-1 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none text-center shadow-2xs"
                          >
                            {dynamicYears.map((yr) => (
                              <option key={yr} value={yr}>
                                {yr}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleNextPickerMonth}
                        className="p-1 -mr-0.5 hover:bg-slate-200/80 rounded-md text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer shrink-0"
                        title="Next Month"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Weekday Labels */}
                    <div className="grid grid-cols-7 gap-0.5 text-center text-[9px] font-bold text-slate-400 py-0.5 border-b border-slate-200/60">
                      <span>Su</span>
                      <span>Mo</span>
                      <span>Tu</span>
                      <span>We</span>
                      <span>Th</span>
                      <span>Fr</span>
                      <span>Sa</span>
                    </div>

                    {/* Day Grid */}
                    <div className="grid grid-cols-7 gap-0.5">
                      {(() => {
                        const yrNum = parseInt(pickerYear || "2026", 10) || 2026;
                        const daysInMonth = new Date(yrNum, pickerMonth, 0).getDate();
                        const firstDayOfWeek = new Date(yrNum, pickerMonth - 1, 1).getDay();

                        return (
                          <>
                            {[...Array(firstDayOfWeek)].map((_, i) => (
                              <div key={`empty-${i}`} className="h-6" />
                            ))}
                            {[...Array(daysInMonth)].map((_, i) => {
                              const day = i + 1;
                              const mStr = String(pickerMonth).padStart(2, "0");
                              const dStr = String(day).padStart(2, "0");
                              const dateStr = `${pickerYear}-${mStr}-${dStr}`;

                              const isStart = startDate === dateStr;
                              const isEnd = endDate === dateStr;
                              const isInRange = Boolean(
                                startDate && endDate && dateStr > startDate && dateStr < endDate
                              );

                              return (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => handlePickerDaySelect(day)}
                                  className={`h-6 text-[10px] font-medium rounded transition-all cursor-pointer flex items-center justify-center ${
                                    isStart || isEnd
                                      ? "bg-indigo-600 text-white font-bold shadow-xs scale-105 z-10"
                                      : isInRange
                                      ? "bg-indigo-100 text-indigo-800 rounded-none font-semibold"
                                      : "text-slate-700 hover:bg-slate-200/60"
                                  }`}
                                >
                                  {day}
                                </button>
                              );
                            })}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                <div className="flex gap-1.5 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={!startDate || !endDate}
                    onClick={handleApplyDateRangeFilter}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md shadow-xs transition-colors text-center cursor-pointer ${
                      startDate && endDate
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    Apply Range
                  </button>
                </div>
              </div>
            )}

            {/* Popover Footer: Reset Option */}
            {isFilterActive && (
              <div className="pt-1 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[10px] text-slate-400">Filter is active</span>
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="text-[10px] font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                >
                  Clear & Reset
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Metrics List or Skeleton */}

      {isLoading ? (
        renderSkeleton()
      ) : (
        <div className="flex flex-col gap-2 w-full flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="bg-white p-[14px] rounded-xl border border-slate-200 shadow-xs flex flex-col justify-center gap-1.5 shrink-0 hover:border-indigo-200 hover:shadow-sm transition-all duration-150"
            >
                <p
                  className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 truncate"
                  title={metric.label}
                >
                  {metric.label}
                </p>
                <div className="min-w-0">
                  <h3 className="text-[1.15rem] font-black text-slate-800 leading-tight my-0.5 uppercase truncate">
                    {(() => {
                      let formattedVal: React.ReactNode = "";
                      const nonCurrencyMetrics = [
                        "Billing Scope",
                        "Dealer Spread",
                        "Attrition",
                        "New Dealer",
                        "Rotation",
                      ];

                      if (
                        typeof metric.value === "string" &&
                        /^\s*[\d,.]+/.test(metric.value) &&
                        !metric.value.includes("₹") &&
                        !metric.value.includes("%") &&
                        !nonCurrencyMetrics.includes(metric.label)
                      ) {
                        formattedVal = `₹${metric.value.replace(/\$/g, "").trim()}`;
                      } else if (typeof metric.value === "string") {
                        formattedVal = metric.value.replace(/\$/g, "₹");
                      } else if (typeof metric.value === "number") {
                        formattedVal = nonCurrencyMetrics.includes(metric.label)
                          ? String(metric.value)
                          : `₹${metric.value}`;
                      } else {
                        return metric.value as React.ReactNode;
                      }

                      if (typeof formattedVal === "string") {
                        const parts = formattedVal.split(/\b(CR|Cr|cr)\b/i);
                        return parts.map((part, pIdx) => {
                          if (/^(CR|Cr|cr)$/i.test(part)) {
                            return (
                              <span key={pIdx}>
                                C<span className="lowercase">r</span>
                              </span>
                            );
                          }
                          return (
                            <React.Fragment key={pIdx}>{part}</React.Fragment>
                          );
                        });
                      }
                      return formattedVal;
                    })()}
                  </h3>
                  <p
                    className="text-[9px] text-slate-400 mt-0.5 truncate"
                    title={metric.subtext}
                  >
                    {metric.subtext}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

