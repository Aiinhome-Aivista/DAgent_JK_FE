import React, { useState, useRef } from "react";
import { Plus, Minus, Download } from "lucide-react";
import { toPng } from "html-to-image";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";

export const coverageMarkers = [
  {
    name: "Delhi",
    coordinates: [77.1025, 28.7041],
    coverage: 85,
    color: "#0ea5e9",
    region: "North",
  },
  {
    name: "Jaipur",
    coordinates: [75.7873, 26.9124],
    coverage: 65,
    color: "#84cc16",
    region: "North",
  },
  {
    name: "Lucknow",
    coordinates: [80.9462, 26.8467],
    coverage: 45,
    color: "#3b82f6",
    region: "North",
  },
  {
    name: "Bhopal",
    coordinates: [77.4126, 23.2599],
    coverage: 55,
    color: "#6366f1",
    region: "Central",
  },
  {
    name: "Kolkata",
    coordinates: [88.3639, 22.5726],
    coverage: 90,
    color: "#06b6d4",
    region: "East",
  },
  {
    name: "Hyderabad",
    coordinates: [78.4867, 17.385],
    coverage: 75,
    color: "#ef4444",
    region: "South",
  },
  {
    name: "Bengaluru",
    coordinates: [77.5946, 12.9716],
    coverage: 95,
    color: "#ec4899",
    region: "South",
  },
  {
    name: "Chennai",
    coordinates: [80.2707, 13.0827],
    coverage: 80,
    color: "#f59e0b",
    region: "South",
  },
  {
    name: "Mumbai",
    coordinates: [72.8777, 19.076],
    coverage: 92,
    color: "#a855f7",
    region: "West",
  },
];

export const IndiaCoverageMap = ({
  year,
  month,
  region,
}: {
  year?: string;
  month?: string;
  region?: string;
}) => {
  const [position, setPosition] = useState({ coordinates: [82, 23], zoom: 1 });
  const [tooltipContent, setTooltipContent] = useState("");

  const handleZoomIn = () => {
    if (position.zoom >= 4) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom * 1.5 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom / 1.5 }));
  };

  const handleMoveEnd = (position: any) => {
    setPosition(position);
  };

  return (
    <div className="relative w-full h-full bg-white overflow-hidden">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 850,
          center: [82, 23],
        }}
        width={500}
        height={580}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup
          zoom={position.zoom}
          center={position.coordinates as [number, number]}
          onMoveEnd={handleMoveEnd}
        >
          <Geographies geography="/india-states-combined.geojson">
            {({ geographies }) =>
              geographies.map((geo) => {
                const isOutline = geo.properties._isOutline === true;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isOutline ? "#f8fafc" : "#f8fafc"}
                    stroke={isOutline ? "#475569" : "#64748b"}
                    strokeWidth={isOutline ? 1 : 0.5}
                    style={{
                      default: { outline: "none" },
                      hover: {
                        fill: isOutline ? "#f8fafc" : "#f1f5f9",
                        outline: "none",
                      },
                      pressed: {
                        fill: isOutline ? "#f8fafc" : "#e2e8f0",
                        outline: "none",
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
          {coverageMarkers
            .filter((m) => !region || region === "All" || m.region === region)
            .map(({ name, coordinates, coverage, color }) => (
              <Marker
                key={name}
                coordinates={coordinates as [number, number]}
                onMouseEnter={() => {
                  setTooltipContent(`${name} - ${coverage}% Coverage`);
                }}
                onMouseLeave={() => {
                  setTooltipContent("");
                }}
              >
                <circle
                  r={5}
                  fill={color}
                  stroke="#fff"
                  strokeWidth={1.5}
                  className="cursor-pointer transition-all duration-300"
                />
              </Marker>
            ))}
        </ZoomableGroup>
      </ComposableMap>

      {/* Custom Tooltip */}
      {tooltipContent && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg z-10 pointer-events-none transition-opacity">
          {tooltipContent}
        </div>
      )}

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex flex-col shadow-sm border border-slate-200 rounded-md overflow-hidden">
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors border-b border-slate-200"
          aria-label="Zoom in"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          aria-label="Zoom out"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const IndiaMapGraph = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [year, setYear] = useState("All");
  const [month, setMonth] = useState("All");
  const [region, setRegion] = useState("All");

  const handleDownload = async () => {
    if (!chartRef.current) return;
    try {
      const dataUrl = await toPng(chartRef.current, {
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = "india-coverage-map.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download chart", err);
    }
  };

  return (
    <div
      ref={chartRef}
      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full"
    >
      <div className="flex flex-col mb-4 gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-slate-800">
            India coverage by region
          </h3>
          <button
            onClick={handleDownload}
            className="flex items-center justify-center p-1.5 md:p-2 rounded-lg transition-all text-slate-500 hover:text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
            title="Download Graph"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
        <div
          className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-2 w-full custom-h-scrollbar"
          style={{ minWidth: 0 }}
        >
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="px-2 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 outline-none cursor-pointer flex-1 sm:flex-none shrink-0"
            style={{ flexShrink: 0, minWidth: "110px" }}
          >
            <option value="All">Year: All</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
          </select>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-2 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 outline-none cursor-pointer flex-1 sm:flex-none shrink-0"
            style={{ flexShrink: 0, minWidth: "110px" }}
          >
            <option value="All">Month: All</option>
            <option value="Jan">Jan</option>
            <option value="Feb">Feb</option>
            <option value="Mar">Mar</option>
            <option value="Apr">Apr</option>
            <option value="May">May</option>
            <option value="Jun">Jun</option>
            <option value="Jul">Jul</option>
            <option value="Aug">Aug</option>
            <option value="Sep">Sep</option>
            <option value="Oct">Oct</option>
            <option value="Nov">Nov</option>
            <option value="Dec">Dec</option>
          </select>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="px-2 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 outline-none cursor-pointer flex-1 sm:flex-none shrink-0"
            style={{ flexShrink: 0, minWidth: "110px" }}
          >
            <option value="All">Region: All</option>
            <option value="North">North</option>
            <option value="South">South</option>
            <option value="East">East</option>
            <option value="West">West</option>
            <option value="Central">Central</option>
          </select>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <IndiaCoverageMap year={year} month={month} region={region} />
      </div>
    </div>
  );
};
