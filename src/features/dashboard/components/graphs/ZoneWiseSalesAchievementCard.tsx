import React, { useState, useEffect } from "react";
import { defaultConfig, API_ENDPOINTS } from "@/src/services/api.config";
import { useSessionId, queuedFetch } from "./dashboardHooks";
import { Loader2, Download, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import { apiService } from "@/src/services/api.service";

interface ZoneWiseAchievementRow {
  zone: string;
  prev_year_actual_month: number;
  prev_year_actual_mtd: number;
  target: number;
  actual: number;
  achievement_pct: number;
  sale_for_the_day: number;
  growth_over_lysmt: number;
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

export const ZoneWiseSalesAchievementCard = () => {
  const [data, setData] = useState<ZoneWiseAchievementRow[]>([]);
  const [months, setMonths] = useState<MonthItem[]>(DEFAULT_MONTHS);
  const [selectedMonthNo, setSelectedMonthNo] = useState<number>(11);
  const [meta, setMeta] = useState<MetaInfo>({
    month_abbr: "Nov",
    prev_year_label: "Nov-25 Actual",
    curr_year_label: "Actual Sale for Nov-26",
    day_label: "Sale for day",
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const sessionId = useSessionId();

  const fetchData = async (monthOverride?: number) => {
    setIsLoading(true);
    try {
      if (!sessionId || sessionId === "null") {
        setIsLoading(false);
        return;
      }

      const activeMo = monthOverride !== undefined ? monthOverride : selectedMonthNo;
      const storedUid = localStorage.getItem("user_id");
      let url = `${defaultConfig.baseUrl}${API_ENDPOINTS.DASHBOARD.ZONE_WISE_SALES_ACHIEVEMENT}?session_id=${sessionId}`;
      if (activeMo) {
        url += `&month=${encodeURIComponent(activeMo)}`;
      }
      if (storedUid) {
        url += `&user_id=${encodeURIComponent(storedUid)}`;
      }

      const response = await queuedFetch(url);
      const json = await response.json();

      if (json.status === "success" && json.data) {
        setData(json.data);
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
        setData([]);
      }
    } catch (e) {
      console.error("Error fetching zone-wise sales achievement", e);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [sessionId]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mo = parseInt(e.target.value, 10);
    if (!isNaN(mo)) {
      setSelectedMonthNo(mo);
      fetchData(mo);
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
        `Zone_Wise_Achievement_${now.getFullYear()}_${selectedMonthNo}_${now.getDate()}.xlsx`
      );
      toast.success("Downloaded!", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Failed to download report", { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50 gap-3">
        <h3 className="font-bold text-slate-800 text-base">Zone-Wise Sales Achievement</h3>

        {/* Right Action Toolbar: Month Selector + Download */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs hover:border-indigo-300 transition-all">
            <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Month:
            </label>
            <select
              value={selectedMonthNo}
              onChange={handleMonthChange}
              disabled={isLoading}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
            >
              {months.map((m) => (
                <option key={m.month_no} value={m.month_no}>
                  {m.month_name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleDownload}
            disabled={isDownloading || isLoading}
            title="Download Full Report as Excel"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-600 transition-colors focus:outline-none cursor-pointer"
          >
            <Download className={`w-4 h-4 ${isDownloading ? "animate-bounce" : ""}`} />
          </button>
        </div>
      </div>

      {/* Table Content Area */}
      <div className="overflow-x-auto" style={{ maxHeight: "420px" }}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[220px]">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <span className="text-xs text-slate-500 mt-2 font-medium">Calculating zone-wise achievement metrics...</span>
          </div>
        ) : data.length > 0 ? (
          <table className="w-full text-xs border-collapse min-w-[700px] bg-white">
            <thead>
              {/* Banner Header Title Row */}
              <tr>
                <th
                  colSpan={8}
                  className="bg-[#dcfcfc] text-[#006666] font-bold text-center text-xs py-2 border border-slate-300 uppercase tracking-wide"
                >
                  Zone-Wise Sales Achievement (₹ in Cr)
                </th>
              </tr>

              {/* Sub-header Tier 1 */}
              <tr className="bg-[#eefbfb] text-slate-800 text-[11px]">
                <th
                  rowSpan={2}
                  className="border border-slate-300 px-4 py-2 font-bold text-center align-middle w-48"
                >
                  Zone
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
              {data.map((row, idx) => {
                const isTotal = row.is_total || row.zone.includes("Total") || row.zone.trim().toLowerCase() === "total";
                const rowBg = isTotal
                  ? "bg-[#fff59d] font-bold text-slate-900"
                  : idx % 2 === 0
                  ? "bg-white hover:bg-slate-50/80"
                  : "bg-slate-50/50 hover:bg-slate-50";

                return (
                  <tr key={idx} className={`${rowBg} transition-colors text-slate-700`}>
                    <td className="border border-slate-300 px-4 py-2 text-left font-medium">
                      {row.zone}
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
            No zone-wise sales achievement data available for this month.
          </div>
        )}
      </div>
    </div>
  );
};
