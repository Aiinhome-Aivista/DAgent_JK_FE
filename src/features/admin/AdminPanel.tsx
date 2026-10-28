import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Layout,
  ShieldAlert,
  Check,
  X,
  Search,
  Loader2,
  Calendar,
  FileText,
  CreditCard,
  Building2,
  Plus,
} from "lucide-react";
import { adminService } from "../../services/admin.service";
import { AdminUser, AdminTab } from "./types";
import { workspaceService, Workspace } from "../../services/workspace.service";
import { useAuthContext } from "../../context/AuthContext";
import { MangeUser } from "./components/MangeUsers";
import { MangeWorkspace } from "./components/MangeWorkspaces";
import { AssignWorkspace } from "./components/AssignWorkspaces";
import { WorkspaceUsers } from "./components/WorkspaceUsers";
import { CompanyList } from "./components/CompanyList";
import { AdminChats } from "./components/AdminChats";
import { AdminPendingKnowledge } from "./components/AdminPendingKnowledge";
import { CustomPrompts } from "./components/CustomPrompts";
import { ScheduledReports } from "./components/ScheduledReports";
import { ManagePricing } from "./components/ManagePricing";
import { ManageLLM } from "./components/ManageLLM";
import { ManageMasterData } from "./components/ManageMasterData";
import { AdminKGraphReview } from "./components/AdminKGraphReview";

