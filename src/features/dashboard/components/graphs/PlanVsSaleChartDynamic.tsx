import React, { useState, useEffect } from "react";
import { defaultConfig, API_ENDPOINTS } from "@/src/services/api.config";
import { useSessionId } from "./dashboardHooks";
import {
  ComposedChart,
  Line,
  Area,
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
}

export const PlanVsSaleChartDynamic: React.FC<PlanVsSaleChartProps> = ({ onZoneClick }) => {
  const [dynamicRegionData, setDynamicRegionData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentZone, setCurrentZone] = useState<string | null>(null);
  const sessionId = useSessionId();

  useEffect(() => {
    const fetchSalesRevenue = async () => {
      setIsLoading(true);
      try {
        if (!sessionId || sessionId === "null") {
          setIsLoading(false);
          return;
        }
        const url = `${defaultConfig.baseUrl}${API_ENDPOINTS.DASHBOARD.SALES_REVENUE}?session_id=${sessionId}${currentZone ? `&zone=${encodeURIComponent(currentZone)}` : ''}`;
        const response = await fetch(url);
        const json = await response.json();
        if (json.status === "success" && json.data) {
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

          const mappedData = json.data.map((item: any) => {
            const rawZone = item.zone || item.Region || item.region || item.territory || "Unknown";
            return {
              city: item.zone ? getFullName(item.zone) : rawZone,
              originalZone: rawZone,
              planValue: item.planValueCr || 0,
              saleValue: item.saleValueCr || item.saleV || 0,
              achevValue: item.achievValuePct || 0
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
  }, [sessionId, currentZone]);

  const getShortCode = (fullName: string) => {
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

  const handleDrilldown = (data: any) => {
    let city = data?.payload?.originalZone || data?.originalZone || data?.value || data?.city || data?.payload?.city;
    if (city) {
      city = getShortCode(city);
      if (onZoneClick) {
        onZoneClick(city);
      }
      if (!currentZone) {
        setCurrentZone(city);
      }
    }
  };

  const leftDomain: any = [0, 'auto'];
  const rightDomain: any = [0, 100];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 flex flex-col min-h-[400px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-start gap-4 mb-6">
        <div className="flex items-center gap-2">
          {currentZone && (
            <button
              onClick={() => {
                setCurrentZone(null);
                if (onZoneClick) onZoneClick("");
              }}
              className="bg-[#0070c0] text-white p-1 rounded hover:bg-blue-700 transition-colors flex items-center justify-center cursor-pointer"
              style={{ width: "24px", height: "24px" }}
              title="Back to Zones"
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
          <h3 className="text-slate-800 font-bold text-lg text-left">
            Sales Revenue (Cr) {currentZone ? `- ${currentZone}` : ""}
          </h3>
        </div>
      </div>

      <div className="w-full relative" style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isLoading ? (
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        ) : dynamicRegionData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={dynamicRegionData}
              margin={{ top: 20, right: 20, bottom: 40, left: 0 }}
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
                  cursor: "pointer",
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
                cursor={{ fill: "transparent" }}
              />
              <Legend
                verticalAlign="top"
                wrapperStyle={{ paddingBottom: "20px" }}
              />
              <Area
                yAxisId="left"
                type="linear"
                dataKey="planValue"
                name="Plan Value"
                fill="#FCD34D"
                stroke="none"
                activeDot={false}
              >
                <LabelList
                  dataKey="planValue"
                  position="top"
                  fill="#EAB308"
                  fontSize={12}
                  fontWeight="bold"
                />
              </Area>
              <Bar
                yAxisId="left"
                dataKey="saleValue"
                name="Sale Value"
                fill="#0EA5E9"
                barSize={40}
                radius={[4, 4, 0, 0]}
                onClick={handleDrilldown}
                cursor="pointer"
              >
                <LabelList
                  dataKey="saleValue"
                  position="top"
                  fill="#0EA5E9"
                  fontSize={12}
                  fontWeight="bold"
                  dy={-15}
                />
              </Bar>
              <Line
                yAxisId="right"
                type="linear"
                dataKey="achevValue"
                name="Achev Value %"
                stroke="#84CC16"
                strokeWidth={2}
                dot={{ fill: "#84CC16", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              >
                <LabelList
                  dataKey="achevValue"
                  position="top"
                  fill="#84CC16"
                  fontSize={12}
                  fontWeight="bold"
                  dy={-35}
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
