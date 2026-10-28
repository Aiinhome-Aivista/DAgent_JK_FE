import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { defaultConfig, API_ENDPOINTS } from "../../../services/api.config";
import { Loader2, Send, ChevronDown, ChevronUp, Share2, X, Users, Check } from "lucide-react";
import { ChatVisualization } from "../../chat/components/ChatVisualization";
import { Visualization } from "../../chat/types";
import { formatChatMessage } from "../../../utils/format";
import { adminService } from "../../../services/admin.service";

interface AdminChat {
  id: number;
  chat_id: string;
  session_id: string;
  question: string;
  answer: string;
  visualizations?: Partial<Visualization> | null;
  kg_status?: string;
  is_public?: boolean | number;
  created_at: string;
}

interface Workspace {
  id: number;
  workspace_name: string;
  session_id: string;
}

interface WorkspaceUser {
  id: number;
  name: string;
  email: string;
}

// ──────────────────────────────────────────────
// Share Insight Modal
// ──────────────────────────────────────────────
const ShareInsightModal: React.FC<{
  chat: AdminChat;
  onClose: () => void;
}> = ({ chat, onClose }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<WorkspaceUser[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Fetch all workspaces on mount
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        setIsLoadingWorkspaces(true);
        const res = await fetch(`${defaultConfig.baseUrl}${API_ENDPOINTS.WORKSPACE.GET_ADMIN_WORKSPACES}`);
        const json = await res.json();
        if (json?.workspaces) setWorkspaces(json.workspaces);
        else if (Array.isArray(json?.data)) setWorkspaces(json.data);
      } catch (err) {
        console.error("Failed to load workspaces", err);
      } finally {
        setIsLoadingWorkspaces(false);
      }
    };
    fetchWorkspaces();
  }, []);

  // Fetch all users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const res = await adminService.getUsers();
        const allUsers: WorkspaceUser[] = res?.data || res?.users || [];
        setUsers(allUsers);
        setFilteredUsers(allUsers);
      } catch (err) {
        console.error("Failed to load users", err);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // When workspace changes, filter users who belong to that workspace
  const handleWorkspaceChange = async (wsId: string) => {
    setSelectedWorkspaceId(wsId);
    setSelectedUserIds(new Set());

    if (!wsId) {
      setFilteredUsers(users);
      return;
    }

    try {
      setIsLoadingUsers(true);
      const res = await adminService.getWorkspaceUsers(Number(wsId));
      const wsUsers: WorkspaceUser[] = res?.users || res?.data || [];
      if (wsUsers.length > 0) {
        setFilteredUsers(wsUsers);
      } else {
        // fallback: show all users if no specific workspace users found
        setFilteredUsers(users);
      }
    } catch (err) {
      console.error("Failed to load workspace users", err);
      setFilteredUsers(users);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const toggleUser = (userId: number) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const handleShare = async () => {
    if (!selectedWorkspaceId) {
      toast.error("Please select a workspace first");
      return;
    }
    if (selectedUserIds.size === 0) {
      toast.error("Please select at least one user");
      return;
    }
    try {
      setIsSharing(true);
      const res = await fetch(
        `${defaultConfig.baseUrl}${API_ENDPOINTS.ADMIN.SHARE_CHAT}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chat.id,
            workspace_id: Number(selectedWorkspaceId),
            user_ids: Array.from(selectedUserIds),
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to share");
      toast.success(`Insight shared with ${selectedUserIds.size} user(s)!`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to share insight");
    } finally {
      setIsSharing(false);
    }
  };

  const allSelected = filteredUsers.length > 0 && selectedUserIds.size === filteredUsers.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[var(--accent)]" />
              Share Insight
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-1">
              "{chat.question}"
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors text-[var(--text-secondary)] shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Workspace Dropdown */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
              Select Workspace
            </label>
            {isLoadingWorkspaces ? (
              <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading workspaces...
              </div>
            ) : (
              <select
                value={selectedWorkspaceId}
                onChange={(e) => handleWorkspaceChange(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] appearance-none cursor-pointer"
              >
                <option value="">— All Users (no filter) —</option>
                {workspaces.map(ws => (
                  <option key={ws.id} value={ws.id}>
                    {ws.workspace_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Users list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[var(--accent)]" />
                Select Users
                {filteredUsers.length > 0 && (
                  <span className="text-xs font-normal text-[var(--text-secondary)] ml-1">
                    ({selectedUserIds.size}/{filteredUsers.length} selected)
                  </span>
                )}
              </label>
              {filteredUsers.length > 0 && (
                <button
                  onClick={toggleAll}
                  className="text-xs font-medium text-[var(--accent)] hover:underline"
                >
                  {allSelected ? "Deselect All" : "Select All"}
                </button>
              )}
            </div>

            <div className="max-h-52 overflow-y-auto rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]/50">
              {isLoadingUsers ? (
                <div className="flex items-center justify-center gap-2 py-6 text-[var(--text-secondary)] text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading users...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-6 text-center text-sm text-[var(--text-secondary)]">
                  No users found for this workspace.
                </div>
              ) : (
                filteredUsers.map(user => {
                  const isSelected = selectedUserIds.has(user.id);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggleUser(user.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        isSelected
                          ? "bg-[var(--accent)]/10"
                          : "hover:bg-[var(--surface-hover)]"
                      }`}
                    >
                      {/* Checkbox */}
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? "bg-[var(--accent)] border-[var(--accent)]"
                          : "border-[var(--border)]"
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user.name || "—"}</p>
                        <p className="text-xs text-[var(--text-secondary)] truncate">{user.email}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={isSharing || selectedUserIds.size === 0}
            className="flex-[2] py-2.5 text-sm font-medium rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
            Share with {selectedUserIds.size > 0 ? `${selectedUserIds.size} User${selectedUserIds.size > 1 ? 's' : ''}` : "Users"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────
// Main AdminChats Component
// ──────────────────────────────────────────────
export const AdminChats: React.FC = () => {
  const [chats, setChats] = useState<AdminChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPushing, setIsPushing] = useState<Record<string, boolean>>({});
  const [expandedChats, setExpandedChats] = useState<Set<string>>(new Set());
  const [sharingChat, setSharingChat] = useState<AdminChat | null>(null);

  const toggleChat = (id: string) => {
    setExpandedChats(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `${defaultConfig.baseUrl}${API_ENDPOINTS.ADMIN.GET_CHATS}?limit=200`,
      );
      if (!res.ok) throw new Error("Failed to fetch chats");
      const json = await res.json();
      if (json.status === "success" && Array.isArray(json.data)) {
        setChats(json.data);
      } else {
        setChats([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load chat views");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushToKG = async (
    chat: AdminChat,
    uniqueId: string,
    tableVisualizations: any[],
  ) => {
    try {
      setIsPushing((prev) => ({ ...prev, [uniqueId]: true }));

      const payload = {
        id: chat.id,
        question: chat.question,
        answer: chat.answer,
        visualizations:
          tableVisualizations.length > 0 ? tableVisualizations : null,
      };

      const res = await fetch(
        `${defaultConfig.baseUrl}${API_ENDPOINTS.ADMIN.PUSH_TO_KG}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) throw new Error("Failed to push to Knowledge Graph");

      toast.success("Successfully pushed to Knowledge Graph!");

      setChats((prev) =>
        prev.filter(
          (c) =>
            (c.chat_id || c.session_id) !== (chat.chat_id || chat.session_id),
        ),
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to push. Please check the backend connection.");
    } finally {
      setIsPushing((prev) => ({ ...prev, [uniqueId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-xl opacity-60">
        <p className="text-sm text-[var(--text-secondary)]">
          No recent chats found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-[var(--text-primary)]">
        User Chat Views
      </h2>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Review recent user chats, share insights with specific workspace users, and promote accurate answers to the Knowledge Graph.
      </p>

      <div className="grid grid-cols-1 gap-6">
        {chats.map((chat, index) => {
          const uniqueId = chat.chat_id || `${chat.session_id}-${index}`;
          const isExpanded = expandedChats.has(uniqueId);

          let parsedVisualizations: any[] = [];
          if (typeof chat.visualizations === "string") {
            try {
              parsedVisualizations = JSON.parse(chat.visualizations);
              if (!Array.isArray(parsedVisualizations)) {
                parsedVisualizations = [parsedVisualizations];
              }
            } catch (e) {
              console.error("Failed to parse visualizations:", e);
            }
          } else if (chat.visualizations) {
            parsedVisualizations = Array.isArray(chat.visualizations)
              ? chat.visualizations
              : [chat.visualizations];
          }

          let displayAnswer = chat.answer;

          if (typeof displayAnswer === 'string' && (displayAnswer.trim().startsWith('{') || displayAnswer.trim().startsWith('['))) {
            try {
              const parsedAnswer = JSON.parse(displayAnswer);
              if (parsedAnswer && typeof parsedAnswer === 'object') {
                if (parsedAnswer.report) {
                  displayAnswer = parsedAnswer.report;
                } else if (parsedAnswer.answer) {
                  displayAnswer = parsedAnswer.answer;
                }

                if (parsedAnswer.charts && Array.isArray(parsedAnswer.charts) && parsedVisualizations.length === 0) {
                  parsedVisualizations = parsedAnswer.charts.map((c: any) => {
                    const mappedType = c.chart_type === 'bar' ? 'bar_chart' : (c.chart_type === 'pie' ? 'pie_chart' : (c.chart_type === 'line' ? 'line_chart' : 'table'));

                    let chartData: any[] = [];
                    if (c.labels && Array.isArray(c.labels) && c.datasets && c.datasets.length > 0) {
                      chartData = c.labels.map((lbl: string, i: number) => {
                        const dataPoint: any = { label: lbl };
                        c.datasets.forEach((ds: any) => {
                          const key = ds.label || 'value';
                          dataPoint[key] = ds.data[i];
                        });
                        return dataPoint;
                      });
                    }

                    return {
                      type: mappedType,
                      title: c.title,
                      description: c.description,
                      xKey: 'label',
                      yKey: c.datasets?.[0]?.label || 'value',
                      data: chartData
                    };
                  });
                }
              }
            } catch (e) {
              // Not valid JSON
            }
          }

          return (
            <div
              key={uniqueId}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 shadow-sm transition-all hover:shadow-md"
            >
              {/* Card Header */}
              <div
                className={`flex items-center justify-between cursor-pointer select-none group ${isExpanded ? 'mb-4 border-b border-[var(--border)]/50 pb-3' : ''}`}
                onClick={() => toggleChat(uniqueId)}
              >
                <div className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                  Session: {chat.session_id} •{" "}
                  {new Date(chat.created_at).toLocaleString()}
                </div>

                <div className="flex items-center gap-3">
                  {/* Share Insight Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSharingChat(chat);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors border border-[var(--accent)]/20"
                    title="Share this insight with specific users"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share Insight
                  </button>

                  {/* Expand/Collapse */}
                  <div className="text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors bg-[var(--surface-hover)] p-1 rounded-md">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-2">
                      Question:
                    </h3>
                    <p className="text-[13px] bg-[var(--bg)] p-3 rounded-lg border border-[var(--border)]/30 text-[var(--text-secondary)]">
                      {chat.question}
                    </p>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-2">
                      Answer:
                    </h3>

                    {displayAnswer && (
                      <div
                        className="text-[13px] text-[var(--text-secondary)] mb-4 prose-chat break-words"
                        dangerouslySetInnerHTML={{ __html: formatChatMessage(displayAnswer, true) }}
                      />
                    )}

                    {(() => {
                      try {
                        const parsed = JSON.parse(chat.answer);
                        if (parsed && typeof parsed === 'object' && parsed.kpis && Array.isArray(parsed.kpis)) {
                          return (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                              {parsed.kpis.map((kpi: any, idx: number) => (
                                <div key={idx} className="bg-[var(--bg)] border border-[var(--border)]/50 p-3 rounded-xl flex flex-col gap-1">
                                  <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider truncate" title={kpi.title}>{kpi.title}</span>
                                  <span className="text-lg font-bold text-[var(--text-primary)]">
                                    {(kpi.value !== null && kpi.value !== undefined && typeof kpi.value === 'object')
                                      ? Object.entries(kpi.value).map(([k, v]) => `${k}: ${v}`).join(' | ')
                                      : String(kpi.value ?? '—')}
                                  </span>
                                  {kpi.description && (
                                    <span className="text-[10px] text-[var(--text-secondary)]/70 line-clamp-2" title={kpi.description}>{kpi.description}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        }
                      } catch (e) {
                        // Ignore parsing errors
                      }
                      return null;
                    })()}
                  </div>

                  {parsedVisualizations.length > 0 && (
                    <div className="mb-6 space-y-4">
                      {parsedVisualizations.map((vis, vIdx) => (
                        <div
                          key={vIdx}
                          className="border border-[var(--border)]/30 p-2 rounded-xl bg-[var(--bg)]"
                        >
                          <ChatVisualization
                            visualization={
                              {
                                ...vis,
                                type: (vis.type === 'report' ? 'table' : vis.type) || "table",
                              } as Visualization
                            }
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end pt-3 border-t border-[var(--border)]/50">
                    <button
                      onClick={() =>
                        handlePushToKG(
                          chat,
                          uniqueId,
                          parsedVisualizations
                        )
                      }
                      disabled={
                        isPushing[uniqueId] ||
                        chat.kg_status === "staged" ||
                        chat.kg_status === "indexed"
                      }
                      className={`px-4 py-2 text-sm cursor-pointer font-medium rounded-xl text-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${chat.kg_status === "staged" || chat.kg_status === "indexed" ? "bg-gray-500" : "bg-[var(--accent)] hover:bg-[var(--accent)]/90"}`}
                    >
                      {isPushing[uniqueId] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {chat.kg_status === "indexed"
                        ? "Already Indexed"
                        : chat.kg_status === "staged"
                          ? "Already Staged"
                          : "Push to Knowledge Graph"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Share Insight Modal */}
      {sharingChat && (
        <ShareInsightModal
          chat={sharingChat}
          onClose={() => setSharingChat(null)}
        />
      )}
    </div>
  );
};
