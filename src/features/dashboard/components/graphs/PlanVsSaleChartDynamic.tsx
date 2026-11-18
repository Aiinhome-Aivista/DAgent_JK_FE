import React, { useState, useEffect } from "react";
import { defaultConfig, API_ENDPOINTS } from "@/src/services/api.config";
import { useSessionId, queuedFetch } from "./dashboardHooks";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { Loader2 } from "lucide-react";

interface PlanVsSaleChartProps {
  onZoneClick?: (zone: string) => void;
  initialZone?: string | null;
  lockZone?: boolean;
}

type DrilldownLevel = "zone" | "region" | "territory";

export const PlanVsSaleChartDynamic: React.FC<PlanVsSaleChartProps> = ({
  onZoneClick,
  initialZone = null,
  lockZone = false
}) => {
  const [level, setLevel] = useState<DrilldownLevel>("zone");
  const [selectedZone, setSelectedZone] = useState<string | null>(initialZone || null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [dynamicRegionData, setDynamicRegionData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const sessionId = useSessionId();

  useEffect(() => {
    if (initialZone !== undefined && initialZone !== null) {
      setSelectedZone(initialZone);
    }
  }, [initialZone]);

  const getFullName = (shortName: string) => {
    if (!shortName) return "Unknown";
    const map: Record<string, string> = {
      "CZ": "Central Zone",
      "WZ": "West Zone",
      "NP": "Nepal Zone",
      "NZ": "North Zone",
      "TZ": "South Zone II",
      "SZ": "South Zone I",
      "EZ": "East Zone"
    };
    return map[shortName.toUpperCase()] || shortName;
  };

  const getShortCode = (fullName: string) => {
    if (!fullName) return "";
    const map: Record<string, string> = {
      "Central Zone": "CZ",
      "West Zone": "WZ",
      "Nepal Zone": "NP",
      "North Zone": "NZ",
      "South Zone II": "TZ",
      "South Zone I": "SZ",
      "East Zone": "EZ"
    };
    return map[fullName] || fullName;
  };

  useEffect(() => {
    const fetchSalesRevenue = async () => {
      setIsLoading(true);
      try {
        if (!sessionId || sessionId === "null") {
          setIsLoading(false);
          return;
        }

        const uid = localStorage.getItem("user_id");
        const params = new URLSearchParams();
        params.append("session_id", sessionId);
        params.append("level", level);
        if (selectedZone) params.append("zone", selectedZone);
        if (selectedRegion) params.append("region", selectedRegion);
        if (uid) params.append("user_id", uid);

        const url = `${defaultConfig.baseUrl}${API_ENDPOINTS.DASHBOARD.SALES_REVENUE}?${params.toString()}`;
        const response = await queuedFetch(url);
        const json = await response.json();

        const rawList = Array.isArray(json) ? json : (json.data || (json.status === "success" ? json.data : null));

        if (rawList && Array.isArray(rawList)) {
          const mappedData = rawList.map((item: any) => {
            const rawZone = item.zone || item.city || item.city_or_zone_name || item.Region || item.region || item.territory || "Unknown";
            const displayName = item.zone ? getFullName(item.zone) : (item.city_or_zone_name || item.city || item.region || item.territory || rawZone);

            return {
              city: displayName,
              originalZone: rawZone,
              zone: item.zone || null,
              region: item.region || null,
              territory: item.territory || null,
              planValue: Number(item.planValueCr ?? item.plan_value_cr ?? 0),
              saleValue: Number(item.saleValueCr ?? item.sale_value_cr ?? item.saleV ?? 0),
              achevValue: Number(item.achievValuePct ?? item.achiev_value_pct ?? 0)
            };
          }).sort((a: any, b: any) => String(a.city).localeCompare(String(b.city)));

          setDynamicRegionData(mappedData);
        } else {
          setDynamicRegionData([]);
        }
      } catch (error) {
        console.error("Error fetching dynamic sales revenue data:", error);
        setDynamicRegionData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalesRevenue();
  }, [sessionId, level, selectedZone, selectedRegion]);

  const handleDrilldown = (data: any) => {
    const item = data?.payload || data;
    if (!item) return;

    if (level === "zone") {
      const clickedZone = item.zone || getShortCode(item.originalZone || item.city || item.value || "");
      if (clickedZone) {
        setSelectedZone(clickedZone);
        setLevel("region");
        if (onZoneClick) onZoneClick(clickedZone);
      }
    } else if (level === "region") {
      const clickedRegion = item.region || item.city || item.originalZone || item.value;
      if (clickedRegion) {
        setSelectedRegion(clickedRegion);
        setLevel("territory");
      }
    }
  };

  const handleBack = () => {
    if (level === "territory") {
      setLevel("region");
      setSelectedRegion(null);
    } else if (level === "region") {
      setLevel("zone");
      setSelectedRegion(null);
      if (!lockZone) {
        setSelectedZone(null);
      }
      if (onZoneClick) onZoneClick(lockZone && initialZone ? initialZone : "");
    }
  };

  const showBackButton = level !== "zone";
  const backButtonTitle = level === "territory" ? "Back to Regions" : "Back to Zones";

  let titleSuffix = "";
  if (level === "region") {
    titleSuffix = selectedZone ? (getFullName(selectedZone) || selectedZone) : "";
  } else if (level === "territory") {
    titleSuffix = selectedRegion ? `${selectedZone ? getFullName(selectedZone) + " / " : ""}${selectedRegion}` : "";
  }

  const leftDomain: any = [0, 'auto'];
  const rightDomain: any = [0, 100];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 flex flex-col min-h-[400px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-start gap-4 mb-6">
        <div className="flex items-center gap-2">
          {showBackButton && (
            <button
              onClick={handleBack}
              className="bg-[#0070c0] text-white p-1 rounded hover:bg-blue-700 transition-colors flex items-center justify-center cursor-pointer"
              style={{ width: "24px", height: "24px" }}
              title={backButtonTitle}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          )}

          <div className="flex items-center gap-2">
            <h3 className="text-slate-800 font-bold text-lg text-left">
              Sales Revenue (Cr)
            </h3>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
              2026 YTD
            </span>
            {titleSuffix && (
              <span className="text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                - {titleSuffix}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="w-full relative" style={{ height: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isLoading ? (
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        ) : dynamicRegionData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <ComposedChart
              data={dynamicRegionData}
              margin={{ top: 35, right: 30, bottom: 40, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E2E8F0"
              />
              <XAxis
                dataKey="city"
                axisLine={{ stroke: "#CBD5E1" }}
                tickLine={false}
                angle={-30}
                tick={{
                  fill: "#64748B",
                  fontSize: 10,
                  textAnchor: "end",
                  dy: 10,
                  cursor: level !== "territory" ? "pointer" : "default",
                }}
                onClick={level !== "territory" ? handleDrilldown : undefined}
              />
              <YAxis
                yAxisId="left"
                axisLine={{ stroke: "#0EA5E9" }}
                tickLine={{ stroke: "#0EA5E9" }}
                tick={{ fill: "#64748B", fontSize: 12 }}
                domain={leftDomain}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                axisLine={{ stroke: "#84CC16" }}
                tickLine={{ stroke: "#84CC16" }}
                tick={{ fill: "#64748B", fontSize: 12 }}
                domain={rightDomain}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                cursor={{ fill: "transparent" }}
              />
              <Legend
                verticalAlign="top"
                wrapperStyle={{ paddingBottom: "20px" }}
              />
              <Line
                yAxisId="left"
                type="linear"
                dataKey="planValue"
                name="Plan Value"
                stroke="#F59E0B"
                strokeWidth={2.5}
                dot={{ fill: "#F59E0B", stroke: "#ffffff", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              >
                <LabelList
                  dataKey="planValue"
                  position="top"
                  fill="#D97706"
                  fontSize={11}
                  fontWeight="bold"
                  dy={-10}
                />
              </Line>
              <Bar
                yAxisId="left"
                dataKey="saleValue"
                name="Sale Value"
                fill="#0EA5E9"
                barSize={40}
                radius={[4, 4, 0, 0]}
                onClick={level !== "territory" ? handleDrilldown : undefined}
                cursor={level !== "territory" ? "pointer" : "default"}
              >
                <LabelList
                  dataKey="saleValue"
                  position="top"
                  fill="#0284C7"
                  fontSize={11}
                  fontWeight="bold"
                  dy={-12}
                />
              </Bar>
              <Line
                yAxisId="right"
                type="linear"
                dataKey="achevValue"
                name="Achiev Value %"
                stroke="#84CC16"
                strokeWidth={2.5}
                dot={{ fill: "#84CC16", stroke: "#ffffff", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              >
                <LabelList
                  dataKey="achevValue"
                  position="top"
                  fill="#15803D"
                  fontSize={11}
                  fontWeight="bold"
                  dy={-30}
                  formatter={(val: any) => (val !== undefined && val !== null ? `${val}%` : '')}
                />
              </Line>
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <span className="text-slate-400 font-medium text-sm">No sales revenue data available.</span>
        )}
      </div>
    </div>
  );
};
