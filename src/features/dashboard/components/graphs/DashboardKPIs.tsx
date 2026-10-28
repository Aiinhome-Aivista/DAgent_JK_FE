import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { RefreshCw } from "lucide-react";
import { defaultConfig } from "@/src/services/api.config";

export const DashboardKPIs = () => {
  const [isLoading, setIsLoading] = useState(false);
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

  const fetchMetrics = async (question: string, answer: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${defaultConfig.baseUrl}/graph-metrics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question, answer }),
      });
      const data = await response.json();
      if (data.status === "success" && data.data) {
        const newMetrics = Object.values(data.data).filter(Boolean) as Array<{
          label?: string;
          name?: string;
          value?: string;
          revenue?: string;
          change?: string;
          subtext?: string;
        }>;

        if (Object.keys(data.data).length > 0) {
          const sortedKeys = Object.keys(data.data).sort((a, b) => {
            const numA = parseInt(a.replace(/\D/g, "")) || 0;
            const numB = parseInt(b.replace(/\D/g, "")) || 0;
            return numA - numB;
          });
          const sortedMetrics = sortedKeys.map(k => data.data[k]).filter(Boolean) as Array<{
            label?: string; name?: string; value?: string; revenue?: string; change?: string; subtext?: string;
          }>;

          setMetrics(sortedMetrics.map((m, i) => ({
            label: m.label ?? "Metric " + (i + 1),
            value: m.value ?? m.revenue ?? m.change ?? "N/A",
            subtext: m.subtext ?? m.name ?? "",
          })));
        }
      }
    } catch (error) {
      console.error("Failed to fetch graph metrics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const fetchDefaultMetrics = async (sessionId: string, zone?: string | null) => {
    setIsLoading(true);
    try {
      const url = `${defaultConfig.baseUrl}/default-dashboard-metrics${zone ? `?zone=${encodeURIComponent(zone)}` : ''}`;
      const response = await fetch(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ session_id: sessionId }),
        },
      );
      const data = await response.json();
      if (data.status === "success" && data.data) {
        const newMetrics = Object.values(data.data).filter(Boolean) as Array<{
          label?: string;
          value?: string;
          subtext?: string;
        }>;

        if (Object.keys(data.data).length > 0) {
          const sortedKeys = Object.keys(data.data).sort((a, b) => {
            const numA = parseInt(a.replace(/\D/g, "")) || 0;
            const numB = parseInt(b.replace(/\D/g, "")) || 0;
            return numA - numB;
          });
          const sortedMetrics = sortedKeys.map(k => data.data[k]).filter(Boolean) as Array<{
            label?: string; value?: string; subtext?: string;
          }>;

          setMetrics(sortedMetrics.map((m, i) => ({
            label: m.label ?? "Metric " + (i + 1),
            value: m.value ?? "N/A",
            subtext: m.subtext ?? "",
          })));
        }
      } else if (data.status === "error") {
        toast.error(
          data.message || data.details || "Failed to fetch default metrics",
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
    const sessionId = localStorage.getItem("DAgent_session_id");
    if (sessionId) {
      fetchDefaultMetrics(sessionId, selectedZone);
    }

    const handleSessionIdUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.sessionId) {
        fetchDefaultMetrics(customEvent.detail.sessionId, selectedZone);
      }
    };
    
    const handleZoneChange = (e: any) => {
      setSelectedZone(e.detail);
      const sid = localStorage.getItem("DAgent_session_id");
      if (sid) fetchDefaultMetrics(sid, e.detail);
    };

    window.addEventListener("session-id-updated", handleSessionIdUpdated);
    window.addEventListener("zone-changed", handleZoneChange);
    
    return () => {
      window.removeEventListener("session-id-updated", handleSessionIdUpdated);
      window.removeEventListener("zone-changed", handleZoneChange);
    };
  }, [selectedZone]);

  useEffect(() => {
    const handleChatMetricsUpdate = (event: CustomEvent) => {
      const { question, answer } = event.detail;
      setLastQuery({ question, answer });
      fetchMetrics(question, answer);
    };

    window.addEventListener(
      "chat-metrics-update",
      handleChatMetricsUpdate as EventListener,
    );
    return () => {
      window.removeEventListener(
        "chat-metrics-update",
        handleChatMetricsUpdate as EventListener,
      );
    };
  }, []);

  const handleRefresh = () => {
    const sessionId = localStorage.getItem("DAgent_session_id");
    if (sessionId) fetchDefaultMetrics(sessionId);
  };

  const renderSkeleton = () => (
    <div className="flex flex-col gap-2 w-full flex-1 min-h-0 overflow-y-auto pr-1">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="bg-white p-[14px] rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2 shrink-0"
        >
          <div className="h-2.5 bg-slate-200 rounded w-24 mt-1 animate-pulse"></div>
          <div className="min-w-0">
            <div className="h-5 bg-slate-200 rounded w-20 my-1 animate-pulse"></div>
            <div className="h-2 bg-slate-100 rounded w-28 mt-1 animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-3 w-full h-full">
      <div className="flex justify-between items-center px-1 shrink-0">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Key Metrics
        </h3>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50"
          title="Refresh Metrics"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {isLoading ? (
        renderSkeleton()
      ) : (
        <div className="flex flex-col gap-2 w-full flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="bg-white p-[14px] rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center gap-1.5 shrink-0"
            >
              <p
                className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 truncate"
                title={metric.label}
              >
                {metric.label}
              </p>
              <div className="min-w-0">
                <h3 className="text-[1.1rem] font-black text-slate-700 leading-tight my-0.5 uppercase truncate">
                  {(() => {
                    let formattedVal: React.ReactNode = "";
                    const nonCurrencyMetrics = ["Billing Scope", "Dealer Spread", "Attrition", "New Dealer", "Rotation"];
                    
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
                      return parts.map((part, index) => {
                        if (/^(CR|Cr|cr)$/i.test(part)) {
                          return (
                            <span key={index}>
                              C<span className="lowercase">r</span>
                            </span>
                          );
                        }
                        return (
                          <React.Fragment key={index}>{part}</React.Fragment>
                        );
                      });
                    }
                    return formattedVal;
                  })()}
                </h3>
                <p className="text-[9px] text-slate-400 mt-0.5 truncate" title={metric.subtext}>
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
