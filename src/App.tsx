import { ThemeProvider, useTheme, Button } from './ui-kit';
import { Toaster } from 'react-hot-toast';
import { ConnectorList, ConnectorForm, Connector } from './features/connectors';
import { ConnectorProvider, useConnectorContext } from './context/ConnectorContext';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { ChatWindow } from './features/chat';
import { AgentWorkflow } from './features/workflow';
import { LandingPage } from './features/marketing/components/LandingPage';
import { PricingPage } from './features/marketing/components/PricingPage';
import { PrivacyPolicyPage } from './features/marketing/components/PrivacyPolicyPage';
import { TermsConditionsPage } from './features/marketing/components/TermsConditionsPage';
import { HelpCenterPage } from './features/marketing/components/HelpCenterPage';
import { LoginPage } from './features/auth/components/LoginPage';
import { Dashboard } from './features/dashboard/components/Dashboard';
import { Moon, Sun, Layout, Settings, LogOut, Menu, MessageSquare, Database, Plus, Sparkles, BarChart3, Clock, Search, ChevronDown, User, Check, X, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useMemo } from 'react';
import { agentService } from './services/agent.service';
import { AgentHistoryItem } from './features/workflow/types';
import { workspaceService, Workspace } from './services/workspace.service';
import { connectorService } from './services/connector.service';
import { chatHistoryService, QuerySession } from './services/chatHistory.service';

import { Sidebar } from './layout/Sidebar';
import { AdminTab } from './types/layout';
import { AppHeader } from './layout/AppHeader';
import { MainContent } from './layout/MainContent';
import { Tab, ViewMode } from './types/layout';

