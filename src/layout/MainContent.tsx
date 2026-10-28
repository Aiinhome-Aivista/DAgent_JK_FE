import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { AgentWorkflow } from "../features/workflow";
import { ConnectorForm } from "../features/connectors";
import { AdminPanel } from "../features/admin";
import { MainContentProps } from "../types/layout";

export const MainContent: React.FC<MainContentProps> = ({
  activeTab,
  adminSubTab,
  setAdminSubTab,
  workflowKey,
  chatKey,
  initialChatMessage,
  selectedConnector,
  handleWorkflowComplete,
  changeTab,
  handleBackToConnectors,
  handleStartWorkflow,
  handleForwardWithContext,
  handleCreateWorkspaceFromSummary,
  onNewSessionCreated,
  sessionId,
  workspaceName,
  workspaceType,
  isWorkspacesLoading,
}) => {
  return (
    <div
      className={`py-4 w-full flex-1 min-h-0 overflow-hidden ${(activeTab === "chat" || activeTab === "admin") ? "max-w-none px-6" : "max-w-6xl mx-auto"}`}
    >
      <AnimatePresence mode="wait">
        {activeTab === "chat" ? (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-[calc(100vh-5.5rem)]"
          >
            <AgentWorkflow
              key={`chat-${workflowKey}`} //Chat key remove to prevent redundent dashboard graph api call
              onComplete={handleWorkflowComplete}
              defaultAgentId="query"
              onChangeTab={changeTab}
              initialChatMessage={initialChatMessage}
              onNewSessionCreated={onNewSessionCreated}
              sessionId={sessionId}
              workspaceName={workspaceName}
              workspaceType={workspaceType}
              chatKey={chatKey}
              isWorkspacesLoading={isWorkspacesLoading}
            />
          </motion.div>
        ) : activeTab === "new-connector" ? (
          <motion.div
            key="new-connector"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-[calc(100vh-5.5rem)] flex flex-col"
          >
            <ConnectorForm
              onBack={handleBackToConnectors}
              onTestSuccess={handleStartWorkflow}
            />
          </motion.div>
        ) : activeTab === "collection" ? (
          <motion.div
            key="collection"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-[calc(100vh-5.5rem)]"
          >
            <AgentWorkflow
              key={`ingest-${workflowKey}`}
              onComplete={handleWorkflowComplete}
              defaultAgentId="ingest"
              onChangeTab={changeTab}
              sessionId={sessionId}
              workspaceName={workspaceName}
            />
          </motion.div>
        ) : activeTab === "analysis" ? (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-[calc(100vh-5.5rem)]"
          >
            <AgentWorkflow
              key={`analysis-${workflowKey}`}
              onComplete={handleWorkflowComplete}
              defaultAgentId="analyze"
              onChangeTab={changeTab}
              onForwardWithContext={handleForwardWithContext}
              onCreateWorkspaceFromSummary={handleCreateWorkspaceFromSummary}
              sessionId={sessionId}
              workspaceName={workspaceName}
              workspaceType={workspaceType}
              isWorkspacesLoading={isWorkspacesLoading}
            />
          </motion.div>
        ) : activeTab === "connectors" ? (
          <motion.div
            key="connectors"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-[calc(100vh-5.5rem)]"
          >
            <AgentWorkflow
              key={`connectors-${workflowKey}`}
              onComplete={handleWorkflowComplete}
              defaultAgentId="connect"
              onChangeTab={changeTab}
              onNewConnector={() => changeTab("new-connector")}
              sessionId={sessionId}
              workspaceName={workspaceName}
              workspaceType={workspaceType}
              isWorkspacesLoading={isWorkspacesLoading}
            />
          </motion.div>
        ) : activeTab === "admin" ? (
          <motion.div
            key="admin"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-[calc(100vh-5.5rem)]"
          >
            <AdminPanel adminSubTab={adminSubTab} setAdminSubTab={setAdminSubTab} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