interface AdminPanelProps {
  adminSubTab: AdminTab;
  setAdminSubTab: (tab: AdminTab) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  adminSubTab,
  setAdminSubTab,
}) => {
  const { userId } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  // Assignment State
  const [selectedUserIdsForAssignment, setSelectedUserIdsForAssignment] =
    useState<number[]>([]);
  const [selectedWorkspaceForAssignment, setSelectedWorkspaceForAssignment] =
    useState<number | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isCreatingSchedule, setIsCreatingSchedule] = useState(false);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [isCreatingLLM, setIsCreatingLLM] = useState(false);
  const [isCreatingCompanyConfig, setIsCreatingCompanyConfig] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceType, setNewWorkspaceType] = useState("");
  const [workspaceTypes, setWorkspaceTypes] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [adminSubTab]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (adminSubTab === "users" || adminSubTab === "assignUsers") {
        const usersResponse = await adminService.getUsers();
        if (usersResponse?.users) {
          setUsers(usersResponse.users);
        } else {
          setUsers([
            {
              id: 1,
              name: "Admin User",
              email: "admin@d-agent.ai",
              role: "admin",
            },
            {
              id: 2,
              name: "John Doe",
              email: "john@example.com",
              role: "user",
            },
            {
              id: 3,
              name: "Jane Smith",
              email: "jane@example.com",
              role: "user",
            },
          ]);
        }
      }

      if (
        adminSubTab === "workspaces" ||
        adminSubTab === "assignUsers" ||
        adminSubTab === "workspaceUsers" ||
        adminSubTab === "customPrompts"
      ) {
        try {
          const wsResponse = await adminService.getAllWorkspaces(userId || 6);
          if (wsResponse?.workspaces) {
            setWorkspaces(wsResponse.workspaces);
          }
          const typesResponse = await workspaceService.getWorkspaceTypes();
          if (typesResponse?.data) {
            setWorkspaceTypes(typesResponse.data);
            if (typesResponse.data.length > 0 && newWorkspaceType === "") {
              setNewWorkspaceType(typesResponse.data[0].type_name);
            }
          }
        } catch (e) {
          console.log(
            "Admin workspaces endpoint not found, fetching user workspaces",
            e,
          );
          const wsFallbackResponse = await workspaceService.getWorkspaces(
            userId || 6,
          );
          if (wsFallbackResponse?.workspaces) {
            setWorkspaces(wsFallbackResponse.workspaces);
          }
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch admin data:", err);
      setError(err.message || "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    setIsLoading(true);
    try {
      const response = await adminService.createWorkspace(
        userId || 6,
        newWorkspaceName.trim(),
        newWorkspaceType
      );
      if (response) {
        toast.success("Workspace created successfully");
        await fetchData();
        setNewWorkspaceName("");
        setIsCreatingWorkspace(false);
      }
    } catch (err: any) {
      console.error("Failed to create workspace:", err);
      setError(err.message || "Failed to create workspace");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWorkspace = async (workspaceId: number) => {
    setIsLoading(true);
    try {
      await adminService.deleteWorkspace(workspaceId);
      toast.success("Workspace deleted successfully");
      await fetchData();
    } catch (err: any) {
      console.error("Failed to delete workspace:", err);
      setError(err.message || "Failed to delete workspace");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignWorkspace = async () => {
    if (
      selectedUserIdsForAssignment.length === 0 ||
      !selectedWorkspaceForAssignment
    )
      return;
    setIsAssigning(true);
    setError(null);
    try {
      await adminService.assignWorkspaceUsers(
        userId || 14,
        selectedWorkspaceForAssignment,
        selectedUserIdsForAssignment,
      );

      toast.success("Workspace assigned successfully");
      setSelectedUserIdsForAssignment([]);
      setSelectedWorkspaceForAssignment(null);
    } catch (err: any) {
      console.error("Failed to assign workspace:", err);
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const roleLabel = u.role_id === 4 ? "support user" : "end user";
    const visibilityLabel = u.visibility === 2 ? "private" : "public";
    return (
      (u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.company_name || "").toLowerCase().includes(q) ||
      roleLabel.includes(q) ||
      visibilityLabel.includes(q) ||
      (u.workspaces || "").toLowerCase().includes(q)
    );
  });

  const filteredWorkspaces = workspaces.filter((w) => {
    const q = searchQuery.toLowerCase();
    return (
      w.workspace_name?.toLowerCase().includes(q) ||
      w.workspace_type?.toLowerCase().includes(q) ||
      w.name?.toLowerCase().includes(q)
    );
  });


  const tabDetails: Record<AdminTab, { title: string; desc: string }> = {
    company: {
      title: "Company Management",
      desc: "View and manage company details.",
    },
    users: {
      title: "Manage Users",
      desc: "Add, view, and manage system users.",
    },
    workspaces: {
      title: "Manage Workspaces",
      desc: "Create and configure organizational workspaces.",
    },
    assignUsers: {
      title: "Workspace Assignments",
      desc: "Assign users to specific workspaces.",
    },
    workspaceUsers: {
      title: "Workspace Members",
      desc: "View users grouped by their assigned workspaces.",
    },
    adminChats: {
      title: "Chat Views",
      desc: "Monitor and review chat history across sessions.",
    },
    pendingKnowledge: {
      title: "Knowledge History",
      desc: "Review pending and processed knowledge base entries.",
    },
    customPrompts: {
      title: "Custom Prompts",
      desc: "Configure default system prompts for workspaces.",
    },
    scheduledReports: {
      title: "Scheduled Reports",
      desc: "Configure automated scheduled reports and recipients.",
    },
    // pricing: {
    //   title: "Pricing Plans",
    //   desc: "Manage subscription plans and features.",
    // },
    llmConfig: {
      title: "LLM Configuration",
      desc: "Configure AI providers and model assignments.",
    },
    masterData: {
      title: "Master Data Management",
      desc: "Manage Data Categories and Prompt Types.",
    },
    kGraphReview: {
      title: "K-Graph Review",
      desc: "Review visual Knowledge Graphs.",
    },
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header & Actions Row */}
      <div className="shrink-0 pb-3 flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">
              {tabDetails[adminSubTab]?.title || "Admin"}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {tabDetails[adminSubTab]?.desc || ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          {adminSubTab !== "company" && (
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Search here"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
          )}

          {adminSubTab === "users" && (
            <button
              onClick={() => setIsCreatingUser(true)}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              Add User
            </button>
          )}

          {adminSubTab === "workspaces" && (
            <button
              onClick={() => setIsCreatingWorkspace(true)}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Layout className="w-4 h-4" />
              Create Workspace
            </button>
          )}

          {adminSubTab === "scheduledReports" && (
            <button
              onClick={() => setIsCreatingSchedule(true)}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              Create Schedule
            </button>
          )}



          {/* {adminSubTab === "pricing" && (
            <button
              onClick={() => setIsCreatingPlan(true)}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              Create Plan
            </button>
          )} */}

          {adminSubTab === "llmConfig" && (
            <button
              onClick={() => setIsCreatingLLM(true)}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Provider
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {/* Error Banner */}
        {error && (
          <div className="m-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm flex items-start gap-2 max-w-3xl">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto hover:text-rose-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scrollable Content */}
        <div
          className={`flex-1 py-3 pr-3 flex flex-col min-h-0 ${adminSubTab === "customPrompts"
            ? ""
            : "overflow-y-auto custom-scrollbar"
            }`}
        >
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={adminSubTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={`w-full ${adminSubTab === "customPrompts"
                  ? "h-full flex flex-col min-h-0"
                  : ""
                  }`}
              >
                {adminSubTab === "users" && (
                  <MangeUser
                    users={users}
                    searchQuery={searchQuery}
                    onRefresh={fetchData}
                    adminId={userId || 14}
                    isModalOpen={isCreatingUser}
                    setIsModalOpen={setIsCreatingUser}
                  />
                )}

                {adminSubTab === "workspaces" && (
                  <MangeWorkspace
                    workspaces={workspaces}
                    searchQuery={searchQuery}
                    isCreatingWorkspace={isCreatingWorkspace}
                    setIsCreatingWorkspace={setIsCreatingWorkspace}
                    newWorkspaceName={newWorkspaceName}
                    setNewWorkspaceName={setNewWorkspaceName}
                    newWorkspaceType={newWorkspaceType}
                    setNewWorkspaceType={setNewWorkspaceType}
                    workspaceTypes={workspaceTypes}
                    handleCreateWorkspace={handleCreateWorkspace}
                    handleDeleteWorkspace={handleDeleteWorkspace}
                    isLoading={isLoading}
                  />
                )}

                {adminSubTab === "assignUsers" && (
                  <AssignWorkspace
                    users={users}
                    workspaces={workspaces}
                    selectedUserIds={selectedUserIdsForAssignment}
                    setSelectedUserIds={setSelectedUserIdsForAssignment}
                    selectedWorkspaceForAssignment={
                      selectedWorkspaceForAssignment
                    }
                    setSelectedWorkspaceForAssignment={
                      setSelectedWorkspaceForAssignment
                    }
                    isAssigning={isAssigning}
                    handleAssignWorkspace={handleAssignWorkspace}
                  />
                )}

                {adminSubTab === "company" && (
                  <CompanyList
                    searchQuery={searchQuery}
                    isCreatingCompany={isCreatingCompany}
                    setIsCreatingCompany={setIsCreatingCompany}
                  />
                )}

                {adminSubTab === "workspaceUsers" && (
                  <WorkspaceUsers
                    workspaces={filteredWorkspaces}
                    searchQuery={searchQuery}
                  />
                )}

                {adminSubTab === "adminChats" && <AdminChats />}

                {adminSubTab === "pendingKnowledge" && (
                  <AdminPendingKnowledge />
                )}

                {adminSubTab === "customPrompts" && (
                  <CustomPrompts
                    workspaces={workspaces}
                    searchQuery={searchQuery}
                  />
                )}

                {adminSubTab === "scheduledReports" && (
                  <ScheduledReports
                    searchQuery={searchQuery}
                    isModalOpen={isCreatingSchedule}
                    setIsModalOpen={setIsCreatingSchedule}
                  />
                )}

                {/* {adminSubTab === "pricing" && (
                  <ManagePricing
                    searchQuery={searchQuery}
                    isModalOpen={isCreatingPlan}
                    setIsModalOpen={setIsCreatingPlan}
                  />
                )} */}

                {adminSubTab === "llmConfig" && (
                  <ManageLLM
                    searchQuery={searchQuery}
                    isCreatingLLM={isCreatingLLM}
                    setIsCreatingLLM={setIsCreatingLLM}
                    isCreatingCompanyConfig={isCreatingCompanyConfig}
                    setIsCreatingCompanyConfig={setIsCreatingCompanyConfig}
                  />
                )}

                {adminSubTab === "masterData" && (
                  <ManageMasterData searchQuery={searchQuery} />
                )}

                {adminSubTab === "kGraphReview" && (
                  <AdminKGraphReview />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};
