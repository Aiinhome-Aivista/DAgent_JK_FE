import React, { useState, useEffect } from "react";
import { defaultConfig, API_ENDPOINTS } from "@/src/services/api.config";
import { useSessionId } from "./dashboardHooks";

import { Loader2 } from "lucide-react";

export const CategorySalesCardDynamic = ({ zone }: { zone?: string | null }) => {
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
        const url = `${defaultConfig.baseUrl}${API_ENDPOINTS.DASHBOARD.CATEGORY_SALES}?session_id=${sessionId}${zone ? `&zone=${encodeURIComponent(zone)}` : ''}`;
        const response = await fetch(url);
        const json = await response.json();
        
        if (json.status === "success" && json.data) {
          const formattedData = json.data.map((item: any) => ({
            title: item.category,
            value: `${item.total_sales_cr} Cr`
          }));
          setData(formattedData);
        } else {
          setData([]);
        }
      } catch (e) {
        console.error("Error fetching category sales", e);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [sessionId, zone]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 flex flex-col min-h-[300px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-start gap-4 mb-6">
        <h3 className="text-slate-800 font-bold text-lg text-left">
          Category Sales
        </h3>
      </div>
      
      <div className="flex-1 min-h-[200px] flex items-center justify-center">
        {isLoading ? (
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        ) : data.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
            {data.map((item, index) => (
              <div
                key={index}
                className="bg-indigo-50 rounded-xl p-4 flex flex-col items-center justify-center gap-2"
              >
                <span className="text-slate-800 font-bold text-lg">
                  {item.value}
                </span>
                <span className="text-slate-800 text-sm font-semibold text-center">
                  {item.title}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-slate-400 font-medium text-sm">
            No category sales data available.
          </span>
        )}
      </div>
    </div>
  );
};