function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const { userId, roleId, roleName, logout } = useAuthContext();
  const [viewMode, setViewMode] = useState<ViewMode>(
    userId ? 'app' :
    window.location.pathname.startsWith('/admin/login') ? 'admin-login' : 
    window.location.pathname.startsWith('/pricing') ? 'pricing' : 
    window.location.pathname.startsWith('/privacy-policy') ? 'privacy-policy' : 
    window.location.pathname.startsWith('/terms-and-conditions') ? 'terms-and-conditions' : 
    window.location.pathname.startsWith('/help-center') ? 'help-center' : 
    'landing'
  );
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>(roleName === 'Admin' ? 'admin' : 'chat');
  const { selectedConnector, setSelectedConnector, resetConnectorState } = useConnectorContext();
  const [justFinishedWorkflow, setJustFinishedWorkflow] = useState(false);
  const [initialChatMessage, setInitialChatMessage] = useState<string | undefined>(undefined);
  const [chatKey, setChatKey] = useState(0);
  const [adminSubTab, setAdminSubTab] = useState<AdminTab>('company');
  const [historySearch, setHistorySearch] = useState('');

  // Workspace state
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [workspaceSearch, setWorkspaceSearch] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(() => {
    try {
      const stored = localStorage.getItem('DAgent_active_workspace');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Force chat component to unmount/remount and clear its internal state
  // whenever the user switches to a different workspace
  useEffect(() => {
    if (selectedWorkspace?.id) {
      setChatKey(prev => prev + 1);
      setWorkflowKey(prev => typeof prev === 'number' ? prev + 1 : prev); // also resetting workflowKey
    }
  }, [selectedWorkspace?.id]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [workflowKey, setWorkflowKey] = useState(0);
  const [isWorkspacesLoading, setIsWorkspacesLoading] = useState(false);

  // Per-workspace history state
  const [expandedWorkspaceId, setExpandedWorkspaceId] = useState<number | null>(null);
  const [queryHistories, setQueryHistories] = useState<Record<number, QuerySession[]>>({});
  const [isQueryLoading, setIsQueryLoading] = useState<Record<number, boolean>>({});

  const fetchWorkspaces = async (isInitialLoad = false) => {
    setIsWorkspacesLoading(true);
    try {
      const response = await workspaceService.getWorkspaces(userId || 6);
      if (response && response.status === 'success' && response.workspaces) {
        const fetchedWorkspaces: Workspace[] = response.workspaces;
        setWorkspaces(fetchedWorkspaces);

        // Always sync selection with the active workspace from API
        const activeWS = fetchedWorkspaces.find(w => w.is_active === 1) || fetchedWorkspaces[0];
        if (activeWS) {
          setSelectedWorkspace(activeWS);
          localStorage.setItem('DAgent_session_id', activeWS.session_id);
          localStorage.setItem('DAgent_active_workspace', JSON.stringify(activeWS));
          window.dispatchEvent(new CustomEvent('session-id-updated', { detail: { sessionId: activeWS.session_id } }));

          if (isInitialLoad) {
            try {
              const queryResponse = await chatHistoryService.getSessionChatHistory(activeWS.session_id, userId);
              if (queryResponse && queryResponse.status === 'success' && queryResponse.querySessions) {
                setQueryHistories(prev => ({ ...prev, [activeWS.id]: queryResponse.querySessions }));
                
                const sessions = queryResponse.querySessions;
                
                const currentVisit = localStorage.getItem('current_visit_number');
                const hasSelectedSession = localStorage.getItem('selected_query_session');

                if (sessions.length === 0) {
                  localStorage.setItem('is_default_chat', 'true');
                  localStorage.removeItem('default_workspace_analysis');
                  window.dispatchEvent(new Event('default-workspace-updated'));
                  setExpandedWorkspaceId(activeWS.id);
                } else if (sessions.length > 0) {
                  // Find the latest default session and save it for the dashboard layout
                  let defaultSession = null;
                  for (let i = sessions.length - 1; i >= 0; i--) {
                    if (sessions[i].querySessionName?.trim().toLowerCase().startsWith('default')) {
                      defaultSession = sessions[i];
                      break;
                    }
                  }
                  if (defaultSession && defaultSession.querySessionHistory) {
                    localStorage.setItem('default_workspace_analysis', JSON.stringify(defaultSession.querySessionHistory));
                    window.dispatchEvent(new Event('default-workspace-updated'));
                  } else {
                    localStorage.removeItem('default_workspace_analysis');
                    window.dispatchEvent(new Event('default-workspace-updated'));
                  }
                  if (activeWS.id === selectedWorkspace?.id) {
                    window.dispatchEvent(new Event('default-workspace-updated'));
                  }

                  // Restore missing session data if we have a current_visit_number but no actual data
                  if (currentVisit && !hasSelectedSession) {
                    const targetSession = sessions.find((s: any) => s.querySessionId === `session_visit_${currentVisit}`);
                    if (targetSession && targetSession.querySessionHistory) {
                      localStorage.setItem('selected_query_session', JSON.stringify(targetSession.querySessionHistory));
                      if (targetSession.querySessionName) {
                        localStorage.setItem('selected_query_session_name', targetSession.querySessionName);
                      }
                      setChatKey(prev => prev + 1);
                    }
                  } 
                  // Fresh auto-select for initial load
                  else if (!hasSelectedSession && !currentVisit) {
                    let sessionToSelect = sessions[sessions.length - 1]; // fallback to latest
                    // Try to find the latest default session
                    for (let i = sessions.length - 1; i >= 0; i--) {
                      if (sessions[i].querySessionName?.trim().toLowerCase().startsWith('default')) {
                        sessionToSelect = sessions[i];
                        break;
                      }
                    }

                    if (sessionToSelect) {
                      if (sessionToSelect.querySessionHistory) {
                        localStorage.setItem('selected_query_session', JSON.stringify(sessionToSelect.querySessionHistory));
                      }
                      if (sessionToSelect.querySessionId) {
                        localStorage.setItem('current_visit_number', sessionToSelect.querySessionId.replace('session_visit_', ''));
                      }
                      if (sessionToSelect.querySessionName) {
                        localStorage.setItem('selected_query_session_name', sessionToSelect.querySessionName);
                      }
                      if (sessionToSelect.querySessionName && sessionToSelect.querySessionName.trim().toLowerCase().startsWith('default')) {
                        localStorage.setItem('is_default_chat', 'true');
                      } else {
                        localStorage.removeItem('is_default_chat');
                      }
                    }
                    setExpandedWorkspaceId(activeWS.id);
                    setChatKey(prev => prev + 1);
                  }
                }
              }
            } catch (err) {
              console.error('Failed to auto-fetch workspace history:', err);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch workspaces:', err);
    } finally {
      setIsWorkspacesLoading(false);
    }
  };

  const fetchWorkspaceHistory = async (workspaceId: number, sessionId: string, force?: boolean) => {
    // If clicking the already expanded one, close it immediately
    if (!force && expandedWorkspaceId === workspaceId) {
      setExpandedWorkspaceId(null);
      return null;
    }

    // Toggle expansion state IMMEDIATELY for zero-delay UX
    setExpandedWorkspaceId(workspaceId);

    // If we already have query history, we might not need to fetch again
    if (!force && queryHistories[workspaceId]) {
      return queryHistories[workspaceId];
    }

    setIsQueryLoading(prev => ({ ...prev, [workspaceId]: true }));
    try {
      // Fetch Query History only
      const queryResponse = await chatHistoryService.getSessionChatHistory(sessionId, userId);

      if (queryResponse && queryResponse.status === 'success' && queryResponse.querySessions) {
        setQueryHistories(prev => ({ ...prev, [workspaceId]: queryResponse.querySessions }));

        const sessions = queryResponse.querySessions;
        if (sessions.length > 0) {
          let defaultSession = null;
          for (let i = sessions.length - 1; i >= 0; i--) {
            if (sessions[i].querySessionName?.trim().toLowerCase().startsWith('default')) {
              defaultSession = sessions[i];
              break;
            }
          }
          if (defaultSession && defaultSession.querySessionHistory) {
            localStorage.setItem('default_workspace_analysis', JSON.stringify(defaultSession.querySessionHistory));
            window.dispatchEvent(new Event('default-workspace-updated'));
          } else {
            localStorage.removeItem('default_workspace_analysis');
            window.dispatchEvent(new Event('default-workspace-updated'));
          }
        } else {
          localStorage.removeItem('default_workspace_analysis');
          window.dispatchEvent(new Event('default-workspace-updated'));
        }

        return queryResponse.querySessions;
      }
    } catch (err) {
      console.error('Failed to fetch workspace history:', err);
    } finally {
      setIsQueryLoading(prev => ({ ...prev, [workspaceId]: false }));
    }
    return null;
  };

  useEffect(() => {
    if (userId || viewMode === 'app') {
      // Force default chat session selection on reload by clearing current selections
      localStorage.removeItem('current_visit_number');
      localStorage.removeItem('selected_query_session');
      localStorage.removeItem('selected_query_session_name');
      
      fetchWorkspaces(true);
    }
  }, [userId, viewMode]);


  const handleLogin = () => setViewMode('login');
  const handleGetStarted = () => setViewMode('login');
  const handleLoginSuccess = () => {
    const storedRoleName = localStorage.getItem('DAgent_role_name');
    const isAdmin = storedRoleName === 'Admin';
    window.history.pushState({}, '', isAdmin ? '/admin' : '/');
    setViewMode('app');
    setIsWorkspaceOpen(false);
    setSidebarOpen(false);
    setActiveTab(isAdmin ? 'admin' : 'chat');
  };
  const handleBackToLanding = () => {
    window.history.pushState({}, '', '/');
    setViewMode('landing');
  };

  const handleLogout = () => {
    const wasAdmin = roleName === 'Admin' || localStorage.getItem('DAgent_role_name') === 'Admin';
    logout();
    resetConnectorState();
    agentService.reset();
    window.history.pushState({}, '', wasAdmin ? '/admin/login' : '/');
    setViewMode(wasAdmin ? 'admin-login' : 'landing');
    setIsWorkspaceOpen(false);
    setActiveTab('chat');
    localStorage.clear();
  };

  const handleNewConnector = () => {
    setSelectedConnector(null);
    changeTab('new-connector');
  };

  const handleSelectConnector = (connector: Connector) => {
    setSelectedConnector(connector);
    changeTab('new-connector');
  };

  const handleBackToConnectors = () => {
    setSelectedConnector(null);
    changeTab('connectors');
  };

  const handleStartWorkflow = async (connectionName?: string, shouldSwitchTab: boolean = false) => {
    const name = connectionName || 'New Connection';

    // Set as active connector for the session
    setSelectedConnector({
      id: 'temp-' + Date.now(),
      name: name,
      description: `Connected to ${name}`,
      type: 'Database',
      icon: 'database',
      status: 'connected'
    });


    // Redirect to connectors tab so user stays in the data source view if requested
    if (shouldSwitchTab) {
      changeTab('collection');
    } else {
      changeTab('connectors');
    }
  };

  const handleWorkflowComplete = () => {
    // Wait a bit then switch to chat
    setTimeout(() => {
      setJustFinishedWorkflow(true);
      setActiveTab('chat');
    }, 1500);
  };

  const changeTab = (tab: Tab) => {
    if (tab !== 'chat') {
      setJustFinishedWorkflow(false);
      setInitialChatMessage(undefined);
    }
    setActiveTab(tab);
  };

  const handleForwardWithContext = (agentId: string, context: string) => {
    if (agentId === 'query') {
      setInitialChatMessage(context);
      setChatKey(prev => prev + 1); // Force re-render of chat agent workflow to pick up new context
    }
  };

  const handleCreateWorkspaceFromSummary = async (summary: string) => {
    if (!userId || !selectedWorkspace) return;

    // Format date as DD_MM_YYYY
    const date = new Date();
    const formattedDate = `${String(date.getDate()).padStart(2, '0')}_${String(date.getMonth() + 1).padStart(2, '0')}_${date.getFullYear()}`;
    const defaultName = `default_${formattedDate}`;

    // Identify this as a read-only default chat summary container
    localStorage.setItem('is_default_chat', 'true');

    // Clear the initial message
    setInitialChatMessage(undefined);

    try {
      let nextVisitNumber = 1;
      let existingSessionHistory: any[] = [];
      let isExisting = false;

      // Try to determine next visit number or find existing session starting with "default_"
      try {
        const queryResponse = await chatHistoryService.getSessionChatHistory(selectedWorkspace.session_id, userId);
        if (queryResponse && queryResponse.querySessions && queryResponse.querySessions.length > 0) {
          const existingSession = queryResponse.querySessions.find(s => s.querySessionName.startsWith('default_'));

          if (existingSession) {
            isExisting = true;
            nextVisitNumber = parseInt(existingSession.querySessionId.replace('session_visit_', ''));
            if (isNaN(nextVisitNumber)) nextVisitNumber = 1;
            existingSessionHistory = existingSession.querySessionHistory || [];
          } else {
            const maxVisit = Math.max(...queryResponse.querySessions.map(s => {
              const num = parseInt(s.querySessionId.replace('session_visit_', ''));
              return isNaN(num) ? 1 : num;
            }));
            nextVisitNumber = maxVisit + 1;
          }
        }
      } catch (e) {
        console.error('Failed to fetch chat history for visit number calculation', e);
      }

      // Always keep the question as defaultName so its name in the DB remains default_DD_MM_YYYY
      const questionToUse = defaultName;

      const newTurn = {
        question: questionToUse,
        answer: summary,
        visualizations: [],
        follow_up_questions: ["What are the key takeaways?", "Can we dive deeper into the anomalies?", "What actions should we take next?"]
      };

      // Check if the summary actually changed
      const isSummaryChanged = existingSessionHistory.length === 0 || existingSessionHistory[0].answer !== summary;

      // We maintain the history object for the sidebar and database
      let newSessionHistory = [];
      if (isExisting && existingSessionHistory.length > 0) {
        newSessionHistory = [...existingSessionHistory];
        newSessionHistory[0] = {
          ...newSessionHistory[0],
          question: questionToUse, // ensure question is default_DD_MM_YYYY
          answer: summary,
          visualizations: [],
          follow_up_questions: newTurn.follow_up_questions
        };
      } else {
        newSessionHistory = [newTurn];
      }

      if (isSummaryChanged) {
        // Save/update in database only if summary/data has changed
        try {
          await chatHistoryService.saveSessionChatHistory({
            session_id: selectedWorkspace.session_id,
            user_id: userId,
            question: questionToUse,
            answer: summary,
            visit_number: nextVisitNumber,
            mode: 'answer',
            is_update: isExisting
          });
        } catch (e) {
          console.error("Failed to save to backend, continuing UI update", e);
        }
      }

      // Optimistically add or update it in the sidebar
      const updatedSessionNode = {
        querySessionName: defaultName,
        querySessionId: `session_visit_${nextVisitNumber}`,
        querySessionHistory: newSessionHistory
      };

      setQueryHistories(prev => {
        const existing = prev[selectedWorkspace.id] || [];
        if (isExisting) {
          return {
            ...prev,
            [selectedWorkspace.id]: existing.map(s => s.querySessionId === updatedSessionNode.querySessionId ? updatedSessionNode : s)
          };
        } else {
          // Prevent duplicate if somehow fetch succeeded
          if (existing.some(s => s.querySessionId === updatedSessionNode.querySessionId)) {
            return prev;
          }
          return {
            ...prev,
            [selectedWorkspace.id]: [...existing, updatedSessionNode]
          };
        }
      });

      // Set local storage so chat window and sidebar consider it active
      localStorage.setItem('selected_query_session', JSON.stringify(newSessionHistory));
      localStorage.setItem('current_visit_number', nextVisitNumber.toString());
      localStorage.setItem('selected_query_session_name', defaultName);
      localStorage.setItem('default_workspace_analysis', JSON.stringify(newSessionHistory));
      window.dispatchEvent(new Event('default-workspace-updated'));

      // Now switch to chat tab
      changeTab('chat');
      setChatKey(prev => prev + 1);
      setWorkflowKey(prev => typeof prev === 'number' ? prev + 1 : prev);

      // Force expand the workspace
      setExpandedWorkspaceId(selectedWorkspace.id);
    } catch (err) {
      console.error('Failed to create/update query session from summary:', err);
    }
  };

  const handleNewSessionCreated = () => {
    // Refresh the workspace history to pick up the newly created query session
    if (selectedWorkspace) {
      fetchWorkspaceHistory(selectedWorkspace.id, selectedWorkspace.session_id, true);
    }
  };

  const navigateToPricing = () => {
    window.history.pushState({}, '', '/pricing');
    setViewMode('pricing');
  };

  const navigateToLanding = () => {
    window.history.pushState({}, '', '/');
    setViewMode('landing');
  };

  if (viewMode === 'landing') {
    return <LandingPage onGetStarted={handleGetStarted} onLogin={handleLogin} onDashboardClick={() => setViewMode('dashboard')} onPricingClick={navigateToPricing} />;
  }

  if (viewMode === 'pricing') {
    return <PricingPage onGetStarted={handleGetStarted} onLogin={handleLogin} onBackToLanding={navigateToLanding} />;
  }

  if (viewMode === 'privacy-policy') {
    return <PrivacyPolicyPage onGetStarted={handleGetStarted} onLogin={handleLogin} onBackToLanding={navigateToLanding} onPricingClick={navigateToPricing} />;
  }

  if (viewMode === 'terms-and-conditions') {
    return <TermsConditionsPage onGetStarted={handleGetStarted} onLogin={handleLogin} onBackToLanding={navigateToLanding} onPricingClick={navigateToPricing} />;
  }

  if (viewMode === 'help-center') {
    return <HelpCenterPage onGetStarted={handleGetStarted} onLogin={handleLogin} onBackToLanding={navigateToLanding} onPricingClick={navigateToPricing} />;
  }


  if (viewMode === 'login' || viewMode === 'admin-login') {
    return <LoginPage onBack={handleBackToLanding} onLoginSuccess={handleLoginSuccess} isAdminLogin={viewMode === 'admin-login'} />;
  }

  if (viewMode === 'dashboard') {
    return <Dashboard onBack={() => setViewMode('landing')} />;
  }

  return (
    <div className="h-screen flex overflow-hidden text-[var(--text-primary)]">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
        selectedWorkspace={selectedWorkspace}
        setSelectedWorkspace={setSelectedWorkspace}
        isWorkspaceOpen={isWorkspaceOpen}
        setIsWorkspaceOpen={setIsWorkspaceOpen}
        workspaceSearch={workspaceSearch}
        setWorkspaceSearch={setWorkspaceSearch}
        workspaces={workspaces}
        setWorkspaces={setWorkspaces}
        isCreatingWorkspace={isCreatingWorkspace}
        setIsCreatingWorkspace={setIsCreatingWorkspace}
        newWorkspaceName={newWorkspaceName}
        setNewWorkspaceName={setNewWorkspaceName}
        expandedWorkspaceId={expandedWorkspaceId}
        setExpandedWorkspaceId={setExpandedWorkspaceId}
        queryHistories={queryHistories}
        isQueryLoading={isQueryLoading}
        historySearch={historySearch}
        setHistorySearch={setHistorySearch}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        adminSubTab={adminSubTab}
        setAdminSubTab={setAdminSubTab}
        workflowKey={workflowKey}
        setWorkflowKey={setWorkflowKey}
        chatKey={chatKey}
        setChatKey={setChatKey}
        fetchWorkspaces={fetchWorkspaces}
        fetchWorkspaceHistory={fetchWorkspaceHistory}
        handleLogout={handleLogout}
        resetConnectorState={resetConnectorState}
        agentService={agentService}
        setInitialChatMessage={setInitialChatMessage}
        isWorkspacesLoading={isWorkspacesLoading}
      />

      <main
        className="flex-1 flex flex-col overflow-hidden h-screen"
        style={{ marginLeft: isSidebarOpen ? 280 : 80 }}
      >
        <AppHeader
          activeTab={activeTab}
          selectedConnector={selectedConnector}
        />

        <MainContent
          activeTab={activeTab}
          adminSubTab={adminSubTab}
          setAdminSubTab={setAdminSubTab}
          workflowKey={workflowKey}
          chatKey={chatKey}
          initialChatMessage={initialChatMessage}
          selectedConnector={selectedConnector}
          handleWorkflowComplete={handleWorkflowComplete}
          changeTab={changeTab}
          handleBackToConnectors={handleBackToConnectors}
          handleStartWorkflow={handleStartWorkflow}
          handleForwardWithContext={handleForwardWithContext}
          handleCreateWorkspaceFromSummary={handleCreateWorkspaceFromSummary}
          onNewSessionCreated={handleNewSessionCreated}
          sessionId={selectedWorkspace?.session_id}
          workspaceName={selectedWorkspace?.workspace_name}
          workspaceType={selectedWorkspace?.workspace_type}
          isWorkspacesLoading={isWorkspacesLoading}
        />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ConnectorProvider>
          <AppContent />
          <Toaster position="top-right" />
        </ConnectorProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
