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
import { Loader2, ArrowLeft, Layers } from "lucide-react";

interface PlanVsSaleChartProps {
  onZoneClick?: (zone: string) => void;
  initialZone?: string | null;
  initialRegion?: string | null;
  lockZone?: boolean;
  lockRegion?: boolean;
  userHierarchy?: any;
}

const ZONE_FULL_NAMES: Record<string, string> = {
  "CZ": "Central Zone",
  "WZ": "West Zone",
  "NP": "Nepal Zone",
  "NZ": "North Zone",
  "TZ": "South Zone II",
  "SZ": "South Zone I",
  "EZ": "East Zone",
  "CENTRAL ZONE": "Central Zone",
  "WEST": "West Zone",
  "EAST": "East Zone",
  "NORTH": "North Zone",
  "SOUTH": "South Zone I",
  "NEPAL": "Nepal Zone"
};

const getFullName = (shortName: string) => {
  if (!shortName) return "Unknown";
  const up = shortName.toUpperCase().trim();
  return ZONE_FULL_NAMES[up] || shortName;
};

const getShortCode = (fullName: string) => {
  const map: Record<string, string> = {
    "Central Zone": "CZ",
    "West Zone": "WZ",
    "Nepal Zone": "NP",
    "North Zone": "NZ",
    "South Zone II": "TZ",
    "South Zone - II": "TZ",
    "South Zone I": "SZ",
    "South Zone": "SZ",
    "East Zone": "EZ"
  };
  return map[fullName] || fullName;
};

