import React, { useState, useEffect } from "react";
import { defaultConfig, API_ENDPOINTS } from "@/src/services/api.config";
import {useSessionId, queuedFetch } from "./dashboardHooks";

import { Loader2 } from "lucide-react";

export const AccountCategorySalesCardDynamic = ({ zone }: { zone?: string | null }) => {
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
        const url = `${defaultConfig.baseUrl}${API_ENDPOINTS.DASHBOARD.SALES_BY_ACCOUNT_CATEGORY}?session_id=${sessionId}${zone ? `&zone=${encodeURIComponent(zone)}` : ''}`;
        const response = await queuedFetch(url);
        const json = await response.json();
        
        if (json.status === "success" && json.data) {
          const mappedData = json.data.map((item: any) => ({
            title: item.title || item.TITLE || item.label || item.category || "Account Category",
            value: item.value || item.VALUE || (item.valCr ? `₹${item.valCr} Cr` : "-")
          }));
          setData(mappedData);
        } else {
          setData([]);
        }
      } catch (e) {
        console.error("Error fetching account category sales", e);
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
          Actual Sales by Account Category (Cr)
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
                className="bg-gradient-to-br from-amber-50 to-orange-100/70 border border-amber-200/60 rounded-xl p-5 flex flex-col items-center justify-center gap-3 shadow-xs hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-200/60 text-amber-900 text-[11px] font-bold tracking-wider uppercase">
                  {item.title}
                </div>
                <div className="text-slate-800 text-xl font-bold tracking-tight text-center">
                  {String(item.value).includes('₹') ? item.value : `₹${item.value}${String(item.value).includes('Cr') ? '' : ' Cr'}`}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-slate-400 font-medium text-sm">
            No account category sales data available.
          </span>
        )}
      </div>
    </div>
  );
};
