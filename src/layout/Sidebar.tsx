import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Menu,
  Layout,
  Plus,
  Check,
  X,
  Search,
  ChevronDown,
  Settings,
  LogOut,
  MessageSquare,
  ShieldAlert,
  RotateCcw,
  Users,
  Building2,
  Terminal,
  Database,
  Lock,
  Cpu,
  FileText,
  CreditCard,
  UserCheck,
  Link,
  Archive,
  HardDrive,
  Network
} from "lucide-react";
import { Workspace, workspaceService } from "../services/workspace.service";
import { SidebarProps } from "../types/layout";
import { useAuthContext } from "../context/AuthContext";
import { SettingsModal } from "../features/settings/SettingsModal";

export const Sidebar: React.FC<SidebarProps> = ({
  isSidebarOpen,
  setSidebarOpen,
  selectedWorkspace,
  setSelectedWorkspace,
  isWorkspaceOpen,
  setIsWorkspaceOpen,
  workspaceSearch,
  setWorkspaceSearch,
  workspaces,
  setWorkspaces,
  isCreatingWorkspace,
  setIsCreatingWorkspace,
  newWorkspaceName,
  setNewWorkspaceName,
  expandedWorkspaceId,
  setExpandedWorkspaceId,
  queryHistories,
  isQueryLoading,
  historySearch,
  setHistorySearch,
  activeTab,
  setActiveTab,
  adminSubTab,
  setAdminSubTab,
  workflowKey,
  setWorkflowKey,
  chatKey,
  setChatKey,
  fetchWorkspaces,
  fetchWorkspaceHistory,
  handleLogout,
  resetConnectorState,
  agentService,
  setInitialChatMessage,
  isWorkspacesLoading,
}) => {
  const { userId, roleId, roleName } = useAuthContext();
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  const [sidebarWidth, setSidebarWidth] = React.useState(280);
  const isResizing = React.useRef(false);

  React.useEffect(() => {
    const saved = localStorage.getItem("sidebarWidth");
    if (saved) {
      setSidebarWidth(parseInt(saved, 10));
    }
  }, []);

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      let newWidth = e.clientX;
      if (newWidth < 200) newWidth = 200;
      if (newWidth > 600) newWidth = 600;
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = 'default';
        let newWidth = e.clientX;
        if (newWidth < 200) newWidth = 200;
        if (newWidth > 600) newWidth = 600;
        localStorage.setItem("sidebarWidth", newWidth.toString());
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isSidebarOpen ? sidebarWidth : 80 }}
      className="fixed left-0 top-0 h-full bg-[var(--surface)] border-r border-[var(--border)] z-50 flex flex-col"
    >
      {/* Resize Handle */}
      {isSidebarOpen && (
        <div
          className="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-[var(--accent)]/50 active:bg-[var(--accent)] transition-colors z-[60]"
          onMouseDown={(e) => {
            e.preventDefault();
            isResizing.current = true;
            document.body.style.cursor = 'col-resize';
          }}
        />
      )}
      <div className="p-4 flex items-center justify-between">
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 font-bold text-lg"
          >
            <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white text-sm">
              D
            </div>
            <span>DAgent</span>
          </motion.div>
        )}
        <button
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Main nav area */}
      <div className="flex flex-col mt-2 flex-1 min-h-0 overflow-hidden">
        {/* Scrollable middle section */}
        <div className="flex-1 overflow-y-auto min-h-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {roleName === "Admin" && (
            <div className="flex flex-col shrink-0 gap-1 px-3 mt-2 mb-2">
              {[
                { id: 'company', icon: Building2, label: 'Company' },
                { id: 'users', icon: Users, label: 'Users' },
                { id: 'workspaces', icon: Layout, label: 'Workspaces' },
                { id: 'assignUsers', icon: Link, label: 'Assignments' },
                { id: 'workspaceUsers', icon: UserCheck, label: 'Workspace Users' },
                { id: 'customPrompts', icon: Terminal, label: 'Custom Prompts' },
                // { id: 'pricing', icon: CreditCard, label: 'Pricing' },
                { id: 'llmConfig', icon: Cpu, label: 'LLM Settings' },
                { id: 'adminChats', icon: MessageSquare, label: 'Chat Views' },
                { id: 'pendingKnowledge', icon: Archive, label: 'KG History' },
                { id: 'scheduledReports', icon: FileText, label: 'Scheduled Reports' },
                { id: 'masterData', icon: HardDrive, label: 'Master Data' },
                // { id: 'kGraphReview', icon: Network, label: 'K-Graph Review' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setInitialChatMessage(undefined);
                    setActiveTab("admin");
                    setAdminSubTab(tab.id as any);
                  }}
                  title={!isSidebarOpen ? tab.label : undefined}
                  className={`w-full flex items-center p-2.5 rounded-xl transition-all duration-300 border cursor-pointer ${activeTab === "admin" && adminSubTab === tab.id
                    ? "border-[var(--accent)]/10 bg-[var(--accent)]/[0.04] text-[var(--accent)]"
                    : "border-transparent bg-transparent hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    } ${!isSidebarOpen ? "justify-center" : "gap-3"}`}
                >
                  <tab.icon className="w-5 h-5 shrink-0" />
                  {isSidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm font-medium"
                    >
                      {tab.label}
                    </motion.span>
                  )}
                </button>
              ))}
            </div>
          )}
          {/* Workspace & Query Section */}
          {roleName !== "Admin" && (
            <div className="flex flex-col shrink-0">
              {/* Workspace nav item */}
              <div className="px-3 mb-1">
                <button
                  onClick={() => {
                    if (!isSidebarOpen) {
                      setSidebarOpen(true);
                      setIsWorkspaceOpen(true);
                    } else {
                      setIsWorkspaceOpen((o) => !o);
                    }
                  }}
                  className={`
                    w-full flex items-center justify-between overflow-hidden p-1.5 px-3 rounded-xl border border-[var(--border)]/20 bg-[var(--bg)]/50
                    hover:bg-[var(--surface-hover)] transition-all duration-200 group cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                    ${!isSidebarOpen ? "justify-center px-2" : ""}
                  `}
                  title={
                    isSidebarOpen
                      ? isWorkspaceOpen
                        ? "Collapse List"
                        : "Expand List"
                      : undefined
                  }
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Layout className="w-4 h-4 shrink-0 transition-colors" />
                    {isSidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm flex-1 text-left truncate font-medium"
                      >
                        Workspace -{" "}
                        {selectedWorkspace?.workspace_name || "Select"}
                      </motion.span>
                    )}
                  </div>

                  {isSidebarOpen && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="shrink-0 ml-1"
                    >
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-300 ${isWorkspaceOpen ? "rotate-180" : ""}`}
                      />
                    </motion.div>
                  )}
                </button>
              </div>

              {/* Workspace Dropdown & Query Section */}
              <AnimatePresence>
                {isSidebarOpen && isWorkspaceOpen && (
                  <motion.div
                    key="workspace-dropdown"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden flex flex-col shrink-0"
                  >
                    <div className="px-3 pt-1 pb-3 flex flex-col shrink-0">
                      {/* Create Workspace */}
                      <div className="mb-2 shrink-0">
                        {isCreatingWorkspace ? (
                          <div className="flex items-center gap-1.5 p-1 rounded-lg border border-[var(--border)] bg-[var(--surface-hover)]">
                            <input
                              autoFocus
                              type="text"
                              placeholder="Workspace name..."
                              value={newWorkspaceName}
                              onChange={(e) =>
                                setNewWorkspaceName(e.target.value)
                              }
                              onKeyDown={async (e) => {
                                if (
                                  e.key === "Enter" &&
                                  newWorkspaceName.trim()
                                ) {
                                  const trimmed = newWorkspaceName.trim();
                                  if (
                                    !workspaces.find(
                                      (w) => w.workspace_name === trimmed,
                                    )
                                  ) {
                                    try {
                                      const response =
                                        await workspaceService.createWorkspace(
                                          userId || 6,
                                          trimmed,
                                        );
                                      const newWS: Workspace =
                                        response.workspace || {
                                          id: response.id,
                                          workspace_name: trimmed,
                                          session_id: response.session_id,
                                        };
                                      setWorkspaces((prev) =>
                                        Array.isArray(prev)
                                          ? [...prev, newWS]
                                          : [newWS],
                                      );
                                      setSelectedWorkspace(newWS);
                                      localStorage.setItem(
                                        "DAgent_session_id",
                                        newWS.session_id,
                                      );
                                      window.dispatchEvent(
                                        new CustomEvent("session-id-updated", {
                                          detail: {
                                            sessionId: newWS.session_id,
                                          },
                                        }),
                                      );
                                      setWorkspaceSearch("");
                                      setIsCreatingWorkspace(false);
                                      setNewWorkspaceName("");
                                      await fetchWorkspaces();
                                    } catch (err) {
                                      console.error(
                                        "Failed to create workspace:",
                                        err,
                                      );
                                    }
                                  }
                                } else if (e.key === "Escape") {
                                  setIsCreatingWorkspace(false);
                                  setNewWorkspaceName("");
                                }
                              }}
                              className="flex-1 min-w-0 bg-transparent text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none px-1 py-0.5"
                            />
                            <button
                              onClick={async () => {
                                if (newWorkspaceName.trim()) {
                                  const trimmed = newWorkspaceName.trim();
                                  if (
                                    !workspaces.find(
                                      (w) => w.workspace_name === trimmed,
                                    )
                                  ) {
                                    try {
                                      const response =
                                        await workspaceService.createWorkspace(
                                          userId || 6,
                                          trimmed,
                                        );
                                      const newWS: Workspace =
                                        response.workspace || {
                                          id: response.id,
                                          workspace_name: trimmed,
                                          session_id: response.session_id,
                                        };
                                      setWorkspaces((prev) =>
                                        Array.isArray(prev)
                                          ? [...prev, newWS]
                                          : [newWS],
                                      );
                                      setSelectedWorkspace(newWS);
                                      localStorage.setItem(
                                        "DAgent_session_id",
                                        newWS.session_id,
                                      );
                                      window.dispatchEvent(
                                        new CustomEvent("session-id-updated", {
                                          detail: {
                                            sessionId: newWS.session_id,
                                          },
                                        }),
                                      );
                                      setWorkspaceSearch("");
                                      setIsCreatingWorkspace(false);
                                      setNewWorkspaceName("");
                                      await fetchWorkspaces();
                                    } catch (err) {
                                      console.error(
                                        "Failed to create workspace:",
                                        err,
                                      );
                                    }
                                  }
                                }
                              }}
                              className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors shrink-0"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {
                                setIsCreatingWorkspace(false);
                                setNewWorkspaceName("");
                              }}
                              className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors shrink-0"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-start px-1 mb-1">
                            {/* <button
                              onClick={() => setIsCreatingWorkspace(true)}
                              className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors text-xs font-semibold"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Create workspace
                            </button> */}
                          </div>
                        )}
                      </div>

                      {/* Search & Refresh */}
                      <div className="flex items-center gap-2 mb-2 shrink-0">
                        <div className="relative flex-1">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-secondary)]" />
                          <input
                            type="text"
                            placeholder="Search workspace..."
                            value={workspaceSearch}
                            onChange={(e) => setWorkspaceSearch(e.target.value)}
                            className="w-full pl-7 pr-3 py-1.5 text-[11px] rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/40"
                          />
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchWorkspaces();
                          }}
                          className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all active:scale-95 shadow-sm cursor-pointer"
                          title="Refresh workspaces"
                        >
                          <RotateCcw
                            className={`w-3.5 h-3.5 ${isWorkspacesLoading ? "animate-spin text-[var(--accent)]" : ""}`}
                          />
                        </button>
                      </div>
                      {/* Items */}
                      <div className="space-y-1.5 overflow-y-auto flex-1">
                        {(() => {
                          const filtered = workspaces.filter((w) => {
                            return w.workspace_name
                              .toLowerCase()
                              .includes(workspaceSearch.toLowerCase());
                          });
                          return filtered.length === 0 ? (
                            <div className="text-center py-6 border border-dashed border-[var(--border)] rounded-xl">
                              <p className="text-[10px] text-[var(--text-secondary)]">
                                No matching workspace
                              </p>
                            </div>
                          ) : (
                            filtered.map((workspace) => (
                              <div
                                key={workspace.id}
                                className={`flex flex-col transition-all duration-300 overflow-hidden border ${selectedWorkspace?.id === workspace.id
                                  ? "border-[var(--accent)]/20 bg-[var(--accent)]/5 shadow-sm"
                                  : "border-[var(--border)]/20 bg-[var(--bg)]/50"
                                  } ${expandedWorkspaceId === workspace.id ? "rounded-2xl" : "rounded-xl"}`}
                              >
                                <div className="w-full flex items-center overflow-hidden gap-1 p-0.5">
                                  {/* Workspace Selection Part (85% Width) */}
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      fetchWorkspaceHistory(workspace.id, workspace.session_id);
                                      try {
                                        if (
                                          selectedWorkspace?.id !== workspace.id
                                        ) {
                                          await workspaceService.setActiveWorkspace(
                                            userId || 6,
                                            workspace.id,
                                          );
                                          resetConnectorState();
                                          agentService.reset();
                                          setSelectedWorkspace(workspace);
                                          localStorage.setItem(
                                            "DAgent_session_id",
                                            workspace.session_id,
                                          );

                                          // Clear selected chat session from previous workspace
                                          localStorage.removeItem("selected_query_session");
                                          localStorage.removeItem("selected_query_session_name");
                                          localStorage.removeItem("current_visit_number");
                                          localStorage.removeItem("is_default_chat");

                                          // Fetch and expand the workspace history
                                          const sessions = await fetchWorkspaceHistory(workspace.id, workspace.session_id, true);

                                          // Auto-select the latest default session if available
                                          if (sessions && sessions.length > 0) {
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
                                                localStorage.setItem("selected_query_session", JSON.stringify(sessionToSelect.querySessionHistory));
                                              }
                                              if (sessionToSelect.querySessionId) {
                                                localStorage.setItem("current_visit_number", sessionToSelect.querySessionId.replace("session_visit_", ""));
                                              }
                                              if (sessionToSelect.querySessionName) {
                                                localStorage.setItem("selected_query_session_name", sessionToSelect.querySessionName);
                                              }
                                              if (sessionToSelect.querySessionName && sessionToSelect.querySessionName.trim().toLowerCase().startsWith("default")) {
                                                localStorage.setItem("is_default_chat", "true");
                                              } else {
                                                localStorage.removeItem("is_default_chat");
                                              }
                                            }
                                          }

                                          setChatKey((prev: number) => prev + 1);
                                          setActiveTab("chat");

                                          window.dispatchEvent(
                                            new CustomEvent(
                                              "session-id-updated",
                                              {
                                                detail: {
                                                  sessionId:
                                                    workspace.session_id,
                                                },
                                              },
                                            ),
                                          );
                                          setWorkflowKey((prev) =>
                                            typeof prev === "number"
                                              ? prev + 1
                                              : prev,
                                          );
                                        }
                                      } catch (err) {
                                        console.error(
                                          "Failed to set active workspace:",
                                          err,
                                        );
                                      }
                                    }}
                                    className={`w-[85%] text-left py-1.5 px-3 flex items-center gap-2 cursor-pointer transition-colors rounded-l-xl
                                       ${selectedWorkspace?.id === workspace.id ? "text-[var(--accent)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}
                                       hover:bg-[var(--surface-hover)]
                                     `}
                                  >
                                    <span
                                      className={`text-[11px] font-bold truncate ${selectedWorkspace?.id === workspace.id ? "text-[var(--accent)]" : ""}`}
                                    >
                                      {workspace.workspace_name}
                                    </span>
                                  </button>

                                  <div className="h-6 w-px bg-[var(--border)] shrink-0" />

                                  {/* Expansion Toggle Part (15% Width) */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      fetchWorkspaceHistory(
                                        workspace.id,
                                        workspace.session_id,
                                      );
                                    }}
                                    className={`w-[15%] py-1.5 px-3 flex items-center justify-center transition-all duration-200 shrink-0 rounded-r-xl cursor-pointer
                                       ${expandedWorkspaceId === workspace.id ? "text-[var(--accent)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}
                                       hover:bg-[var(--surface-hover)]
                                     `}
                                    title={
                                      expandedWorkspaceId === workspace.id
                                        ? "Collapse History"
                                        : "Expand History"
                                    }
                                  >
                                    <ChevronDown
                                      className={`w-3.5 h-3.5 transition-transform duration-300 ${expandedWorkspaceId === workspace.id ? "rotate-180 text-[var(--accent)]" : ""}`}
                                    />
                                  </button>
                                </div>

                                {/* Workspace History Items */}
                                <AnimatePresence>
                                  {expandedWorkspaceId === workspace.id && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="px-1 pt-1 pb-3 overflow-hidden flex flex-col min-h-0"
                                    >
                                      <div className="px-1 mb-3">
                                        <button
                                          onClick={() => {
                                            localStorage.removeItem(
                                              "selected_query_session",
                                            );
                                            localStorage.removeItem(
                                              "current_visit_number",
                                            );
                                            localStorage.removeItem(
                                              "selected_query_session_name",
                                            );
                                            localStorage.removeItem(
                                              "is_default_chat",
                                            );
                                            setInitialChatMessage(undefined);
                                            setActiveTab("chat");
                                            setChatKey(
                                              (prev: number) => prev + 1,
                                            );
                                          }}
                                          className={`w-full flex items-center gap-2 p-2 rounded-lg transition-all text-[11px] font-bold cursor-pointer ${!localStorage.getItem("current_visit_number")
                                            ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                                            : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                                            }`}
                                        >
                                          New Query
                                        </button>
                                      </div>

                                      {/* Search queries in history */}
                                      <div className="relative mb-2 shrink-0 px-1">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-secondary)]" />
                                        <input
                                          type="text"
                                          placeholder="Search queries..."
                                          value={historySearch}
                                          onChange={(e) =>
                                            setHistorySearch(e.target.value)
                                          }
                                          className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/40"
                                        />
                                      </div>

                                      <div className="space-y-1.5 overflow-y-auto max-h-[350px] custom-scrollbar px-1 mb-4">
                                        {isQueryLoading[workspace.id] ? (
                                          <div className="py-4 text-center">
                                            <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto"></div>
                                          </div>
                                        ) : (
                                          (() => {
                                            const rawSessions = [...(queryHistories[workspace.id] || [])].reverse();
                                            const activeVisitNumber = localStorage.getItem("current_visit_number");

                                            let defaultToKeep: any = null;
                                            for (const s of rawSessions) {
                                              const name = s.querySessionName?.trim().toLowerCase() || "";
                                              if (name.startsWith("default")) {
                                                const isThisActive = s.querySessionId && activeVisitNumber === String(s.querySessionId).replace("session_visit_", "").trim();
                                                if (isThisActive) {
                                                  defaultToKeep = s;
                                                  break;
                                                }
                                                if (!defaultToKeep) {
                                                  defaultToKeep = s;
                                                }
                                              }
                                            }

                                            const filteredSessions = rawSessions
                                              .filter((s) => {
                                                const name = s.querySessionName?.trim().toLowerCase() || "";
                                                if (name.startsWith("default")) {
                                                  return s === defaultToKeep;
                                                }
                                                return true;
                                              })
                                              .filter(
                                                (s) =>
                                                  !historySearch ||
                                                  s.querySessionName
                                                    .toLowerCase()
                                                    .includes(
                                                      historySearch.toLowerCase(),
                                                    ),
                                              )
                                              .sort((a, b) => {
                                                if (a === defaultToKeep) return -1;
                                                if (b === defaultToKeep) return 1;
                                                return 0;
                                              });

                                            return filteredSessions.length ===
                                              0 ? (
                                              <div className="text-center py-6 border border-dashed border-[var(--border)] rounded-xl opacity-60">
                                                <p className="text-[10px] text-[var(--text-secondary)]">
                                                  No sessions found
                                                </p>
                                              </div>
                                            ) : (
                                              filteredSessions.map(
                                                (session, idx) => (
                                                  <div
                                                    key={
                                                      session.querySessionId ||
                                                      idx
                                                    }
                                                    onClick={() => {
                                                      if (
                                                        session.querySessionHistory
                                                      ) {
                                                        localStorage.setItem(
                                                          "selected_query_session",
                                                          JSON.stringify(
                                                            session.querySessionHistory,
                                                          ),
                                                        );
                                                      }
                                                      if (
                                                        session.querySessionId
                                                      ) {
                                                        localStorage.setItem(
                                                          "current_visit_number",
                                                          session.querySessionId.replace(
                                                            "session_visit_",
                                                            "",
                                                          ),
                                                        );
                                                      }
                                                      if (
                                                        session.querySessionName
                                                      ) {
                                                        localStorage.setItem(
                                                          "selected_query_session_name",
                                                          session.querySessionName,
                                                        );
                                                      }
                                                      if (
                                                        session.querySessionName &&
                                                        session.querySessionName.startsWith(
                                                          "default_",
                                                        )
                                                      ) {
                                                        localStorage.setItem(
                                                          "is_default_chat",
                                                          "true",
                                                        );
                                                      } else {
                                                        localStorage.removeItem(
                                                          "is_default_chat",
                                                        );
                                                      }
                                                      setActiveTab("chat");
                                                      setChatKey(
                                                        (prev: number) =>
                                                          prev + 1,
                                                      );
                                                    }}
                                                    className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer group flex items-center justify-between gap-2 ${workspace.id === selectedWorkspace?.id && session.querySessionId &&
                                                      localStorage.getItem("current_visit_number") ===
                                                      String(session.querySessionId).replace("session_visit_", "").trim()
                                                      ? "border-[var(--accent)]/30 bg-[var(--accent)]/10 shadow-sm"
                                                      : "border-[var(--border)] bg-[var(--bg)]/50 hover:bg-[var(--surface-hover)]"
                                                      }`}
                                                  >
                                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                      <MessageSquare
                                                        className={`w-4 h-4 shrink-0 transition-colors ${workspace.id === selectedWorkspace?.id && session.querySessionId &&
                                                          localStorage.getItem("current_visit_number") ===
                                                          String(session.querySessionId).replace("session_visit_", "").trim()
                                                          ? "text-[var(--accent)]"
                                                          : "text-[var(--text-secondary)] group-hover:text-[var(--accent)]"
                                                          }`}
                                                      />
                                                      <div
                                                        className={`text-[11px] font-semibold truncate transition-colors ${workspace.id === selectedWorkspace?.id && session.querySessionId &&
                                                          localStorage.getItem("current_visit_number") ===
                                                          String(session.querySessionId).replace("session_visit_", "").trim()
                                                          ? "text-[var(--text-primary)]"
                                                          : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
                                                          }`}
                                                      >
                                                        {session.querySessionName}
                                                      </div>
                                                    </div>
                                                    {roleId === 4 && session.userId && session.userId !== userId && (
                                                      <div className="text-[9px] font-medium text-[var(--text-secondary)] bg-[var(--bg)] px-1.5 py-0.5 rounded-sm border border-[var(--border)] shrink-0 max-w-[60px] truncate" title={session.userName || "User"}>
                                                        {session.userName || "User"}
                                                      </div>
                                                    )}
                                                  </div>
                                                ),
                                              )
                                            );
                                          })()
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))
                          );
                        })()}
                      </div>
                    </div>

                    {/* Divider - Subtle divider inside the dropdown */}
                    <div className="mx-4 my-2 h-px bg-[var(--border)] opacity-30 shrink-0" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Settings + Logout — fixed at the bottom */}
      <div className="px-3 pb-3 space-y-1 shrink-0 mt-auto border-t border-[var(--border)] pt-3">
        <button
          onClick={() => roleName === "Admin" && setIsSettingsOpen(true)}
          className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-[var(--text-secondary)] transition-colors duration-200 ${
            roleName === "Admin" 
              ? "hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] cursor-pointer" 
              : "opacity-50 cursor-not-allowed"
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          {isSidebarOpen && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm"
            >
              Settings
            </motion.span>
          )}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-rose-500/10 text-[var(--text-secondary)] hover:text-rose-500 transition-colors duration-200 cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {isSidebarOpen && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm"
            >
              Logout
            </motion.span>
          )}
        </button>
      </div>

      {/* Settings Modal */}
      {roleName === "Admin" && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </motion.aside>
  );
};

export default Sidebar;
