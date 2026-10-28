import React from 'react';
import { ChatWindow } from '../../chat/components/ChatWindow';
import { DashboardGraphs, DashboardKPIs, GraphSidePanel } from '../../dashboard/components/DashboardCharts';
import { ChatSummaryCard } from '../../chat/components/ChatSummaryCard';
import { useConnectorContext } from '../../../context/ConnectorContext';

interface QueryViewSalesProps {
  sessionId?: string;
  workspaceName?: string;
  workspaceType?: string;
  chatCollapsed: boolean;
  setChatCollapsed: (collapsed: boolean) => void;
  chatKey?: number;
  initialChatMessage?: string;
  onChangeTab?: (tabId: string) => void;
  onNewSessionCreated?: () => void;
  activeGraphId: string | null;
  setActiveGraphId: (id: string | null) => void;
  isWorkspacesLoading?: boolean;
}

export const QueryViewSales: React.FC<QueryViewSalesProps> = ({
  sessionId,
  workspaceName,
  workspaceType,
  chatCollapsed,
  setChatCollapsed,
  chatKey,
  initialChatMessage,
  onChangeTab,
  onNewSessionCreated,
  activeGraphId,
  setActiveGraphId,
  isWorkspacesLoading
}) => {
  const { isAnalyzing } = useConnectorContext();

  return (
    <div key={`layout-${workspaceType}-${sessionId}`} className="flex-1 flex overflow-hidden">
      {/* Left Side: Split into Charts (upper) and Chat (lower) */}
      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        {/* Upper portion: Charts */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-0 bg-[var(--surface)]/30 border-b border-[var(--border)]">
          <DashboardGraphs isWorkspacesLoading={isWorkspacesLoading || isAnalyzing} />
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

      {/* Right side strip - scrollable KPIs + Graph buttons */}
      {!activeGraphId && (
        <div className="w-52 shrink-0 border-l border-[var(--border)] bg-[var(--bg)] flex flex-col overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="p-3 flex flex-col h-full">
            {/* KPIs */}
            <DashboardKPIs />
          </div>
        </div>
      )}
      {/* Graph Side Panel overlay */}
      <GraphSidePanel activeGraphId={activeGraphId} onClose={() => setActiveGraphId(null)} inline={true} />
    </div>
  );
};
