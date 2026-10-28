import { Workspace } from '../services/workspace.service';
import { Connector } from '../features/connectors';
import { QuerySession } from '../services/chatHistory.service';

export type Tab = 'chat' | 'connectors' | 'new-connector' | 'collection' | 'analysis' | 'admin';
export type ViewMode = 'landing' | 'login' | 'admin-login' | 'app' | 'dashboard' | 'pricing' | 'privacy-policy' | 'terms-and-conditions' | 'help-center';
export type AdminTab = 'users' | 'workspaces' | 'assignUsers' | 'workspaceUsers' | 'company' | 'adminChats' | 'pendingKnowledge' | 'customPrompts' | 'scheduledReports' | 'kGraphReview' | 'llmConfig';

export interface SidebarProps {
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  selectedWorkspace: Workspace | null;
  setSelectedWorkspace: (ws: Workspace | null) => void;
  isWorkspaceOpen: boolean;
  setIsWorkspaceOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  workspaceSearch: string;
  setWorkspaceSearch: (search: string) => void;
  workspaces: Workspace[];
  setWorkspaces: (ws: Workspace[] | ((prev: Workspace[]) => Workspace[])) => void;
  isCreatingWorkspace: boolean;
  setIsCreatingWorkspace: (creating: boolean) => void;
  newWorkspaceName: string;
  setNewWorkspaceName: (name: string) => void;
  expandedWorkspaceId: number | null;
  setExpandedWorkspaceId: (id: number | null) => void;
  queryHistories: Record<number, QuerySession[]>;
  isQueryLoading: Record<number, boolean>;
  historySearch: string;
  setHistorySearch: (search: string) => void;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  adminSubTab: AdminTab;
  setAdminSubTab: (tab: AdminTab) => void;
  workflowKey: number;
  setWorkflowKey: (key: number | ((prev: number) => number)) => void;
  chatKey: number;
  setChatKey: (key: number | ((prev: number) => number)) => void;
  fetchWorkspaces: () => Promise<void>;
  fetchWorkspaceHistory: (workspaceId: number, sessionId: string, force?: boolean) => Promise<QuerySession[] | null>;
  handleLogout: () => void;
  resetConnectorState: () => void;
  agentService: any;
  setInitialChatMessage: (msg: string | undefined) => void;
  isWorkspacesLoading: boolean;
}

export interface AppHeaderProps {
  activeTab: Tab;
  selectedConnector: Connector | null;
}

export interface MainContentProps {
  activeTab: Tab;
  adminSubTab: AdminTab;
  setAdminSubTab: (tab: AdminTab) => void;
  workflowKey: number;
  chatKey: number;
  initialChatMessage: string | undefined;
  selectedConnector: Connector | null;
  handleWorkflowComplete: () => void;
  changeTab: (tab: Tab) => void;
  handleBackToConnectors: () => void;
  handleStartWorkflow: (connectionName?: string, shouldSwitchTab?: boolean) => Promise<void>;
  handleForwardWithContext?: (agentId: string, context: string) => void;
  handleCreateWorkspaceFromSummary?: (summary: string) => void;
  onNewSessionCreated?: () => void;
  sessionId?: string;
  workspaceName?: string;
  workspaceType?: string;
  isWorkspacesLoading?: boolean;
}
