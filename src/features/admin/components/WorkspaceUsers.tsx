import React, { useState, useEffect } from "react";
import { Layout, Users, Loader2, Search } from "lucide-react";
import { Workspace } from "../../../services/workspace.service";
import { AdminUser } from "../types";
import { adminService } from "../../../services/admin.service";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

interface WorkspaceUsersProps {
  workspaces: Workspace[];
  searchQuery: string;
}

export const WorkspaceUsers: React.FC<WorkspaceUsersProps> = ({
  workspaces,
  searchQuery,
}) => {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(
    null,
  );
  const [workspaceUsers, setWorkspaceUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchWorkspaceUsers(selectedWorkspaceId);
  }, [selectedWorkspaceId]);

  const fetchWorkspaceUsers = async (workspaceId: number) => {
    setIsLoading(true);
    try {
      const response = await adminService.getWorkspaceUsers(workspaceId);
      if (response?.assigned_users) {
        setWorkspaceUsers(response.assigned_users);
      }
    } catch (err) {
      console.error("Failed to fetch workspace users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = workspaceUsers.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      (u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      ((u as any).company_name || "").toLowerCase().includes(q) ||
      ((u as any).role || "").toLowerCase().includes(q)
    );
  });

  const displayUsers = filteredUsers.map((u, index) => ({
    ...u,
    displayIndex: index + 1
  }));

  return (
    <div className="space-y-6">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
        <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
          Select Workspace to view Users
        </label>
        <div className="relative max-w-md">
          <select
            value={selectedWorkspaceId || ""}
            onChange={(e) =>
              setSelectedWorkspaceId(Number(e.target.value) || null)
            }
            className="w-full pl-4 pr-10 py-3 appearance-none rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] cursor-pointer"
          >
            <option value="">-- All Workspaces --</option>
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.workspace_name}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
            <Layout className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[var(--border)] bg-[var(--bg)]/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <Users className="w-4 h-4" />
            <span className="text-sm font-semibold">
              {selectedWorkspaceId
                ? "Workspace Members"
                : "All Workspace Members"}
            </span>
          </div>
          <div className="text-xs font-medium text-[var(--text-secondary)]">
            {filteredUsers.length} Users found
          </div>
        </div>

        <DataTable
          value={displayUsers}
          paginator
          rows={5}
          rowsPerPageOptions={[5, 10, 25, 50]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
          tableStyle={{ minWidth: "50rem" }}
          emptyMessage={
            <div className="p-8 text-center text-[var(--text-secondary)]">
              {searchQuery
                ? "No users match your search."
                : "No users found for this workspace."}
            </div>
          }
          loading={isLoading}
          loadingIcon={
            <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
          }
          className="border-t border-[var(--border)] bg-[var(--surface)]"
          pt={{
            thead: { className: "bg-[var(--bg)]/50" },
            tbody: { className: "bg-[var(--surface)]" },
            bodyRow: {
              className: "hover:bg-[var(--surface-hover)] transition-colors",
            },
            paginator: {
              root: {
                className:
                  "!bg-[var(--surface)] !border-t !border-[var(--border)] !py-3 !px-4 !flex !flex-row !flex-nowrap !items-center !justify-center !gap-1.5",
              },
              pages: {
                className: "!flex !flex-row !items-center !gap-1",
              },
              firstPageButton: ({ context }: any) => ({
                className: `!w-9 !h-9 !rounded-lg !border !border-transparent !transition-colors !inline-flex !items-center !justify-center ${context.disabled ? '!opacity-50 !cursor-not-allowed !text-[var(--text-secondary)]' : 'hover:!bg-[var(--surface-hover)] hover:!text-[var(--text-primary)] !text-[var(--text-secondary)] hover:!border-[var(--border)]'}`,
              }),
              prevPageButton: ({ context }: any) => ({
                className: `!w-9 !h-9 !rounded-lg !border !border-transparent !transition-colors !inline-flex !items-center !justify-center ${context.disabled ? '!opacity-50 !cursor-not-allowed !text-[var(--text-secondary)]' : 'hover:!bg-[var(--surface-hover)] hover:!text-[var(--text-primary)] !text-[var(--text-secondary)] hover:!border-[var(--border)]'}`,
              }),
              nextPageButton: ({ context }: any) => ({
                className: `!w-9 !h-9 !rounded-lg !border !border-transparent !transition-colors !inline-flex !items-center !justify-center ${context.disabled ? '!opacity-50 !cursor-not-allowed !text-[var(--text-secondary)]' : 'hover:!bg-[var(--surface-hover)] hover:!text-[var(--text-primary)] !text-[var(--text-secondary)] hover:!border-[var(--border)]'}`,
              }),
              lastPageButton: ({ context }: any) => ({
                className: `!w-9 !h-9 !rounded-lg !border !border-transparent !transition-colors !inline-flex !items-center !justify-center ${context.disabled ? '!opacity-50 !cursor-not-allowed !text-[var(--text-secondary)]' : 'hover:!bg-[var(--surface-hover)] hover:!text-[var(--text-primary)] !text-[var(--text-secondary)] hover:!border-[var(--border)]'}`,
              }),
              pageButton: ({ context }: any) => ({
                className: `!w-9 !h-9 !rounded-lg !transition-colors !inline-flex !items-center !justify-center text-sm ${context.active
                    ? "!bg-[var(--accent)] !text-white !font-semibold"
                    : "hover:!bg-[var(--surface-hover)] hover:!text-[var(--text-primary)] !text-[var(--text-secondary)] hover:!border-[var(--border)] !border !border-transparent"
                  }`,
              }),
              RPPDropdown: {
                root: {
                  className:
                    "!bg-[var(--surface)] !border !border-[var(--border)] hover:!border-[var(--accent)] !rounded-lg !px-2 !py-1 text-sm !text-[var(--text-primary)] !inline-flex !flex-row !items-center !gap-1.5 !cursor-pointer !outline-none !transition-colors",
                },
                input: { className: "!px-1 !font-medium !inline-block" },
                trigger: {
                  className:
                    "!w-5 !text-[var(--text-secondary)] !inline-flex !items-center !justify-center",
                },
                panel: {
                  className:
                    "!bg-[var(--surface)] !border border-[var(--border)] !rounded-lg !shadow-lg !py-1 !mt-1 !z-50",
                },
                list: {
                  className: "!py-1 !m-0 !list-none !flex !flex-col",
                },
                item: ({ context }: any) => ({
                  className: `!px-4 !py-2 text-sm !cursor-pointer !transition-colors ${context.selected
                      ? "!bg-[var(--accent)] !text-white !font-semibold"
                      : "hover:!bg-[var(--surface-hover)] !text-[var(--text-primary)]"
                    }`,
                }),
              },
            },
          }}
        >
          <Column
            field="displayIndex"
            header="SL NO"
            headerClassName="!bg-[var(--bg)]/50 !text-[var(--text-secondary)] font-bold text-xs uppercase tracking-tight !px-6 !py-4 !border-b !border-[var(--border)] text-left"
            className="!px-6 !py-4 !border-b !border-[var(--border)] text-sm !text-[var(--text-secondary)] font-medium"
            style={{ width: "10%" }}
          />
          <Column
            field="name"
            header="Name"
            headerClassName="!bg-[var(--bg)]/50 !text-[var(--text-secondary)] font-bold text-xs uppercase tracking-tight !px-6 !py-4 !border-b !border-[var(--border)] text-left"
            className="!px-6 !py-4 !border-b !border-[var(--border)] text-sm !text-[var(--text-primary)] font-medium truncate"
            style={{ width: "25%" }}
            body={(user: AdminUser) => user.name || "N/A"}
          />
          <Column
            field="email"
            header="Email"
            headerClassName="!bg-[var(--bg)]/50 !text-[var(--text-secondary)] font-bold text-xs uppercase tracking-tight !px-6 !py-4 !border-b !border-[var(--border)] text-left"
            className="!px-6 !py-4 !border-b !border-[var(--border)] text-sm !text-[var(--text-secondary)] truncate"
            style={{ width: "25%" }}
          />
          <Column
            field="workspace_name"
            header="Workspace"
            headerClassName="!bg-[var(--bg)]/50 !text-[var(--text-secondary)] font-bold text-xs uppercase tracking-tight !px-6 !py-4 !border-b !border-[var(--border)] text-left"
            className="!px-6 !py-4 !border-b !border-[var(--border)] text-sm !text-[var(--text-secondary)] truncate"
            style={{ width: "25%" }}
            body={(user: AdminUser) => (user as any).workspace_name || "N/A"}
          />
          <Column
            field="assigned_at"
            header="Assigned At"
            headerClassName="!bg-[var(--bg)]/50 !text-[var(--text-secondary)] font-bold text-xs uppercase tracking-tight !px-6 !py-4 !border-b !border-[var(--border)] text-left"
            className="!px-6 !py-4 !border-b !border-[var(--border)] text-xs !text-[var(--text-secondary)] font-medium"
            style={{ width: "15%" }}
            body={(user: AdminUser) => {
              const dateStr = (user as any).assigned_at;
              if (!dateStr) return "N/A";
              try {
                const date = new Date(dateStr);
                const d = String(date.getDate()).padStart(2, "0");
                const m = String(date.getMonth() + 1).padStart(2, "0");
                const y = String(date.getFullYear()).slice(-2);
                const hours = String(date.getHours()).padStart(2, "0");
                const minutes = String(date.getMinutes()).padStart(2, "0");
                return `${d}/${m}/${y} ${hours}:${minutes}`;
              } catch (e) {
                return dateStr;
              }
            }}
          />
        </DataTable>
      </div>
    </div>
  );
};
