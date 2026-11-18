import React, { useState, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Label,
  Cell,
} from "recharts";
import { COLORS } from "./mockData";
import { FilterSelect, useAvailableYears, useSessionId, queuedFetch } from "./dashboardHooks";
import { defaultConfig, API_ENDPOINTS } from "@/src/services/api.config";
import { getUserHierarchy } from "../../../../utils/userHierarchy";

interface TyreSalesChartDynamicProps {
  zone?: string | null;
  region?: string | null;
  lockZone?: boolean;
  lockRegion?: boolean;
}

export const TyreSalesChartDynamic = ({
  zone,
  region,
  lockZone = false,
  lockRegion = false,
}: TyreSalesChartDynamicProps) => {
  const {
    availableYears,
    availableZones,
    availableRegions,
    availableCustomerTypes,
    availableConstructionTypes,
  } = useAvailableYears();

  const sessionId = useSessionId();

  const userHierarchy = useMemo(() => getUserHierarchy(), []);
  const isUserZoneRestricted = lockZone || !!userHierarchy?.isZoneRestricted;
  const isUserRegionRestricted = lockRegion || !!userHierarchy?.isRegionRestricted;
  const restrictedZone = zone || userHierarchy?.zone_code || null;
  const restrictedRegion = region || userHierarchy?.region_code || null;

  const [tyreData, setTyreData] = useState<any[]>([]);
  const [isTyreLoading, setIsTyreLoading] = useState(true);
  const [tyreAxisLabels, setTyreAxisLabels] = useState({
    x: "Sales (₹)",
    y: "Category",
  });
  const [tyreChartTitle, setTyreChartTitle] = useState(
    "Top 10 Categories by Sales",
  );

  const [tyreYear, setTyreYear] = useState("ALL");
  const [tyreCustomerCategory, setTyreCustomerCategory] = useState("ALL");
  const [tyreZone, setTyreZone] = useState(() => {
    if (isUserZoneRestricted && restrictedZone && restrictedZone.toUpperCase() !== "ALL") {
      return restrictedZone;
    }
    return "ALL";
  });
  const [tyreRegion, setTyreRegion] = useState(() => {
    if (isUserRegionRestricted && restrictedRegion && restrictedRegion.toUpperCase() !== "ALL") {
      return restrictedRegion;
    }
    return "ALL";
  });
  const [tyreConstructionType, setTyreConstructionType] = useState("ALL");

  useEffect(() => {
    if (isUserZoneRestricted && restrictedZone && restrictedZone.toUpperCase() !== "ALL") {
      setTyreZone(restrictedZone);
    }
  }, [isUserZoneRestricted, restrictedZone]);

  useEffect(() => {
    if (isUserRegionRestricted && restrictedRegion && restrictedRegion.toUpperCase() !== "ALL") {
      setTyreRegion(restrictedRegion);
    }
  }, [isUserRegionRestricted, restrictedRegion]);

  // Find matching zone value from availableZones if available
  const displayZoneValue = useMemo(() => {
    const target = isUserZoneRestricted ? (restrictedZone || tyreZone) : tyreZone;
    if (!target || target.toUpperCase() === "ALL") return "ALL";
    const found = availableZones.find((z: any) => {
      const isObj = typeof z === "object" && z !== null;
      const v = isObj ? (z.value ?? z.val ?? z.zone_code ?? "") : z;
      const l = isObj ? (z.label ?? z.name ?? "") : z;
      return (
        String(v).trim().toUpperCase() === String(target).trim().toUpperCase() ||
        String(l).trim().toUpperCase() === String(target).trim().toUpperCase()
      );
    });
    if (found) {
      const isObj = typeof found === "object" && found !== null;
      return isObj ? (found.value ?? found.val ?? target) : found;
    }
    return target;
  }, [availableZones, tyreZone, isUserZoneRestricted, restrictedZone]);

  // Filter regions dynamically based on selected Zone (Hierarchical / Dependent)
  const filteredRegions = useMemo(() => {
    const activeZone = isUserZoneRestricted ? (restrictedZone || tyreZone) : tyreZone;
    if (!activeZone || activeZone.toUpperCase() === "ALL") {
      return availableRegions;
    }
    return availableRegions.filter((r: any) => {
      const isObj = typeof r === "object" && r !== null;
      const zCode = isObj ? (r.zone_code ?? r.zone ?? "") : "";
      const val = isObj ? (r.value ?? r.val ?? "") : r;
      if (String(val).toUpperCase() === "ALL") return true;
      return (
        String(zCode).trim().toUpperCase() === String(activeZone).trim().toUpperCase() ||
        String(zCode).trim().toUpperCase() === String(displayZoneValue).trim().toUpperCase()
      );
    });
  }, [availableRegions, tyreZone, isUserZoneRestricted, restrictedZone, displayZoneValue]);

  // Find matching region value from filteredRegions if available
  const displayRegionValue = useMemo(() => {
    const target = isUserRegionRestricted ? (restrictedRegion || tyreRegion) : tyreRegion;
    if (!target || target.toUpperCase() === "ALL") return "ALL";
    const found = filteredRegions.find((r: any) => {
      const isObj = typeof r === "object" && r !== null;
      const v = isObj ? (r.value ?? r.val ?? r.region_code ?? "") : r;
      const l = isObj ? (r.label ?? r.name ?? "") : r;
      return (
        String(v).trim().toUpperCase() === String(target).trim().toUpperCase() ||
        String(l).trim().toUpperCase() === String(target).trim().toUpperCase()
      );
    });
    if (found) {
      const isObj = typeof found === "object" && found !== null;
      return isObj ? (found.value ?? found.val ?? target) : found;
    }
    return target;
  }, [filteredRegions, tyreRegion, isUserRegionRestricted, restrictedRegion]);

  const zoneOptions = useMemo(() => {
    if (isUserZoneRestricted && displayZoneValue && displayZoneValue.toUpperCase() !== "ALL") {
      const matched = availableZones.filter((z: any) => {
        const isObj = typeof z === "object" && z !== null;
        const v = isObj ? (z.value ?? z.val ?? z.zone_code ?? "") : z;
        const l = isObj ? (z.label ?? z.name ?? "") : z;
        return (
          String(v).trim().toUpperCase() === String(displayZoneValue).trim().toUpperCase() ||
          String(l).trim().toUpperCase() === String(displayZoneValue).trim().toUpperCase()
        );
      });
      return matched.length > 0 ? matched : [{ label: displayZoneValue, value: displayZoneValue }];
    }
    return availableZones;
  }, [availableZones, isUserZoneRestricted, displayZoneValue]);

  const regionOptions = useMemo(() => {
    if (isUserRegionRestricted && displayRegionValue && displayRegionValue.toUpperCase() !== "ALL") {
      const matched = filteredRegions.filter((r: any) => {
        const isObj = typeof r === "object" && r !== null;
        const v = isObj ? (r.value ?? r.val ?? r.region_code ?? "") : r;
        const l = isObj ? (r.label ?? r.name ?? "") : r;
        return (
          String(v).trim().toUpperCase() === String(displayRegionValue).trim().toUpperCase() ||
          String(l).trim().toUpperCase() === String(displayRegionValue).trim().toUpperCase()
        );
      });
      return matched.length > 0 ? matched : [{ label: displayRegionValue, value: displayRegionValue }];
    }
    return filteredRegions;
  }, [filteredRegions, isUserRegionRestricted, displayRegionValue]);

  const handleZoneChange = (e: any) => {
    if (isUserZoneRestricted) return;
    const selectedZone = e?.target?.value ?? e;
    setTyreZone(selectedZone);
    setTyreRegion("ALL"); // Reset region to ALL whenever zone changes
  };

  useEffect(() => {
    const fetchTyreData = async () => {
      setIsTyreLoading(true);
      try {
        const userId = localStorage.getItem("DAgent_user_id");
        if (!sessionId || sessionId === "null") {
          setIsTyreLoading(false);
          return;
        }

        const effectiveZoneToSend = isUserZoneRestricted
          ? (restrictedZone || displayZoneValue || tyreZone)
          : (tyreZone && tyreZone.toUpperCase() !== "ALL" ? tyreZone : "ALL");

        const effectiveRegionToSend = isUserRegionRestricted
          ? (restrictedRegion || displayRegionValue || tyreRegion)
          : (tyreRegion && tyreRegion.toUpperCase() !== "ALL" ? tyreRegion : "ALL");

        const response = await queuedFetch(
          `${defaultConfig.baseUrl}${API_ENDPOINTS.DASHBOARD.TYRE_SALES_DATA}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: sessionId,
              question: "Top 10 Categories by Sales",
              user_id: userId,
              year: !tyreYear || tyreYear.toUpperCase() === "ALL" ? ["ALL"] : (isNaN(Number(tyreYear)) ? [tyreYear] : [Number(tyreYear)]),
              customer_category: [tyreCustomerCategory],
              zone: effectiveZoneToSend && effectiveZoneToSend.toUpperCase() !== "ALL" ? [effectiveZoneToSend] : ["ALL"],
              region: effectiveRegionToSend && effectiveRegionToSend.toUpperCase() !== "ALL" ? [effectiveRegionToSend] : ["ALL"],
              construction_type: [tyreConstructionType],
            }),
          },
        );
        const data = await response.json();
        if (
          data.status === "success" &&
          data.visualizations &&
          data.visualizations[0] &&
          data.visualizations[0].data
        ) {
          const mappedData = data.visualizations[0].data.map((item: any) => {
            let val = Number(item.sales_value);
            let plotValue = val;
            if (val >= 100000) {
              plotValue = val / 10000000;
            }
            return {
              name: item.vehicle_type || item.category || item.tyre_type || item.name || "Unknown",
              value: plotValue,
              sales_value: item.sales_value,
            };
          });

          const viz = data.visualizations[0];
          const formatLabel = (key: string) => {
            if (!key) return "";
            return key
              .split("_")
              .map(
                (word: string) => word.charAt(0).toUpperCase() + word.slice(1),
              )
              .join(" ");
          };
          let xLabel = formatLabel(viz.xKey) || "Sales Value";
          if (xLabel === "Sales Value") xLabel += " (₹)";
          let yLabel = formatLabel(viz.yKey) || "Category";
          if (yLabel === "Vehicle Type" || yLabel === "Tyre Type" || yLabel.toLowerCase().includes("tyre")) {
            yLabel = "Category";
          }
          setTyreAxisLabels({ x: xLabel, y: yLabel });
          if (viz.title) {
            const updatedTitle = viz.title
              .replace(/Top 10 Tyre Types by Sales/gi, "Top 10 Categories by Sales")
              .replace(/Top 10 Tyre Type by Sales/gi, "Top 10 Categories by Sales")
              .replace(/Tyre Types/gi, "Categories")
              .replace(/Tyre Type/gi, "Category");
            setTyreChartTitle(updatedTitle);
          } else {
            setTyreChartTitle("Top 10 Categories by Sales");
          }

          setTyreData(mappedData);
        }
      } catch (err) {
        console.error("Failed to fetch tyre sales data:", err);
      } finally {
        setIsTyreLoading(false);
      }
    };
    fetchTyreData();
  }, [
    tyreYear,
    tyreCustomerCategory,
    tyreZone,
    tyreRegion,
    tyreConstructionType,
    sessionId,
    zone,
    region,
    isUserZoneRestricted,
    isUserRegionRestricted,
    restrictedZone,
    restrictedRegion,
    displayZoneValue,
    displayRegionValue,
  ]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
      <div className="flex items-start justify-between mb-4 gap-4">
        <h3
          className="text-lg font-bold text-slate-800"
          style={{ flexShrink: 0 }}
        >
          {tyreChartTitle}
        </h3>
        <div
          className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-2 custom-h-scrollbar ml-auto"
          style={{ minWidth: 0 }}
        >
          <FilterSelect
            label="Year"
            value={tyreYear}
            onChange={(e) => setTyreYear(e.target.value)}
            options={availableYears}
          />
          <FilterSelect
            label="Zone"
            value={displayZoneValue}
            onChange={handleZoneChange}
            options={zoneOptions}
            disabled={isUserZoneRestricted}
          />
          <FilterSelect
            label="Region"
            value={displayRegionValue}
            onChange={(e) => setTyreRegion(e.target.value)}
            options={regionOptions}
            disabled={isUserRegionRestricted}
          />
          <FilterSelect
            label="Customer Category"
            value={tyreCustomerCategory}
            onChange={(e) => setTyreCustomerCategory(e.target.value)}
            options={availableCustomerTypes}
          />
          <FilterSelect
            label="Construction Type"
            value={tyreConstructionType}
            onChange={(e) => setTyreConstructionType(e.target.value)}
            options={availableConstructionTypes}
          />
        </div>
      </div>
      <div className="flex-1 min-h-0">
        {isTyreLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : tyreData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 font-medium text-sm">
            No data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart
              data={tyreData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 60, bottom: 20 }}
            >
              <CartesianGrid
                vertical={true}
                horizontal={false}
                stroke="#e2e8f0"
              />
              <XAxis
                type="number"
                padding={{ left: 1 }}
                tick={{ fontSize: 10, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => (val === 0 ? "₹0" : `₹${val} Cr`)}
              >
                <Label
                  value={tyreAxisLabels.x}
                  offset={5}
                  position="bottom"
                  style={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
                />
              </XAxis>
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10, fill: "#334155", fontWeight: 700 }}
                axisLine={{ stroke: "#475569", strokeWidth: 1 }}
                tickLine={false}
                tickMargin={10}
                width={100}
              >
                <Label
                  value={tyreAxisLabels.y}
                  angle={-90}
                  position="insideLeft"
                  style={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
                  offset={-10}
                />
              </YAxis>
              <RechartsTooltip
                wrapperStyle={{ zIndex: 1000 }}
                cursor={{ fill: "#f8fafc" }}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value: any, name: any, props: any) => {
                  const salesValue = props.payload.sales_value;
                  if (salesValue) {
                    let val = Number(salesValue);
                    let formatted = `₹${(val / 10000000).toFixed(2)} Cr`;
                    return [formatted, tyreAxisLabels.x.replace(" (₹)", "")];
                  }
                  return [
                    `₹${Number(value).toFixed(2)} Cr`,
                    tyreAxisLabels.x.replace(" (₹)", ""),
                  ];
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                {tyreData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
