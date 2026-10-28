import React, { useState, useEffect } from "react";
import { defaultConfig, API_ENDPOINTS } from "@/src/services/api.config";
import { useSessionId } from "./dashboardHooks";

import { Loader2 } from "lucide-react";

export const ExposureCardDynamic = ({ zone }: { zone?: string | null }) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const sessionId = useSessionId();
  const maxScale = 120; // Allow values up to 120%

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (!sessionId || sessionId === "null") {
          setIsLoading(false);
          return;
        }
        const url = `${defaultConfig.baseUrl}${API_ENDPOINTS.DASHBOARD.EXPOSURE_PCT}?session_id=${sessionId}${zone ? `&zone=${encodeURIComponent(zone)}` : ''}`;
        const response = await fetch(url);
        const json = await response.json();
        
        if (json.status === "success" && json.data) {
          const mappedData = json.data.map((item: any) => ({
            name: item.name,
            value: parseFloat(item.value) || 0
          }));
          
          if (mappedData.length > 0) {
            setData(mappedData);
          } else {
            setData([]);
          }
        } else {
          setData([]);
        }
      } catch (e) {
        console.error("Error fetching exposure pct", e);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [sessionId, zone]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 flex flex-col min-h-[400px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-start gap-4 mb-6">
        <h3 className="text-slate-800 font-bold text-lg text-left">
          Exposure %
        </h3>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-8 py-4 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : data.length > 0 ? (
          data.map((item, index) => {
            // Calculate widths as percentages of the maxScale
            const barWidth = (item.value / maxScale) * 100;
            const hundredPercentWidth = (100 / maxScale) * 100;

            return (
              <div key={index} className="flex items-center gap-4">
                <span className="w-8 text-slate-600 font-semibold">{item.name}</span>
                
                <div className="flex-1 relative h-6">
                  {/* 100% Marker Line */}
                  <div 
                    className="absolute top-[-4px] bottom-[-4px] w-[2px] bg-slate-800 z-20"
                    style={{ left: `${hundredPercentWidth}%` }}
                  />

                  {/* Striped Background for 100% */}
                  <div 
                    className="absolute top-0 bottom-0 left-0 z-0"
                    style={{ 
                      width: `${hundredPercentWidth}%`,
                      background: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #fca5a5 2px, #fca5a5 4px)'
                    }}
                  />

                  {/* Actual Value Bar */}
                  <div 
                    className="absolute top-0 bottom-0 left-0 bg-red-600 z-10"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>

                <span className="w-12 text-right text-slate-800 font-bold text-lg">
                  {item.value}%
                </span>
              </div>
            );
          })
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-slate-400 font-medium text-sm">
              No exposure percentage data available.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
