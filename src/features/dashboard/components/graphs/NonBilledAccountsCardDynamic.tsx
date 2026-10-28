import React, { useState, useEffect } from "react";
import { defaultConfig, API_ENDPOINTS } from "@/src/services/api.config";
import { useSessionId } from "./dashboardHooks";

import { Loader2 } from "lucide-react";

interface NonBilledAccountsCardProps {
  zone?: string | null;
}

export const NonBilledAccountsCardDynamic: React.FC<NonBilledAccountsCardProps> = ({ zone }) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const sessionId = useSessionId();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (!sessionId || sessionId === "null") {
          setIsLoading(false);
          return;
        }
        const url = `${defaultConfig.baseUrl}${API_ENDPOINTS.DASHBOARD.NON_BILLED_ACCOUNTS}?session_id=${sessionId}${zone ? `&zone=${encodeURIComponent(zone)}` : ''}`;
        const response = await fetch(url);
        const json = await response.json();
        
        if (json.status === "success" && json.data) {
          const mappedData = json.data.map((item: any) => ({
            title: item.category_name,
            value: `${parseFloat(item.nonBilledPct).toFixed(0)}%`
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
        console.error("Error fetching non billed accounts", e);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [sessionId, zone]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 flex flex-col h-full min-h-[300px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-start gap-4 mb-6">
        <h3 className="text-slate-800 font-bold text-lg text-left">
          Non Billed Accounts %
        </h3>
      </div>

      <div className="flex-1 flex items-center justify-center">
        {isLoading ? (
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        ) : data.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {data.map((item, index) => (
              <div
                key={index}
                className="bg-indigo-50 rounded-xl p-6 flex flex-col items-center justify-center gap-4"
              >
                <span className="text-slate-800 font-bold text-sm text-center">
                  {item.title}
                </span>
                <span className="text-slate-800 text-lg sm:text-xl font-medium">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-slate-400 font-medium text-sm">
            No non-billed accounts data available.
          </span>
        )}
      </div>
    </div>
  );
};
