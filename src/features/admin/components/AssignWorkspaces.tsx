import React from "react";
import { ShieldAlert, Loader2, Check, Search, X } from "lucide-react";
import { AdminUser } from "../types";
import { Workspace } from "../../../services/workspace.service";

interface AssignWorkspaceProps {
  users: AdminUser[];
  workspaces: Workspace[];
  selectedUserIds: number[];
  setSelectedUserIds: (ids: number[]) => void;
  selectedWorkspaceForAssignment: number | null;
  setSelectedWorkspaceForAssignment: (val: number | null) => void;
  isAssigning: boolean;
  handleAssignWorkspace: () => void;
}

export const AssignWorkspace: React.FC<AssignWorkspaceProps> = ({
  users,
  workspaces,
  selectedUserIds,
  setSelectedUserIds,
  selectedWorkspaceForAssignment,
  setSelectedWorkspaceForAssignment,
  isAssigning,
  handleAssignWorkspace,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] =
    React.useState(false);
  const [userSearchTerm, setUserSearchTerm] = React.useState("");
  const [workspaceSearchTerm, setWorkspaceSearchTerm] = React.useState("");

  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const workspaceDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        workspaceDropdownRef.current &&
        !workspaceDropdownRef.current.contains(event.target as Node)
      ) {
        setIsWorkspaceDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleUser = (userId: number) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const getSelectedNames = () => {
    if (selectedUserIds.length === 0) return "-- Select users --";
    if (selectedUserIds.length <= 2) {
      return users
        .filter((u) => selectedUserIds.includes(u.id))
        .map((u) => u.email)
        .join(", ");
    }
    return `${selectedUserIds.length} users selected`;
  };

  const filteredUsers = users.filter(
    (u) =>
      (u.name || "").toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchTerm.toLowerCase()),
  );

  const filteredWorkspaces = workspaces.filter((w) =>
    w.workspace_name.toLowerCase().includes(workspaceSearchTerm.toLowerCase()),
  );

  const selectedWorkspaceData = workspaces.find(
    (w) => w.id === selectedWorkspaceForAssignment,
  );

  return (
    <div className="w-full">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            Assign Workspace to User
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
              Users
            </label>
            <div className="relative" ref={dropdownRef}>
              <div
                onClick={() => {
                  setIsDropdownOpen(!isDropdownOpen);
                  if (!isDropdownOpen) setUserSearchTerm("");
                }}
                className="w-full pl-4 pr-10 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] cursor-pointer min-h-[50px] flex items-center"
              >
                <span
                  className={
                    selectedUserIds.length === 0
                      ? "text-[var(--text-secondary)]"
                      : ""
                  }
                >
                  {getSelectedNames()}
                </span>
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>

              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl max-h-80 flex flex-col overflow-hidden">
                  <div className="p-2 border-b border-[var(--border)] relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-10 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                      autoFocus
                    />
                    {userSearchTerm && (
                      <button
                        onClick={() => setUserSearchTerm("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="p-2 space-y-1 overflow-y-auto custom-scrollbar">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => toggleUser(u.id)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                            selectedUserIds.includes(u.id)
                              ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                              : "hover:bg-[var(--surface-hover)] text-[var(--text-primary)]"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                              selectedUserIds.includes(u.id)
                                ? "bg-[var(--accent)] border-[var(--accent)] scale-110"
                                : "border-[var(--text-secondary)]/30 bg-[var(--surface-hover)] hover:border-[var(--accent)]"
                            }`}
                          >
                            {selectedUserIds.includes(u.id) && (
                              <Check className="w-2.5 h-2.5 text-white stroke-[3.5]" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium flex items-center gap-2">
                              {u.name || "No Name"}
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                                  u.role_id === 4
                                    ? "bg-purple-500/10 text-purple-500"
                                    : "bg-emerald-500/10 text-emerald-500"
                                }`}
                              >
                                {u.role_id === 4 ? "Support" : "End User"}
                              </span>
                            </span>
                            <span className="text-xs opacity-70">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center text-sm text-[var(--text-secondary)]">
                        No users found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
              {" "}
              Workspace
            </label>
            <div className="relative" ref={workspaceDropdownRef}>
              <div
                onClick={() => {
                  setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen);
                  if (!isWorkspaceDropdownOpen) setWorkspaceSearchTerm("");
                }}
                className="w-full pl-4 pr-10 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] cursor-pointer min-h-[50px] flex items-center"
              >
                <span
                  className={
                    !selectedWorkspaceForAssignment
                      ? "text-[var(--text-secondary)]"
                      : ""
                  }
                >
                  {selectedWorkspaceData
                    ? selectedWorkspaceData.workspace_name
                    : "-- Select a workspace --"}
                </span>
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>

              {isWorkspaceDropdownOpen && (
                <div className="absolute z-10 w-full mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl max-h-80 flex flex-col overflow-hidden">
                  <div className="p-2 border-b border-[var(--border)] relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                    <input
                      type="text"
                      placeholder="Search workspaces..."
                      value={workspaceSearchTerm}
                      onChange={(e) => setWorkspaceSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-10 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                      autoFocus
                    />
                    {workspaceSearchTerm && (
                      <button
                        onClick={() => setWorkspaceSearchTerm("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="p-2 space-y-1 overflow-y-auto custom-scrollbar">
                    {filteredWorkspaces.length > 0 ? (
                      filteredWorkspaces.map((w) => (
                        <div
                          key={w.id}
                          onClick={() => {
                            setSelectedWorkspaceForAssignment(w.id);
                            setIsWorkspaceDropdownOpen(false);
                          }}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                            selectedWorkspaceForAssignment === w.id
                              ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                              : "hover:bg-[var(--surface-hover)] text-[var(--text-primary)]"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                              selectedWorkspaceForAssignment === w.id
                                ? "border-[var(--accent)] bg-[var(--accent)]"
                                : "border-[var(--text-secondary)]/30 bg-[var(--surface-hover)] hover:border-[var(--accent)]"
                            }`}
                          >
                            {selectedWorkspaceForAssignment === w.id && (
                              <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            )}
                          </div>
                          <span className="text-sm font-medium">
                            {w.workspace_name}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center text-sm text-[var(--text-secondary)]">
                        No workspaces found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-[var(--border)] flex justify-end">
          <button
            onClick={handleAssignWorkspace}
            disabled={
              selectedUserIds.length === 0 ||
              !selectedWorkspaceForAssignment ||
              isAssigning
            }
            className="px-8 py-3 rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm flex items-center gap-2 text-sm cursor-pointer"
          >
            {isAssigning && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirm Assign
          </button>
        </div>
      </div>
    </div>
  );
};
