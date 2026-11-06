import React, { useState, useEffect } from "react";
import { defaultConfig, API_ENDPOINTS } from "@/src/services/api.config";
import { useSessionId, queuedFetch } from "./dashboardHooks";
import { Loader2, Download, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import { apiService } from "@/src/services/api.service";

const TABS = [
  { id: "s1", label: "Sheet 1", title: "Domestic Sales Value Achievement" },
  { id: "s2", label: "Sheet 2", title: "Sales Number's" },
  { id: "s3", label: "Sheet 3", title: "Sales Report by Values" },
  { id: "s4", label: "Sheet 4", title: "Sales Summary in No's & Values" },
];

interface DomesticSalesRow {
  market_segment: string;
  prev_year_actual_month: number;
  prev_year_actual_mtd: number;
  target: number;
  actual: number;
  achievement_pct: number;
  sale_for_the_day: number;
  growth_over_lysmt: number;
  is_total?: boolean;
}

interface SalesReportByValuesRow {
  zone: string;
  prev_4w: number;
  prev_23w: number;
  prev_total: number;
  target_4w: number;
  target_23w: number;
  target_total: number;
  actual_4w: number;
  actual_23w: number;
  actual_total: number;
  achievement_pct: number;
  sale_for_the_day: number;
  asking_rate: number;
  achvt_4w: number;
  achvt_23w: number;
  achvt_total: number;
  is_total?: boolean;
}

interface SalesNumbersRow {
  category: string;
  prev_year_act: number;
  target: number;
  total: number;
  achievement_pct: number;
  today: number;
  dealer: number;
  distributor: number;
  fleet: number;
  others: number;
  oem_target: number;
  oem_actual: number;
  stu_target: number;
  stu_actual: number;
  def_target: number;
  def_actual: number;
  domestic_target: number;
  domestic_actual: number;
  domestic_achv_pct: number;
  is_total?: boolean;
}

interface MetaInfo {
  month_abbr: string;
  prev_year_label: string;
  curr_year_label: string;
  day_label: string;
}

interface MonthItem {
  month_no: number;
  month_name: string;
}

const DEFAULT_MONTHS: MonthItem[] = [
  { month_no: 1, month_name: "JAN" },
  { month_no: 2, month_name: "FEB" },
  { month_no: 3, month_name: "MAR" },
  { month_no: 4, month_name: "APR" },
  { month_no: 5, month_name: "MAY" },
  { month_no: 6, month_name: "JUN" },
  { month_no: 7, month_name: "JUL" },
  { month_no: 8, month_name: "AUG" },
  { month_no: 9, month_name: "SEP" },
  { month_no: 10, month_name: "OCT" },
  { month_no: 11, month_name: "NOV" },
  { month_no: 12, month_name: "DEC" },
];

const fmtNum = (v: number | undefined | null) => {
  if (v === undefined || v === null) return "0.00";
  return Number(v).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const fmtCell = (v: number | undefined | null) => {
  if (v === undefined || v === null || Number(v) === 0) return "";
  return Number(v).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const DomesticSalesValueAchievementCard = () => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const activeTab = TABS[activeTabIndex].id;

  // Dedicated Sheet 1 state
  const [sheet1Data, setSheet1Data] = useState<DomesticSalesRow[]>([]);
  const [months, setMonths] = useState<MonthItem[]>(DEFAULT_MONTHS);
  const [selectedMonthNo, setSelectedMonthNo] = useState<number>(11);
  const [meta, setMeta] = useState<MetaInfo>({
    month_abbr: "Nov",
    prev_year_label: "Nov-25 Actual",
    curr_year_label: "Actual Sale for Nov-26",
    day_label: "Sale for day",
  });
  const [isSheet1Loading, setIsSheet1Loading] = useState<boolean>(true);

  // Dedicated Sheet 2 state (Sales Number's)
  const [sheet2Data, setSheet2Data] = useState<SalesNumbersRow[]>([]);
  const [isSheet2Loading, setIsSheet2Loading] = useState<boolean>(false);

  // Dedicated Sheet 3 state (Sales Report by Values)
  const [sheet3Data, setSheet3Data] = useState<SalesReportByValuesRow[]>([]);
  const [isSheet3Loading, setIsSheet3Loading] = useState<boolean>(false);

  // Sheets 2 & 4 fallback preview state
  const [previewData, setPreviewData] = useState<Record<string, any> | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const sessionId = useSessionId();

  // Fetch dedicated Sheet 1 data
  const fetchSheet1Data = async (monthOverride?: number) => {
    setIsSheet1Loading(true);
    try {
      if (!sessionId || sessionId === "null") {
        setIsSheet1Loading(false);
        return;
      }

      const activeMo = monthOverride !== undefined ? monthOverride : selectedMonthNo;
      let url = `${defaultConfig.baseUrl}${API_ENDPOINTS.DASHBOARD.DOMESTIC_SALES_VALUE_ACHIEVEMENT}?session_id=${sessionId}`;
      if (activeMo) {
        url += `&month=${encodeURIComponent(activeMo)}`;
      }

      const response = await queuedFetch(url);
      const json = await response.json();

      if (json.status === "success" && json.data) {
        setSheet1Data(json.data);
        if (json.months && Array.isArray(json.months)) {
          setMonths(json.months);
        }
        if (json.selected_month) {
          setSelectedMonthNo(json.selected_month);
        }
        if (json.meta) {
          setMeta(json.meta);
        }
      } else {
        setSheet1Data([]);
      }
    } catch (e) {
      console.error("Error fetching domestic sales value achievement", e);
      setSheet1Data([]);
    } finally {
      setIsSheet1Loading(false);
    }
  };

  // Fetch dedicated Sheet 2 data (Sales Number's)
  const fetchSheet2Data = async (monthOverride?: number) => {
    setIsSheet2Loading(true);
    try {
      if (!sessionId || sessionId === "null") {
        setIsSheet2Loading(false);
        return;
      }

      const activeMo = monthOverride !== undefined ? monthOverride : selectedMonthNo;
      let url = `${defaultConfig.baseUrl}${API_ENDPOINTS.DASHBOARD.SALES_NUMBERS_REPORT}?session_id=${sessionId}`;
      if (activeMo) {
        url += `&month=${encodeURIComponent(activeMo)}`;
      }

      const response = await queuedFetch(url);
      const json = await response.json();

      if (json.status === "success" && json.data) {
        setSheet2Data(json.data);
        if (json.months && Array.isArray(json.months)) {
          setMonths(json.months);
        }
        if (json.selected_month) {
          setSelectedMonthNo(json.selected_month);
        }
        if (json.meta) {
          setMeta(json.meta);
        }
      } else {
        setSheet2Data([]);
      }
    } catch (e) {
      console.error("Error fetching sales numbers report", e);
      setSheet2Data([]);
    } finally {
      setIsSheet2Loading(false);
    }
  };

  // Fetch dedicated Sheet 3 data (Sales Report by Values)
  const fetchSheet3Data = async (monthOverride?: number) => {
    setIsSheet3Loading(true);
    try {
      if (!sessionId || sessionId === "null") {
        setIsSheet3Loading(false);
        return;
      }

      const activeMo = monthOverride !== undefined ? monthOverride : selectedMonthNo;
      let url = `${defaultConfig.baseUrl}${API_ENDPOINTS.DASHBOARD.SALES_REPORT_BY_VALUES}?session_id=${sessionId}`;
      if (activeMo) {
        url += `&month=${encodeURIComponent(activeMo)}`;
      }

      const response = await queuedFetch(url);
      const json = await response.json();

      if (json.status === "success" && json.data) {
        setSheet3Data(json.data);
        if (json.months && Array.isArray(json.months)) {
          setMonths(json.months);
        }
        if (json.selected_month) {
          setSelectedMonthNo(json.selected_month);
        }
        if (json.meta) {
          setMeta(json.meta);
        }
      } else {
        setSheet3Data([]);
      }
    } catch (e) {
      console.error("Error fetching sales report by values", e);
      setSheet3Data([]);
    } finally {
      setIsSheet3Loading(false);
    }
  };

  // Fetch sheets 2 & 4 preview data when needed
  const fetchPreviewOtherSheets = async () => {
    if (previewData) return;
    setIsPreviewLoading(true);
    setPreviewError(null);
    try {
      const res = await queuedFetch(`${defaultConfig.baseUrl}${API_ENDPOINTS.REPORTS.EXPORT_DOMESTIC_SALES_PREVIEW}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const json = await res.json();
      if (json.status === "success") {
        setPreviewData(json.sections);
      } else {
        setPreviewError(json.message || "No data available for preview.");
      }
    } catch (err: any) {
      setPreviewError(err.message || "No preview data available.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (activeTabIndex === 0) {
      fetchSheet1Data();
    } else if (activeTabIndex === 1) {
      fetchSheet2Data();
    } else if (activeTabIndex === 2) {
      fetchSheet3Data();
    } else {
      fetchPreviewOtherSheets();
    }
  }, [sessionId, activeTabIndex]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mo = parseInt(e.target.value, 10);
    if (!isNaN(mo)) {
      setSelectedMonthNo(mo);
      if (activeTabIndex === 0) {
        fetchSheet1Data(mo);
      } else if (activeTabIndex === 1) {
        fetchSheet2Data(mo);
      } else if (activeTabIndex === 2) {
        fetchSheet3Data(mo);
      }
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloading(true);
    const toastId = toast.loading("Generating full Excel report...");
    try {
      const now = new Date();
      await apiService.download(
        API_ENDPOINTS.REPORTS.EXPORT_DOMESTIC_SALES,
        {
          session_id: sessionId,
          month: selectedMonthNo,
          year: now.getFullYear(),
          day: now.getDate(),
        },
        `Summary_Revised_${now.getFullYear()}_${selectedMonthNo}_${now.getDate()}.xlsx`
      );
      toast.success("Downloaded!", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Failed to download report", { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  const currentOtherSection = previewData?.[activeTab];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50 gap-3">
        <h3 className="font-bold text-slate-800 text-base w-36 shrink-0">Sales Summary</h3>

        {/* Carousel Controls Inline */}
        <div className="flex items-center gap-4 flex-1 justify-center">
          <button
            onClick={() => setActiveTabIndex((prev) => (prev > 0 ? prev - 1 : TABS.length - 1))}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-600 transition-colors focus:outline-none cursor-pointer"
            title="Previous Sheet"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-slate-800 text-center">
              {TABS[activeTabIndex].title}
            </span>
            <div className="flex gap-1.5 mt-1.5">
              {TABS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTabIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none cursor-pointer ${
                    activeTabIndex === idx ? "w-4 bg-indigo-600" : "w-1.5 bg-slate-300"
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            onClick={() => setActiveTabIndex((prev) => (prev < TABS.length - 1 ? prev + 1 : 0))}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-600 transition-colors focus:outline-none cursor-pointer"
            title="Next Sheet"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Right Action Toolbar: Month Selector + Download */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Month Selector Dropdown for Sheet 1, Sheet 2 & Sheet 3 */}
          {(activeTabIndex === 0 || activeTabIndex === 1 || activeTabIndex === 2) && (
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs hover:border-indigo-300 transition-all">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Month:
              </label>
              <select
                value={selectedMonthNo}
                onChange={handleMonthChange}
                disabled={activeTabIndex === 0 ? isSheet1Loading : activeTabIndex === 1 ? isSheet2Loading : isSheet3Loading}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
              >
                {months.map((m) => (
                  <option key={m.month_no} value={m.month_no}>
                    {m.month_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Download Full Excel Button */}
          <button
            onClick={handleDownload}
            disabled={isDownloading || (activeTabIndex === 0 ? isSheet1Loading : activeTabIndex === 1 ? isSheet2Loading : activeTabIndex === 2 ? isSheet3Loading : isPreviewLoading)}
            title="Download Full Report as Excel"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-600 transition-colors focus:outline-none cursor-pointer"
          >
            <Download className={`w-4 h-4 ${isDownloading ? "animate-bounce" : ""}`} />
          </button>
        </div>
      </div>

      {/* Sheet Content Area */}
      <div className="overflow-x-auto" style={{ maxHeight: "360px" }}>
        {activeTabIndex === 0 ? (
          /* ================= SHEET 1: Domestic Sales Value Achievement ================= */
          isSheet1Loading ? (
            <div className="flex flex-col items-center justify-center min-h-[200px]">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <span className="text-xs text-slate-500 mt-2 font-medium">Calculating achievement metrics...</span>
            </div>
          ) : sheet1Data.length > 0 ? (
            <table className="w-full text-xs border-collapse min-w-[700px] bg-white">
              <thead>
                {/* Banner Header Title Row */}
                <tr>
                  <th
                    colSpan={8}
                    className="bg-[#dcfcfc] text-[#006666] font-bold text-center text-xs py-2 border border-slate-300 uppercase tracking-wide"
                  >
                    Domestic Sales Value Achievement
                  </th>
                </tr>

                {/* Sub-header Tier 1 */}
                <tr className="bg-[#eefbfb] text-slate-800 text-[11px]">
                  <th
                    rowSpan={2}
                    className="border border-slate-300 px-4 py-2 font-bold text-center align-middle w-48"
                  >
                    Market Segment
                  </th>
                  <th
                    colSpan={2}
                    className="border border-slate-300 px-3 py-1.5 font-bold text-center"
                  >
                    {meta.prev_year_label}
                  </th>
                  <th
                    colSpan={5}
                    className="border border-slate-300 px-3 py-1.5 font-bold text-center"
                  >
                    {meta.curr_year_label}
                  </th>
                </tr>

                {/* Sub-header Tier 2 */}
                <tr className="bg-[#eefbfb] text-slate-800 text-[11px]">
                  <th className="border border-slate-300 px-3 py-1.5 font-bold text-center">Month</th>
                  <th className="border border-slate-300 px-3 py-1.5 font-bold text-center">MTD</th>
                  <th className="border border-slate-300 px-3 py-1.5 font-bold text-center">Target</th>
                  <th className="border border-slate-300 px-3 py-1.5 font-bold text-center">Actual</th>
                  <th className="border border-slate-300 px-3 py-1.5 font-bold text-center">% Achvd</th>
                  <th className="border border-slate-300 px-3 py-1.5 font-bold text-center">{meta.day_label}</th>
                  <th className="border border-slate-300 px-3 py-1.5 font-bold text-center">Grth Over LYSMT</th>
                </tr>
              </thead>

              <tbody>
                {sheet1Data.map((row, idx) => {
                  const isGrandTotal = row.market_segment.trim().toLowerCase() === "domestic";
                  const isSubTotal = (row.is_total || row.market_segment.includes("Repl") || row.market_segment.includes("OEM + STU + DEF")) && !isGrandTotal;
                  const rowBg = isGrandTotal
                    ? "bg-[#dcfcfc] font-bold text-slate-900"
                    : isSubTotal
                    ? "bg-[#fff59d] font-bold text-slate-900"
                    : idx % 2 === 0
                    ? "bg-white hover:bg-slate-50/80"
                    : "bg-slate-50/50 hover:bg-slate-50";

                  return (
                    <tr key={idx} className={`${rowBg} transition-colors text-slate-700`}>
                      <td className="border border-slate-300 px-4 py-2 text-left font-medium">
                        {row.market_segment}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right font-mono">
                        {fmtNum(row.prev_year_actual_month)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right font-mono">
                        {fmtNum(row.prev_year_actual_mtd)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right font-mono">
                        {fmtNum(row.target)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right font-mono">
                        {fmtNum(row.actual)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-center font-semibold">
                        {row.achievement_pct !== undefined ? `${Math.round(row.achievement_pct)}%` : "0%"}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right font-mono">
                        {fmtNum(row.sale_for_the_day)}
                      </td>
                      <td
                        className={`border border-slate-300 px-3 py-2 text-center font-bold ${
                          row.growth_over_lysmt < 0
                            ? "text-red-600"
                            : row.growth_over_lysmt > 0
                            ? "text-emerald-600"
                            : "text-slate-700"
                        }`}
                      >
                        {row.growth_over_lysmt !== undefined ? `${Math.round(row.growth_over_lysmt)}%` : "0%"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center min-h-[180px] text-slate-400 text-sm">
              No sales summary data available for this month.
            </div>
          )
        ) : activeTabIndex === 1 ? (
          /* ================= SHEET 2: Sales Number's ================= */
          isSheet2Loading ? (
            <div className="flex flex-col items-center justify-center min-h-[200px]">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <span className="text-xs text-slate-500 mt-2 font-medium">Calculating sales numbers by category...</span>
            </div>
          ) : sheet2Data.length > 0 ? (
            <table className="w-full text-xs border-collapse min-w-[1250px] bg-white">
              <thead>
                {/* Banner Header Title Row */}
                <tr>
                  <th
                    colSpan={19}
                    className="bg-[#dcfcfc] text-[#006666] font-bold text-center text-xs py-2 border border-slate-300 uppercase tracking-wide"
                  >
                    Sales Number's
                  </th>
                </tr>

                {/* Sub-header Tier 1 */}
                <tr className="text-slate-800 text-[11px]">
                  <th
                    rowSpan={2}
                    className="border border-slate-300 px-3 py-2 font-bold text-center align-middle w-40 bg-white"
                  >
                    Category
                  </th>
                  <th
                    colSpan={9}
                    className="border border-slate-300 px-3 py-1.5 font-bold text-center bg-[#ffff99] text-slate-900"
                  >
                    Replacement
                  </th>
                  <th
                    colSpan={2}
                    className="border border-slate-300 px-3 py-1.5 font-bold text-center bg-[#fce4d6] text-slate-900"
                  >
                    OEM
                  </th>
                  <th
                    colSpan={2}
                    className="border border-slate-300 px-3 py-1.5 font-bold text-center bg-[#ddebf7] text-slate-900"
                  >
                    STU
                  </th>
                  <th
                    colSpan={2}
                    className="border border-slate-300 px-3 py-1.5 font-bold text-center bg-[#fff0f5] text-slate-900"
                  >
                    DEF
                  </th>
                  <th
                    colSpan={3}
                    className="border border-slate-300 px-3 py-1.5 font-bold text-center bg-[#f2f2f2] text-slate-900"
                  >
                    Domestic
                  </th>
                </tr>

                {/* Sub-header Tier 2 */}
                <tr className="bg-[#f8fafc] text-slate-800 text-[11px]">
                  {/* Replacement cols */}
                  <th className="border border-slate-300 px-2 py-1 font-bold text-center whitespace-nowrap">{meta.prev_year_label}</th>
                  <th className="border border-slate-300 px-2 py-1 font-bold text-center">Target</th>
                  <th className="border border-slate-300 px-2 py-1 font-bold text-center">Total</th>
                  <th className="border border-slate-300 px-2 py-1 font-bold text-center">% Achv</th>
                  <th className="border border-slate-300 px-2 py-1 font-bold text-center">Today</th>
                  <th className="border border-slate-300 px-2 py-1 font-bold text-center">Dealer</th>
                  <th className="border border-slate-300 px-2 py-1 font-bold text-center">Dist.</th>
                  <th className="border border-slate-300 px-2 py-1 font-bold text-center">Fleet</th>
                  <th className="border border-slate-300 px-2 py-1 font-bold text-center">Others</th>

                  {/* OEM cols */}
                  <th className="border border-slate-300 px-2 py-1 font-bold text-center">Target</th>
                  <th className="border border-slate-300 px-2 py-1 font-bold text-center">Actual</th>

                  {/* STU cols */}
                  <th className="border border-slate-300 px-2 py-1 font-bold text-center">Target</th>
                  <th className="border border-slate-300 px-2 py-1 font-bold text-center">Actual</th>

                  {/* DEF cols */}
                  <th className="border border-slate-300 px-2 py-1 font-bold text-center">Target</th>
                  <th className="border border-slate-300 px-2 py-1 font-bold text-center">Actual</th>

                  {/* Domestic cols */}
                  <th className="border border-slate-300 px-2 py-1 font-bold text-center">Target</th>
                  <th className="border border-slate-300 px-2 py-1 font-bold text-center">Actual</th>
                  <th className="border border-slate-300 px-2 py-1 font-bold text-center">% Achv.</th>
                </tr>
              </thead>

              <tbody>
                {sheet2Data.map((row, idx) => {
                  const isTotal = row.is_total || row.category.trim().toLowerCase() === "total";
                  const rowBg = isTotal
                    ? "bg-[#fff59d] font-bold text-slate-900"
                    : idx % 2 === 0
                    ? "bg-white hover:bg-slate-50/80"
                    : "bg-slate-50/50 hover:bg-slate-50";

                  return (
                    <tr key={idx} className={`${rowBg} transition-colors text-slate-700`}>
                      <td className="border border-slate-300 px-3 py-1.5 text-left font-medium whitespace-nowrap">
                        {row.category}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">
                        {fmtCell(row.prev_year_act)}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">
                        {fmtCell(row.target)}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono font-semibold">
                        {fmtCell(row.total)}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-center font-semibold">
                        {row.target > 0 && row.achievement_pct !== undefined ? `${Math.round(row.achievement_pct)}%` : "%"}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">
                        {fmtCell(row.today)}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">
                        {fmtCell(row.dealer)}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">
                        {fmtCell(row.distributor)}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">
                        {fmtCell(row.fleet)}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">
                        {fmtCell(row.others)}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">
                        {fmtCell(row.oem_target)}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">
                        {fmtCell(row.oem_actual)}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">
                        {fmtCell(row.stu_target)}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">
                        {fmtCell(row.stu_actual)}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">
                        {fmtCell(row.def_target)}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">
                        {fmtCell(row.def_actual)}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">
                        {fmtCell(row.domestic_target)}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono font-semibold">
                        {fmtCell(row.domestic_actual)}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-center font-semibold">
                        {row.domestic_target > 0 && row.domestic_achv_pct !== undefined ? `${Math.round(row.domestic_achv_pct)}%` : "%"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center min-h-[180px] text-slate-400 text-sm">
              No sales numbers data available for this month.
            </div>
          )
        ) : activeTabIndex === 2 ? (
          /* ================= SHEET 3: Sales Report by Values ================= */
          isSheet3Loading ? (
            <div className="flex flex-col items-center justify-center min-h-[200px]">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <span className="text-xs text-slate-500 mt-2 font-medium">Calculating zone sales by value...</span>
            </div>
          ) : sheet3Data.length > 0 ? (
            <table className="w-full text-xs border-collapse min-w-[980px] bg-white">
              <thead>
                {/* Banner Header Title Row */}
                <tr>
                  <th
                    colSpan={16}
                    className="bg-[#dcfcfc] text-[#006666] font-bold text-center text-xs py-2 border border-slate-300 uppercase tracking-wide"
                  >
                    Sales Report by Values ( In Crores / Rs. )
                  </th>
                </tr>

                {/* Sub-header Tier 1 */}
                <tr className="bg-[#eefbfb] text-slate-800 text-[11px]">
                  <th
                    rowSpan={3}
                    className="border border-slate-300 px-3 py-2 font-bold text-center align-middle w-32"
                  >
                    Zone
                  </th>
                  <th
                    colSpan={3}
                    className="border border-slate-300 px-3 py-1.5 font-bold text-center"
                  >
                    {meta.prev_year_label}
                  </th>
                  <th
                    colSpan={12}
                    className="border border-slate-300 px-3 py-1.5 font-bold text-center"
                  >
                    {meta.curr_year_label}
                  </th>
                </tr>

                {/* Sub-header Tier 2 */}
                <tr className="bg-[#eefbfb] text-slate-800 text-[11px]">
                  <th rowSpan={2} className="border border-slate-300 px-2 py-1 font-bold text-center">4 Whlrs.</th>
                  <th rowSpan={2} className="border border-slate-300 px-2 py-1 font-bold text-center">2/3 Whlrs</th>
                  <th rowSpan={2} className="border border-slate-300 px-2 py-1 font-bold text-center">Total</th>

                  <th colSpan={3} className="border border-slate-300 px-2 py-1 font-bold text-center">Target</th>
                  <th colSpan={3} className="border border-slate-300 px-2 py-1 font-bold text-center">Actual Sales</th>
                  <th rowSpan={2} className="border border-slate-300 px-2 py-1 font-bold text-center">% Achvd</th>
                  <th rowSpan={2} className="border border-slate-300 px-2 py-1 font-bold text-center">{meta.day_label}</th>
                  <th rowSpan={2} className="border border-slate-300 px-2 py-1 font-bold text-center">Asking Rate</th>
                  <th colSpan={3} className="border border-slate-300 px-2 py-1 font-bold text-center bg-[#ffe0b2] text-amber-950">% Achvt.</th>
                </tr>

                {/* Sub-header Tier 3 */}
                <tr className="bg-[#eefbfb] text-slate-800 text-[11px]">
                  <th className="border border-slate-300 px-2 py-1 font-bold text-center">4 Whlrs.</th>
                  <th className="border border-slate-300 px-2 py-1 font-bold text-center">2/3 Whlrs</th>
                  <th className="border border-slate-300 px-2 py-1 font-bold text-center">Total</th>

                  <th className="border border-slate-300 px-2 py-1 font-bold text-center">4 Whlrs</th>
                  <th className="border border-slate-300 px-2 py-1 font-bold text-center">2/3 Whlrs</th>
                  <th className="border border-slate-300 px-2 py-1 font-bold text-center">Total</th>

                  <th className="border border-slate-300 px-2 py-1 font-bold text-center bg-[#ffe0b2] text-amber-950">4 Whlrs</th>
                  <th className="border border-slate-300 px-2 py-1 font-bold text-center bg-[#ffe0b2] text-amber-950">2/3 Whlrs</th>
                  <th className="border border-slate-300 px-2 py-1 font-bold text-center bg-[#ffe0b2] text-amber-950">Total</th>
                </tr>
              </thead>

              <tbody>
                {sheet3Data.map((row, idx) => {
                  const isTotal = row.is_total || row.zone.trim().toLowerCase() === "total";
                  const rowBg = isTotal
                    ? "bg-[#fff59d] font-bold text-slate-900"
                    : idx % 2 === 0
                    ? "bg-white hover:bg-slate-50/80"
                    : "bg-slate-50/50 hover:bg-slate-50";

                  return (
                    <tr key={idx} className={`${rowBg} transition-colors text-slate-700`}>
                      <td className="border border-slate-300 px-3 py-1.5 text-left font-medium">
                        {row.zone}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">
                        {fmtNum(row.prev_4w)}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">
                        {fmtNum(row.prev_23w)}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono font-semibold">
                        {fmtNum(row.prev_total)}
                      </td>

                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">
                        {fmtNum(row.target_4w)}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">
                        {fmtNum(row.target_23w)}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono font-semibold">
                        {fmtNum(row.target_total)}
                      </td>

                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">
                        {fmtNum(row.actual_4w)}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">
                        {fmtNum(row.actual_23w)}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono font-semibold">
                        {fmtNum(row.actual_total)}
                      </td>

                      <td className="border border-slate-300 px-2 py-1.5 text-center font-semibold">
                        {row.achievement_pct !== undefined ? `${Math.round(row.achievement_pct)}%` : "0%"}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">
                        {fmtNum(row.sale_for_the_day)}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">
                        {row.asking_rate ? fmtNum(row.asking_rate) : "0.00"}
                      </td>

                      <td className="border border-slate-300 px-2 py-1.5 text-center font-semibold">
                        {row.achvt_4w !== undefined ? `${Math.round(row.achvt_4w)}%` : "0%"}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-center font-semibold">
                        {row.achvt_23w !== undefined ? `${Math.round(row.achvt_23w)}%` : "0%"}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-center font-semibold">
                        {row.achvt_total !== undefined ? `${Math.round(row.achvt_total)}%` : "0%"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center min-h-[180px] text-slate-400 text-sm">
              No sales report by values data available for this month.
            </div>
          )
        ) : (
          /* ================= SHEETS 2 & 4: General Preview Fallback ================= */
          isPreviewLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[200px]">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : previewError ? (
            <div className="flex items-center justify-center min-h-[200px] text-slate-400 font-medium text-sm px-10 text-center">
              {previewError}
            </div>
          ) : currentOtherSection && currentOtherSection.matrix && currentOtherSection.matrix.length > 0 ? (
            <table className="w-full text-[10px] border-collapse min-w-max bg-white">
              <tbody>
                {currentOtherSection.matrix.map((row: any[], ri: number) => {
                  const isHeader = ri < 4;
                  return (
                    <tr
                      key={ri}
                      className={`${isHeader ? "sticky top-" + ri * 24 + " z-10" : ""} hover:bg-slate-50 transition-colors`}
                    >
                      {row.map((cell: any, ci: number) => {
                        const val = String(cell.value);
                        const isNum = !isNaN(Number(val.replace(/,/g, ""))) && val !== "";
                        const isPct = val.includes("%");

                        let tdClass = "border border-slate-300 px-2 py-1.5 whitespace-nowrap text-slate-700 ";
                        if (cell.bold) tdClass += "font-bold ";
                        if (cell.align === "center" || cell.align === "justify") tdClass += "text-center ";
                        else if (cell.align === "right" || isNum) tdClass += "text-right font-mono ";
                        else tdClass += "text-left ";
                        if (isPct && !cell.bold) tdClass += "text-indigo-700 font-semibold ";

                        return (
                          <td
                            key={ci}
                            colSpan={cell.colSpan || 1}
                            rowSpan={cell.rowSpan || 1}
                            className={tdClass.trim()}
                            style={{
                              backgroundColor: cell.bgColor || (ri % 2 === 0 ? "#ffffff" : "#f8fafc"),
                            }}
                          >
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center min-h-[200px] text-slate-400 font-medium text-sm">
              No sales data available.
            </div>
          )
        )}
      </div>
    </div>
  );
};