export const PlanVsSaleChartDynamic: React.FC<PlanVsSaleChartProps> = ({
  onZoneClick,
  initialZone = null,
  initialRegion = null,
  lockZone = false,
  lockRegion = false,
  userHierarchy
}) => {
  const [level, setLevel] = useState<"zone" | "region" | "territory">("zone");
  const [selectedZone, setSelectedZone] = useState<string | null>(initialZone || null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(initialRegion || null);
  const [zoneDisplayName, setZoneDisplayName] = useState<string | null>(initialZone ? getFullName(initialZone) : null);
  const [regionDisplayName, setRegionDisplayName] = useState<string | null>(initialRegion || null);

  const [dynamicRegionData, setDynamicRegionData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const sessionId = useSessionId();

  // Sync initial props if changed
  useEffect(() => {
    if (initialZone) {
      setSelectedZone(initialZone);
      setZoneDisplayName(getFullName(initialZone));
    }
  }, [initialZone]);

  useEffect(() => {
    if (initialRegion) {
      setSelectedRegion(initialRegion);
      setRegionDisplayName(initialRegion);
    }
  }, [initialRegion]);

  useEffect(() => {
    const fetchSalesRevenue = async () => {
      setIsLoading(true);
      try {
        if (!sessionId || sessionId === "null") {
          setIsLoading(false);
          return;
        }

        const uid = localStorage.getItem("user_id");
        let url = `${defaultConfig.baseUrl}${API_ENDPOINTS.DASHBOARD.SALES_REVENUE}?session_id=${encodeURIComponent(sessionId)}&level=${level}`;

        if (selectedZone) {
          url += `&zone=${encodeURIComponent(selectedZone)}`;
        }
        if (selectedRegion && (level === "region" || level === "territory")) {
          url += `&region=${encodeURIComponent(selectedRegion)}`;
        }
        if (uid) {
          url += `&user_id=${encodeURIComponent(uid)}`;
        }

        const response = await queuedFetch(url);
        const json = await response.json();
        const rawList = Array.isArray(json) ? json : (json.data || (json.status === "success" ? json.data : null));

        if (rawList && Array.isArray(rawList)) {
          const mappedData = rawList.map((item: any) => {
            const rawLabel = item.territory || item.region || item.zone || item.city || item.city_or_zone_name || "Unknown";
            const displayLabel = level === "zone" && item.zone ? getFullName(item.zone) : rawLabel;

            return {
              city: displayLabel,
              originalZone: item.zoneCode || item.zone || rawLabel,
              zoneCode: item.zoneCode || getShortCode(displayLabel),
              regionCode: item.regionCode || item.region || rawLabel,
              territoryCode: item.territoryCode || item.territory || rawLabel,
              planValue: Number(item.planValueCr || item.planValue || 0),
              saleValue: Number(item.saleValueCr || item.saleValue || item.saleV || 0),
              achevValue: Number(item.achievValuePct || item.achievValue || item.achevValue || 0),
              level: item.level || level
            };
          });

          // Sort by saleValue descending for better readability
          mappedData.sort((a: any, b: any) => b.saleValue - a.saleValue);
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
    const entry = data?.payload || data;
    if (!entry) return;

    if (level === "zone") {
      const clickedZone = entry.zoneCode || getShortCode(entry.city) || entry.originalZone || entry.city;
      const name = entry.city || getFullName(clickedZone);
      setSelectedZone(clickedZone);
      setZoneDisplayName(name);
      setLevel("region");
      if (onZoneClick && !lockZone) {
        onZoneClick(clickedZone);
      }
    } else if (level === "region") {
      const clickedReg = entry.regionCode || entry.city;
      const name = entry.city || clickedReg;
      setSelectedRegion(clickedReg);
      setRegionDisplayName(name);
      setLevel("territory");
    }
  };

  const handleBackToZones = () => {
    setLevel("zone");
    if (!lockZone) {
      setSelectedZone(initialZone || null);
      setZoneDisplayName(initialZone ? getFullName(initialZone) : null);
      if (onZoneClick) onZoneClick("");
    }
    if (!lockRegion) {
      setSelectedRegion(initialRegion || null);
      setRegionDisplayName(initialRegion || null);
    }
  };

  const handleBackToRegions = () => {
    setLevel("region");
    if (!lockRegion) {
      setSelectedRegion(initialRegion || null);
      setRegionDisplayName(initialRegion || null);
    }
  };

  const leftDomain: any = [0, "auto"];
  const rightDomain: any = [0, 100];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 flex flex-col min-h-[420px]">
      {/* Header with Title, Badge, Navigation and Breadcrumbs */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {level === "territory" && (
              <button
                onClick={handleBackToRegions}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Back to Regions"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Regions
              </button>
            )}

            {level === "region" && (
              <button
                onClick={handleBackToZones}
                className="bg-[#0070c0] hover:bg-blue-700 text-white px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Back to Zones"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Zones
              </button>
            )}

            <h3 className="text-slate-800 font-bold text-lg text-left">
              Sales Revenue (Cr)
            </h3>

            <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
              2026 YTD
            </span>

            {/* Drilldown Level Indicator Badge */}
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
              level === "zone"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : level === "region"
                ? "bg-purple-50 text-purple-700 border border-purple-200"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}>
              <Layers className="w-3 h-3" />
              {level === "zone" ? "Zone Level" : level === "region" ? "Region Level" : "Territory Level"}
            </span>
          </div>

          {/* Interactive Drilldown Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs font-medium bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md text-slate-600">
            <span
              className={level === "zone" ? "font-bold text-slate-900" : "text-blue-600 hover:underline cursor-pointer"}
              onClick={handleBackToZones}
            >
              All Zones {lockZone && selectedZone ? `(${zoneDisplayName || selectedZone})` : ""}
            </span>

            {level !== "zone" && (
              <>
                <span className="text-slate-400">/</span>
                <span
                  className={level === "region" ? "font-bold text-slate-900" : "text-blue-600 hover:underline cursor-pointer"}
                  onClick={handleBackToRegions}
                >
                  {zoneDisplayName || selectedZone || "Zone"} (Regions)
                </span>
              </>
            )}

            {level === "territory" && (
              <>
                <span className="text-slate-400">/</span>
                <span className="font-bold text-slate-900">
                  {regionDisplayName || selectedRegion || "Region"} (Territories)
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action Hint */}
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          {level === "zone" && (
            <span>💡 Click on any <strong>Zone bar</strong> to drill down into its Regions.</span>
          )}
          {level === "region" && (
            <span>💡 Click on any <strong>Region bar</strong> to drill down into its Territories.</span>
          )}
          {level === "territory" && (
            <span>💡 Viewing <strong>Territory-level</strong> performance. Use the Back button to navigate up.</span>
          )}
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="w-full relative" style={{ height: "380px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {isLoading ? (
          <div className="flex flex-col items-center gap-2 text-slate-500 text-sm">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <span>Loading {level} data...</span>
          </div>
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
                onClick={handleDrilldown}
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
                cursor={{ fill: "rgba(241, 245, 249, 0.6)" }}
                formatter={(val: any, name: string) => {
                  if (name === "Achiev Value %") {
                    return [`${Number(val || 0).toFixed(2)}%`, name];
                  }
                  return [`₹${Number(val || 0).toFixed(2)} Cr`, name];
                }}
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
                  formatter={(val: any) => (Number(val || 0) > 0 ? Number(val).toFixed(2) : "0")}
                />
              </Line>

              <Bar
                yAxisId="left"
                dataKey="saleValue"
                name="Sale Value"
                fill="#0EA5E9"
                barSize={40}
                radius={[4, 4, 0, 0]}
                onClick={handleDrilldown}
                cursor={level !== "territory" ? "pointer" : "default"}
              >
                <LabelList
                  dataKey="saleValue"
                  position="top"
                  fill="#0284C7"
                  fontSize={11}
                  fontWeight="bold"
                  dy={-12}
                  formatter={(val: any) => (Number(val || 0) > 0 ? Number(val).toFixed(2) : "0")}
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
                  formatter={(val: any) => (Number(val || 0) > 0 ? `${Number(val).toFixed(1)}%` : "0%")}
                />
              </Line>
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <span className="text-slate-400 font-medium text-sm">
            No sales revenue data available for {level} level.
          </span>
        )}
      </div>
    </div>
  );
};
