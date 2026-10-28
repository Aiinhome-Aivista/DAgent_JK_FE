import React, { useState } from "react";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { useConnectorContext } from "../../../../context/ConnectorContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from "recharts";

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

const formatInlineMarkdown = (text: string) => {
  if (!text) return "";
  let escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  escaped = escaped.replace(
    /\*\*([^*]+)\*\*/g,
    '<strong class="font-bold text-[var(--text-primary)]">$1</strong>',
  );
  escaped = escaped.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
  return escaped;
};

export const GenericDashboardGraphs = () => {
  const { connectorResults } = useConnectorContext();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!connectorResults?.report_content) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-[var(--text-secondary)]">
        No report content available.
      </div>
    );
  }

  const report = connectorResults.report_content.report || "";
  const charts = connectorResults.report_content.charts || [];

  // Parse report into summary and insights
  const rawLines = typeof report === 'string' ? report.split('\n') : [];
  const execSummary: string[] = [];
  const keyInsights: string[] = [];
  
  let currentSection = 'summary';
  for (const line of rawLines) {
    if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
      currentSection = 'insights';
      keyInsights.push(line.replace(/^[•-]\s*/, '').trim());
    } else if (line.trim() !== '') {
      if (currentSection === 'summary' && !line.toLowerCase().startsWith('title:')) {
        execSummary.push(line.trim());
      } else if (currentSection === 'insights') {
        // If it's a normal paragraph after bullets, keep as summary
        execSummary.push(line.trim());
        currentSection = 'summary';
      }
    }
  }

  const renderChart = (chart: any, index: number) => {
    if (!chart || !chart.datasets || chart.datasets.length === 0) return null;

    const data = chart.labels.map((label: string, i: number) => ({
      name: label,
      value: chart.datasets[0].data[i]
    }));

    return (
      <div key={index} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 h-[300px] flex flex-col">
        <h4 className="font-semibold text-slate-800 text-sm mb-1">{chart.title}</h4>
        <p className="text-xs text-slate-500 mb-4">{chart.description}</p>
        <div className="flex-1 min-h-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            {chart.chart_type === 'pie' ? (
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            ) : chart.chart_type === 'line' ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={2} dot={{ r: 4, fill: '#4F46E5' }} activeDot={{ r: 6 }} />
              </LineChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip cursor={{ fill: '#F1F5F9' }} />
                <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* Header & Summary */}
      <div className="p-6 pb-2 border-b border-slate-200/60 bg-white">
        <div className="flex items-start gap-4 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100/50 flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full" />
            <Sparkles className="w-5 h-5 text-indigo-600 relative z-10" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
              Analysis Report
            </h3>
          </div>
        </div>

        <div className="pl-12 -mt-1">
          <div className="flex flex-col gap-1.5">
            {!isExpanded ? (
              <div className="flex items-end justify-between gap-4">
                <div
                  className="text-slate-600 text-sm leading-relaxed font-normal line-clamp-2 flex-1"
                  dangerouslySetInnerHTML={{
                    __html: formatInlineMarkdown(execSummary.join("\n\n")),
                  }}
                />
                <button
                  onClick={() => setIsExpanded(true)}
                  className="shrink-0 flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer focus:outline-none mb-0.5"
                >
                  Read More
                </button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4 mb-4"
              >
                <div
                  className="flex flex-col gap-2 text-slate-600 text-sm leading-relaxed font-normal"
                  dangerouslySetInnerHTML={{
                    __html: formatInlineMarkdown(execSummary.join("\n\n"))
                  }}
                />

                {keyInsights.length > 0 && (
                  <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                        <Sparkles className="w-3 h-3" />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Key Insights
                      </span>
                    </div>
                    <ul className="flex flex-col gap-2.5 mt-1">
                      {keyInsights.map((insight, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 group">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0 group-hover:scale-125 transition-transform" />
                          <span
                            className="text-sm text-slate-600 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(insight) }}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Show Less
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {charts.map((chart: any, i: number) => renderChart(chart, i))}
        </div>
      </div>
    </div>
  );
};
