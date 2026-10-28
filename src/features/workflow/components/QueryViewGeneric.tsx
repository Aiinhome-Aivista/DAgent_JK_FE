import React, { useMemo } from 'react';
import { ChatWindow } from '../../chat/components/ChatWindow';
import { ChatSummaryCard } from '../../../features/chat/components/ChatSummaryCard';
import { KPICard } from '../../../features/chat/components/KPICard';
import { DynamicChart } from '../../../features/chat/components/DynamicChart';
import { useConnectorContext } from '../../../context/ConnectorContext';
import { Loader2 } from 'lucide-react';

interface QueryViewGenericProps {
  sessionId?: string;
  workspaceName?: string;
  workspaceType?: string;
  chatCollapsed: boolean;
  setChatCollapsed: (collapsed: boolean) => void;
  chatKey?: number;
  initialChatMessage?: string;
  onChangeTab?: (tabId: string) => void;
  onNewSessionCreated?: () => void;
  isWorkspacesLoading?: boolean;
}

export const QueryViewGeneric: React.FC<QueryViewGenericProps> = ({
  sessionId,
  workspaceName,
  workspaceType,
  chatCollapsed,
  setChatCollapsed,
  chatKey,
  initialChatMessage,
  onChangeTab,
  onNewSessionCreated,
  isWorkspacesLoading
}) => {
  const { connectorResults, selectedConnector: activeConnector, isAnalyzing, sessionSources } = useConnectorContext();

  const chatSummaryData = useMemo(() => {
    let rawText = '';
    let extractedTitle: string | undefined = undefined;
    let extractedContent: string | undefined = undefined;
    let kpis: any[] = [];
    let charts: any[] = [];

    const isNewVisit = localStorage.getItem("current_visit_number") === "new";

    if (!isNewVisit) {
      try {
        let storedSession = localStorage.getItem('default_workspace_analysis');
        if (!storedSession || storedSession === '[]') {
          storedSession = localStorage.getItem('selected_query_session');
        }

        if (storedSession) {
          const parsed = JSON.parse(storedSession);
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (parsed[0].answer) {
              rawText = parsed[0].answer;
            }
            if (parsed[0].visualizations && Array.isArray(parsed[0].visualizations)) {
              parsed[0].visualizations.forEach((vis: any) => {
                if (['bar_chart', 'line_chart', 'pie_chart', 'bar', 'line', 'pie'].includes(vis.type)) {
                  let chartType = vis.type.replace('_chart', '');
                  let labels = [];
                  let datasets = [];

                  if (vis.data && vis.xKey && vis.yKey) {
                    labels = vis.data.map((d: any) => String(d[vis.xKey]));
                    datasets = [{
                      label: vis.yKey,
                      data: vis.data.map((d: any) => {
                        const val = d[vis.yKey];
                        return typeof val === 'number' ? val : parseFloat(val) || 0;
                      })
                    }];
                  } else if (vis.labels && vis.datasets) {
                    labels = vis.labels;
                    datasets = vis.datasets;
                  }

                  if (labels.length > 0) {
                    charts.push({
                      chart_type: chartType,
                      title: vis.title || '',
                      description: vis.description || '',
                      labels,
                      datasets
                    });
                  }
                } else if (vis.type === 'kpi') {
                  const rawValue = vis.value;
                  const safeValue = (rawValue !== null && rawValue !== undefined && typeof rawValue === 'object')
                    ? Object.entries(rawValue).map(([k, v]) => `${k}: ${v}`).join(' | ')
                    : String(rawValue ?? '');
                  kpis.push({
                    title: vis.title || vis.label || 'Metric',
                    value: safeValue,
                    description: vis.description || '',
                    trend: vis.trend || 'neutral'
                  });
                }
              });
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Prioritize connectorResults if it exists
    if (connectorResults) {
      // Clear out localStorage data if we have fresh connectorResults
      rawText = '';
      kpis = [];
      charts = [];

      if (typeof connectorResults.report_content === 'object' && connectorResults.report_content !== null) {
        let rc = connectorResults.report_content;
        // Sometimes the API wraps the payload inside an extra "report_content" key
        if (rc.report_content && typeof rc.report_content === 'object') {
          rc = rc.report_content;
        }

        if (rc.report || rc.kpis || rc.charts || rc.visualizations) {
          extractedContent = rc.report || '';
          kpis = rc.kpis || [];
          charts = rc.charts || rc.visualizations || [];

          // Try to extract title and remove follow-up questions from the report text
          if (typeof extractedContent === 'string') {
            // Strip out follow-up questions section
            const questionPatterns = [
              /follow[- ]?up questions?:?/i,
              /suggested questions?:?/i,
              /questions to ask:?/i,
              /key questions:?/i
            ];

            for (const pattern of questionPatterns) {
              const matchIndex = extractedContent.search(pattern);
              if (matchIndex !== -1) {
                extractedContent = extractedContent.substring(0, matchIndex).trim();
                break; // Only strip the first one found
              }
            }

            const lines = extractedContent.split('\n');
            const titleLineIndex = lines.findIndex(line => line.toLowerCase().includes('title:'));
            if (titleLineIndex !== -1) {
              let titleLine = lines[titleLineIndex];
              const match = titleLine.match(/title\s*:\s*(.*)/i);
              if (match) {
                extractedTitle = match[1].replace(/\*\*/g, '').replace(/#/g, '').trim();
              }
              lines.splice(titleLineIndex, 1);
              extractedContent = lines.join('\n').trim();
            }
          }
        } else {
          rawText = JSON.stringify(connectorResults.report_content);
        }
      } else if (typeof connectorResults.report_content === 'string') {
        rawText = connectorResults.report_content;
      } else if (connectorResults.report && typeof connectorResults.report === 'string') {
        // Fallback for when report is at root level
        rawText = connectorResults.report;
      } else if (typeof connectorResults.description === 'string') {
        rawText = connectorResults.description;
      } else if (connectorResults.description) {
        rawText = JSON.stringify(connectorResults.description);
      }
    }

    // console.log('--- QueryViewGeneric Debug ---');
    // console.log('connectorResults:', connectorResults);
    // console.log('rawText extracted:', rawText);
    // console.log('kpis extracted:', kpis);
    // console.log('charts extracted:', charts);

    if (rawText) {
      try {
        let jsonStr = rawText;

        const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1];
        } else {
          const firstBrace = rawText.indexOf('{');
          const lastBrace = rawText.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonStr = rawText.slice(firstBrace, lastBrace + 1);
          }
        }

        const parsedJson = JSON.parse(jsonStr);

        const rc = parsedJson.report_content || parsedJson;

        if (rc.report || rc.kpis || rc.charts || parsedJson.report) {
          extractedContent = rc.report || parsedJson.report || '';
          kpis = rc.kpis || [];
          charts = rc.charts || [];

          if (typeof extractedContent === 'string') {
            const lines = extractedContent.split('\n');
            const titleLineIndex = lines.findIndex(line => line.toLowerCase().includes('title:'));
            if (titleLineIndex !== -1) {
              let titleLine = lines[titleLineIndex];
              const match = titleLine.match(/title\s*:\s*(.*)/i);
              if (match) {
                extractedTitle = match[1].replace(/\*\*/g, '').replace(/#/g, '').trim();
              }
              lines.splice(titleLineIndex, 1);
              extractedContent = lines.join('\n').trim();
            }
          }
        } else {
          if (Array.isArray(parsedJson) && parsedJson.length > 0 && typeof parsedJson[0] === 'object') {
            const headers = Object.keys(parsedJson[0]);
            let table = '| ' + headers.join(' | ') + ' |\n';
            table += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
            parsedJson.forEach((row: any) => {
              table += '| ' + headers.map(h => String(row[h] || '')).join(' | ') + ' |\n';
            });
            extractedContent = "### Data Table\n\n" + table;
          } else {
            extractedContent = "```json\n" + JSON.stringify(parsedJson, null, 2) + "\n```";
          }
        }
      } catch (e) {
        const lines = rawText.split('\n');
        const titleLineIndex = lines.findIndex(line => line.toLowerCase().includes('title:'));

        if (titleLineIndex !== -1) {
          let titleLine = lines[titleLineIndex];
          const match = titleLine.match(/title\s*:\s*(.*)/i);
          if (match) {
            extractedTitle = match[1].replace(/\*\*/g, '').replace(/#/g, '').trim();
          }
          lines.splice(titleLineIndex, 1);
          extractedContent = lines.join('\n').trim();
        } else {
          extractedContent = rawText;
        }
      }
    }

    if (!extractedTitle && !isNewVisit) {
      try {
        const sessionName = localStorage.getItem('selected_query_session_name');
        if (sessionName && sessionName !== 'null') {
          extractedTitle = sessionName;
        }
      } catch (e) { }
    }

    if (!extractedTitle) {
      extractedTitle = activeConnector?.name ? `${activeConnector.name} Summary` : undefined;
    }

    return { title: extractedTitle, content: extractedContent, kpis, charts };
  }, [connectorResults?.description, connectorResults?.report_content, chatKey, activeConnector?.name, sessionId]);

  const hasData = chatSummaryData.content || (chatSummaryData.kpis && chatSummaryData.kpis.length > 0) || (chatSummaryData.charts && chatSummaryData.charts.length > 0);

  return (
    <div key={`layout-${workspaceType}-${sessionId}`} className="flex-1 flex overflow-hidden">
      <div className="flex-1 min-w-0 flex flex-col min-h-0">

        {/* Upper portion: Dynamic Content OR Blank state */}
        <div className="flex-1 min-h-0 flex flex-row overflow-hidden bg-[var(--surface)]/30 border-b border-[var(--border)]">

          {/* Left Column: Summary and Charts (Scrollable) */}
          <div className="flex-1 min-w-0 overflow-y-auto px-6 pt-6 pb-4">
            <div className="flex flex-col gap-6 h-full">
              {isAnalyzing || isWorkspacesLoading ? (
                <>
                  <div className="w-full shrink-0">
                    <ChatSummaryCard isLoading={true} />
                  </div>
                  <div className="grid grid-cols-2 gap-6 pb-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="border border-[var(--border)] shadow-sm bg-[var(--surface)] rounded-xl overflow-hidden flex flex-col h-[340px] animate-pulse">
                        <div className="p-4 pb-2 border-b border-[var(--border)]">
                          <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                        </div>
                        <div className="flex-1 p-4 flex items-end justify-between gap-2 opacity-50">
                          <div className="w-1/5 bg-slate-200 rounded-t" style={{ height: i === 1 ? '40%' : '80%' }}></div>
                          <div className="w-1/5 bg-slate-200 rounded-t" style={{ height: i === 1 ? '70%' : '30%' }}></div>
                          <div className="w-1/5 bg-slate-200 rounded-t" style={{ height: i === 1 ? '30%' : '60%' }}></div>
                          <div className="w-1/5 bg-slate-200 rounded-t" style={{ height: i === 1 ? '90%' : '40%' }}></div>
                          <div className="w-1/5 bg-slate-200 rounded-t" style={{ height: i === 1 ? '50%' : '100%' }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : hasData ? (
                <>
                  {/* Summary Card */}
                  {(chatSummaryData.title || chatSummaryData.content) ? (
                    <div className="w-full shrink-0">
                      <ChatSummaryCard
                        title={chatSummaryData.title}
                        content={chatSummaryData.content}
                      />
                    </div>
                  ) : null}

                  {/* Charts Grid */}
                  {chatSummaryData.charts?.length > 0 && (
                    <div className="grid grid-cols-2 gap-6 pb-4">
                      {chatSummaryData.charts.map((chart, idx) => (
                        <DynamicChart key={idx} config={chart} index={idx} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center min-h-[50vh]">
                  <div className="text-center text-[var(--text-secondary)]">
                    {(sessionSources && ((sessionSources.databases && sessionSources.databases.length > 0) || (sessionSources.topics && sessionSources.topics.length > 0))) ? (
                      <>
                        <p className="text-lg font-medium">Your data has been connected! 🚀</p>
                        <p className="text-sm mt-3 opacity-80 max-w-md mx-auto leading-relaxed">
                          To uncover insights and generate charts, please make sure to <b>Process</b> your data first. 
                          You can do this by navigating to the <b>Import</b> tab and clicking <b>Continue to Process</b> at the bottom. Once processed, you can ask your questions below!
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-lg font-medium">You have not processed any data.</p>
                        <p className="text-sm mt-3 opacity-80 max-w-md mx-auto leading-relaxed">
                          To start, expand the <b>"Speak to your data"</b> section below and click the three dots (...) menu to navigate to Data Sources and connect your data.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: KPIs Sidebar (Fixed Width, Scrollable) */}
          {(hasData || isAnalyzing || isWorkspacesLoading) && (
            <div className="w-52 shrink-0 border-l border-[var(--border)] bg-[var(--bg)] flex flex-col overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-3 pt-6 pb-4">
              {isAnalyzing || isWorkspacesLoading ? (
                <div className="flex flex-col gap-4 w-full">
                  <div className="flex items-center justify-between px-1 mb-1">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Key Metrics</h3>
                  </div>
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-[var(--surface)] p-[18px] rounded-2xl border border-[var(--border)] shadow-sm flex flex-col gap-2 shrink-0 animate-pulse"
                    >
                      <div className="h-3 bg-slate-200 rounded w-24 mt-1"></div>
                      <div className="min-w-0">
                        <div className="h-6 bg-slate-200 rounded w-20 my-1"></div>
                        <div className="h-2 bg-slate-100 rounded w-28 mt-2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : chatSummaryData.kpis?.length > 0 ? (
                <>
                  <div className="flex items-center justify-between px-1 mb-4">
                    <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Key Metrics</h3>
                  </div>
                  <div className="flex flex-col gap-4">
                    {chatSummaryData.kpis.map((kpi, idx) => (
                      <KPICard key={idx} kpi={{ ...kpi, description: '' }} index={idx} />
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* Lower portion: Chat */}
        <div className={`shrink-0 flex flex-col transition-all duration-300 ${chatCollapsed ? '' : 'h-[45%] min-h-[350px]'}`}>
          <ChatWindow
            initialMode="chat"
            initialMessage={initialChatMessage}
            onOpenDataSource={onChangeTab ? () => onChangeTab('connectors') : undefined}
            onNewSessionCreated={onNewSessionCreated}
            sessionId={sessionId}
            workspaceName={workspaceName}
            onCollapseChange={setChatCollapsed}
            chatKey={chatKey}
            isInitializing={isWorkspacesLoading || isAnalyzing}
          />
        </div>
      </div>
    </div>
  );
};
