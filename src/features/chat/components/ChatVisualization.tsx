import React from 'react';



import {



  BarChart, Bar,



  PieChart, Pie, Cell,



  LineChart, Line,



  XAxis, YAxis, CartesianGrid, Tooltip, Legend,



  ResponsiveContainer



} from 'recharts';



import { Download, FileSpreadsheet, Loader2, Table as TableIcon, BarChart3, PieChart as PieIcon, LineChart as LineChartIcon, Image as ImageIcon } from 'lucide-react';



import { Button } from '@/src/ui-kit';



import { Visualization } from '../types';



import { apiService } from '@/src/services/api.service';



import { defaultConfig } from '@/src/services/api.config';



import { toPng } from 'html-to-image';







interface ChatVisualizationProps {



  visualization: Visualization;



}







const COLORS = ['var(--accent)', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];







const cleanFilename = (fn?: string) => {

  if (!fn) return 'export_data.csv';

  return fn.replace(/^(write_query_|query_|sql_)+/i, '');

};



export const ChatVisualization = React.memo(({ visualization }: ChatVisualizationProps) => {



  const [isDownloading, setIsDownloading] = React.useState(false);







  const handleDownloadCsv = async (viz: any) => {

    setIsDownloading(true);

    try {

      const userId = localStorage.getItem('DAgent_user_id');

      const finalName = cleanFilename(viz.filename || 'export.csv');

      const rawSql = (viz.sql_query || '').trim();
      let queryB64 = '';
      try {
        queryB64 = rawSql ? btoa(unescape(encodeURIComponent(rawSql))) : '';
      } catch (e) {
        queryB64 = '';
      }

      await apiService.download(
        '/api/export-query-csv',
        {
          session_id: viz.session_id || localStorage.getItem('DAgent_session_id'),
          user_id: userId ? parseInt(userId, 10) : undefined,
          query_b64: queryB64,
          sql_query_b64: queryB64,
          ...(queryB64 ? {} : { sql_query: rawSql }),
          filename: finalName,
        },
        finalName
      );



    } catch (err) {



      console.error("[CSV Download Error]", err);



    } finally {



      setIsDownloading(false);



    }



  };







  if (visualization.type === 'csv_export') {
    const rawName = cleanFilename(visualization.filename);
    const displayName = rawName.length > 40 ? `${rawName.slice(0, 36)}...csv` : rawName;

    return (
      <div className="my-3 w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md">
        <div className="flex items-center justify-between gap-3">
          {/* File icon and title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800 truncate" title={rawName}>
                {displayName}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
                <span className="font-semibold text-emerald-600">
                  {visualization.total_records ? `${Number(visualization.total_records).toLocaleString()} records` : 'Complete Dataset'}
                </span>
                <span>•</span>
                <span>CSV File</span>
              </div>
            </div>
          </div>

          {/* Download button */}
          <button
            type="button"
            onClick={() => handleDownloadCsv(visualization)}
            disabled={isDownloading}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all border-none cursor-pointer disabled:opacity-50"
          >
            {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            <span>{isDownloading ? "Downloading..." : "Download CSV"}</span>
          </button>
        </div>
      </div>
    );
  }

  const { type, data, title, columns, xKey = 'label', yKey = 'value' } = visualization;







  const resolveKeys = () => {



    if (!data || data.length === 0) return { x: xKey, y: yKey };



    const firstItem = data[0];



    const itemKeys = Object.keys(firstItem);







    let x = xKey;



    let y = yKey;







    // If xKey doesn't exist, try common field names or first key



    if (!(xKey in firstItem)) {



      x = itemKeys.find(k => ['category', 'label', 'name', 'brand', 'date', 'type', 'group', 'id'].includes(k.toLowerCase())) || itemKeys[0];



    }







    // If yKey doesn't exist, try common field names (preferring numbers)



    if (!(yKey in firstItem)) {



      y = itemKeys.find(k => k !== x && typeof firstItem[k] === 'number')



        || itemKeys.find(k => k !== x && !isNaN(parseFloat(firstItem[k])))



        || itemKeys.find(k => k !== x && (['value', 'count', 'amount', 'price', 'total', 'quantity'].includes(k.toLowerCase())))



        || itemKeys.find(k => k !== x)



        || itemKeys[1];



    }







    return { x, y };



  };







  const { x: resolvedXKey, y: resolvedYKey } = resolveKeys();







  const sortedData = React.useMemo(() => {



    if (!data || data.length === 0) return data;



    const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];



    const SHORT_MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];







    return [...data].sort((a, b) => {



      const valA = String(a[resolvedXKey]).toLowerCase().trim();



      const valB = String(b[resolvedXKey]).toLowerCase().trim();



      



      const monthIndexA = MONTHS.indexOf(valA) !== -1 ? MONTHS.indexOf(valA) : SHORT_MONTHS.indexOf(valA);



      const monthIndexB = MONTHS.indexOf(valB) !== -1 ? MONTHS.indexOf(valB) : SHORT_MONTHS.indexOf(valB);



      



      if (monthIndexA !== -1 && monthIndexB !== -1) {



        return monthIndexA - monthIndexB;



      }



      // If one is a month and the other isn't, we just keep original order or we could handle dates here too.



      // But keeping original if not explicitly both months is safer for general data.



      return 0;



    });



  }, [data, resolvedXKey]);







  const getLabel = (key?: string) => {



    if (!key) return '';



    if (columns) {



      const col = columns.find(c => c.key === key);



      if (col) return col.label;



    }



    return String(key).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());



  };







  const xLabel = getLabel(resolvedXKey);



  const yLabel = getLabel(resolvedYKey);







  const formatValue = (value: any) => {



    if (typeof value !== 'number') return value;



    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;



    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;



    return value.toString();



  };







  const formatXAxisTick = (value: any) => {



    if (typeof value === 'string') {



      if (/^\d{4}-\d{2}$/.test(value)) {



        const [year, month] = value.split('-');



        const date = new Date(parseInt(year), parseInt(month) - 1);



        return date.toLocaleString('default', { month: 'short', year: 'numeric' });



      }



      if (/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value)) {



        const date = new Date(value);



        if (!isNaN(date.getTime())) {



           return date.toLocaleDateString('default', { month: 'short', day: 'numeric' });



        }



      }



    }



    return value;



  };







  const chartRef = React.useRef<HTMLDivElement>(null);







  const handleDownloadPng = async () => {



    if (!chartRef.current) return;







    try {



      const dataUrl = await toPng(chartRef.current, {



        backgroundColor: 'var(--bg)',



        pixelRatio: 3,



        cacheBust: true,



        filter: (node: HTMLElement) => {



          const exclusionClass = 'download-button-exclude';



          return !(node.classList && node.classList.contains(exclusionClass));



        }



      });



      const link = document.createElement('a');



      link.download = `${title || 'chart'}.png`;



      link.href = dataUrl;



      link.click();



    } catch (err) {



      console.error('Failed to download PNG:', err);



    }



  };







  const handleDownload = () => {
    if (!data || data.length === 0) return;

    const tableColumns = (columns && columns.length > 0) ? columns : Object.keys(data[0]).map(key => ({ key, label: key }));
    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headerRow = tableColumns.map(c => escapeCsv(c.label || c.key)).join(",");
    const dataRows = data.map(row =>
      tableColumns.map(c => escapeCsv(row[c.key] ?? '')).join(",")
    ).join("\r\n");

    const csvContent = "\uFEFF" + headerRow + "\r\n" + dataRows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const baseName = (title || 'export').replace(/[^a-zA-Z0-9_-]+/g, '_');
    link.download = `${cleanFilename(baseName)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };







  const renderTable = () => {



    if (!sortedData || sortedData.length === 0) return null;



    const tableColumns = (columns && columns.length > 0) ? columns : Object.keys(sortedData[0]).map(key => ({ key, label: key }));







    return (



      <div className="bg-[var(--bg)] rounded-xl border border-[var(--border)] overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-black/5">



        <div className="flex justify-between items-center p-3 border-b border-[var(--border)] bg-[var(--surface)]/50 backdrop-blur-sm gap-4">



          <div className="flex items-center gap-2 min-w-0">



            <TableIcon className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />



            <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] truncate" title={title || 'Data Table'}>{title || 'Data Table'}</span>



          </div>



          <button



            type="button"



            onClick={handleDownload}



            title="Download CSV"



            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors shrink-0 cursor-pointer shadow-sm"



          >



            <Download className="w-4 h-4" />



          </button>



        </div>



        <div className="overflow-x-auto max-h-64 custom-scrollbar">



          <table className="w-full text-left text-xs border-collapse">



            <thead className="bg-[var(--surface)] sticky top-0 z-10">



              <tr>



                {tableColumns.map(col => (



                  <th key={col.key} className="px-4 py-2.5 font-bold text-[var(--text-secondary)] border-b border-[var(--border)] uppercase tracking-tighter shadow-sm">



                    {col.label}



                  </th>



                ))}



              </tr>



            </thead>



            <tbody className="divide-y divide-[var(--border)]/50">



              {sortedData.map((row, i) => (



                <tr key={i} className="hover:bg-[var(--accent)]/5 transition-colors group">



                  {tableColumns.map(col => {



                    const isMonetary = /(value|revenue|sales|price|cost|amount|margin)/i.test(col.label || col.key);



                    let cellVal = row[col.key];



                    if (isMonetary && typeof cellVal === 'number') cellVal = `₹${cellVal.toLocaleString()}`;



                    else if (isMonetary && typeof cellVal === 'string' && /^\s*[\d,.]+/.test(cellVal) && !cellVal.includes('₹') && !cellVal.includes('%')) {



                      cellVal = `₹${cellVal.replace(/\$/g, '').trim()}`;



                    } else if (typeof cellVal === 'string') {



                      cellVal = cellVal.replace(/\$/g, '₹');



                    }



                    return (



                      <td key={`${i}-${col.key}`} className="px-4 py-2.5 font-mono text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">



                        {cellVal}



                      </td>



                    );



                  })}



                </tr>



              ))}



            </tbody>



          </table>



        </div>



      </div>



    );



  };







  const renderBarChart = () => (



    <div ref={chartRef} className="bg-[var(--bg)] rounded-xl border border-[var(--border)] p-4 transition-all duration-300 hover:shadow-lg hover:shadow-black/5">



      <div className="flex justify-between items-center mb-4 gap-4">



        <div className="flex items-center gap-2 min-w-0">



          <BarChart3 className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />



          <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] truncate" title={title || 'Bar Chart'}>{title || 'Bar Chart'}</span>



        </div>



        <button



          type="button"



          onClick={handleDownloadPng}



          title="Download PNG"



          className="download-button-exclude w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors shrink-0 cursor-pointer shadow-sm"



        >



          <Download className="w-4 h-4" />



        </button>



      </div>



      <div className="h-64 w-full" >



        <ResponsiveContainer width="100%" height="100%">



          <BarChart data={sortedData} margin={{ top: 10, right: 10, left: 55, bottom: 45 }}>



            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />



            <XAxis



              dataKey={resolvedXKey}



              stroke="var(--text-secondary)"



              fontSize={12}



              tickLine={false}



              axisLine={false}



              tick={{ fill: 'var(--text-secondary)' }}



              tickFormatter={formatXAxisTick}



              label={{ value: xLabel, position: 'insideBottom', offset: -25, fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 'bold' }}



            />



            <YAxis



              stroke="var(--text-secondary)"



              fontSize={12}



              tickLine={true}



              axisLine={true}



              tick={{ fill: 'var(--text-secondary)' }}



              tickFormatter={formatValue}



              width={50}



              label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: -10, fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 'bold', style: { textAnchor: 'middle' } }}



            />



            <Tooltip



              wrapperStyle={{ zIndex: 100 }}



              cursor={{ fill: 'var(--accent)', opacity: 0.05 }}



              contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}



              itemStyle={{ color: 'var(--accent)', fontWeight: 'bold' }}



              labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 'bold' }}



              labelFormatter={formatXAxisTick}



              formatter={(value: any) => [typeof value === 'number' ? value.toLocaleString() : value, yLabel]}



            />



            <Bar dataKey={resolvedYKey} fill="var(--accent)" radius={[4, 4, 0, 0]} barSize={32} />



          </BarChart>



        </ResponsiveContainer>



      </div>



    </div>



  );







  const renderPieChart = () => (



    <div ref={chartRef} className="bg-[var(--bg)] rounded-xl border border-[var(--border)] p-4 transition-all duration-300 hover:shadow-lg hover:shadow-black/5">



      <div className="flex justify-between items-center mb-4 gap-4">



        <div className="flex items-center gap-2 min-w-0">



          <PieIcon className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />



          <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] truncate" title={title || 'Pie Chart'}>{title || 'Pie Chart'}</span>



        </div>



        <button



          type="button"



          onClick={handleDownloadPng}



          title="Download PNG"



          className="download-button-exclude w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors shrink-0 cursor-pointer shadow-sm"



        >



          <Download className="w-4 h-4" />



        </button>



      </div>



      <div className="h-64 w-full" >



        <ResponsiveContainer width="100%" height="100%">



          <PieChart>



            <Pie



              data={sortedData}



              cx="50%"



              cy="50%"



              innerRadius={60}



              outerRadius={80}



              paddingAngle={5}



              dataKey={resolvedYKey}



              nameKey={resolvedXKey}



              label={({ value }) => `${value}`}



            >



              {sortedData.map((entry, index) => (



                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />



              ))}



            </Pie>



            <Tooltip



              wrapperStyle={{ zIndex: 100 }}



              contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}



              labelFormatter={formatXAxisTick}



              formatter={(value: any, name: any) => [typeof value === 'number' ? value.toLocaleString() : value, name]}



            />



            <Legend



              verticalAlign="bottom"



              height={36}



              iconType="circle"



              formatter={(value) => <span className="text-[10px] text-[var(--text-secondary)] font-bold">{value}</span>}



            />



          </PieChart>



        </ResponsiveContainer>



      </div>



    </div>



  );







  const renderLineChart = () => {



    if (!sortedData || sortedData.length === 0) return null;







    let chartData = sortedData;



    let lines = [resolvedYKey];







    // Use seriesKey for grouping if provided



    const groupKey = visualization.seriesKey;







    if (groupKey) {



      const groupedData: Record<string, any> = {};



      const uniqueLines = new Set<string>();







      sortedData.forEach(item => {



        const xVal = item[resolvedXKey];



        const groupVal = item[groupKey];



        const yVal = item[resolvedYKey];







        if (!groupedData[xVal]) {



          groupedData[xVal] = { [resolvedXKey]: xVal };



        }



        groupedData[xVal][groupVal] = yVal;



        uniqueLines.add(groupVal);



      });







      const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];



      const SHORT_MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];







      // Sort by xKey chronologically if they are date/month strings, otherwise alphabetically



      chartData = Object.values(groupedData).sort((a, b) => {



        const valA = String(a[resolvedXKey]).toLowerCase().trim();



        const valB = String(b[resolvedXKey]).toLowerCase().trim();



        



        // Month sorting check



        const monthIndexA = MONTHS.indexOf(valA) !== -1 ? MONTHS.indexOf(valA) : SHORT_MONTHS.indexOf(valA);



        const monthIndexB = MONTHS.indexOf(valB) !== -1 ? MONTHS.indexOf(valB) : SHORT_MONTHS.indexOf(valB);



        



        if (monthIndexA !== -1 && monthIndexB !== -1) {



          return monthIndexA - monthIndexB;



        }







        const dateA = Date.parse(valA);



        const dateB = Date.parse(valB);



        if (!isNaN(dateA) && !isNaN(dateB)) {



          return dateA - dateB;



        }



        return valA.localeCompare(valB);



      });



      lines = Array.from(uniqueLines);



    }







    const hasLegend = lines.length > 1;







    return (



      <div ref={chartRef} className="bg-[var(--bg)] rounded-xl border border-[var(--border)] p-4 transition-all duration-300 hover:shadow-lg hover:shadow-black/5">



        <div className="flex justify-between items-center mb-4 gap-4">



          <div className="flex items-center gap-2 min-w-0">



            <LineChartIcon className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />



            <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] truncate" title={title || 'Line Chart'}>{title || 'Line Chart'}</span>



          </div>



          <button



            type="button"



            onClick={handleDownloadPng}



            title="Download Chart as PNG"



            className="download-button-exclude flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all shadow-sm shrink-0 cursor-pointer"



          >



            <Download className="w-4 h-4 text-[var(--accent)]" />



            <span>Export PNG</span>



          </button>



        </div>



        <div className={`w-full ${hasLegend ? 'h-72' : 'h-64'}`} >



          <ResponsiveContainer width="100%" height="100%">



            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 55, bottom: hasLegend ? 80 : 45 }}>



              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />



              <XAxis



                dataKey={resolvedXKey}



                stroke="var(--text-secondary)"



                fontSize={12}



                tickLine={false}



                axisLine={true}



                tick={{ fill: 'var(--text-secondary)' }}



                tickFormatter={formatXAxisTick}



                height={hasLegend ? 45 : 30}



                label={{ value: xLabel, position: 'insideBottom', offset: hasLegend ? 15 : -25, fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 'bold' }}



              />



              <YAxis



                stroke="var(--text-secondary)"



                fontSize={12}



                tickLine={true}



                axisLine={true}



                tick={{ fill: 'var(--text-secondary)' }}



                tickFormatter={formatValue}



                width={50}



                label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: -10, fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 'bold', style: { textAnchor: 'middle' } }}



              />



              <Tooltip



                wrapperStyle={{ zIndex: 100 }}



                contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}



                itemStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}



                labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 'bold' }}



                labelFormatter={formatXAxisTick}



                formatter={(value: any, name: any) => [typeof value === 'number' ? value.toLocaleString() : value, name === resolvedYKey ? yLabel : getLabel(name)]}



              />



              {hasLegend && (



                <Legend



                  verticalAlign="bottom"



                  height={36}



                  iconType="circle"



                  wrapperStyle={{ paddingTop: '10px' }}



                  formatter={(value) => <span className="text-[10px] text-[var(--text-secondary)] font-bold">{getLabel(value)}</span>}



                />



              )}



              {lines.map((lineKey, idx) => (



                <Line



                  key={lineKey}



                  type="monotone"



                  dataKey={lineKey}



                  name={lineKey}



                  stroke={COLORS[idx % COLORS.length]}



                  strokeWidth={3}



                  dot={{ r: 4, fill: COLORS[idx % COLORS.length] }}



                  activeDot={{ r: 6 }}



                />



              ))}



            </LineChart>



          </ResponsiveContainer>



        </div>



      </div>



    );



  };







  switch (type) {



    case 'table': return renderTable();



    case 'bar_chart': return renderBarChart();



    case 'pie_chart': return renderPieChart();



    case 'line_chart': return renderLineChart();



    default: return null;



  }



});







ChatVisualization.displayName = 'ChatVisualization';



