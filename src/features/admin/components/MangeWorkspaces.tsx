import React, { useState } from "react";
import { Layout, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Workspace } from "../../../services/workspace.service";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Captcha } from "../../../ui-kit";

interface MangeWorkspaceProps {
  workspaces: Workspace[];
  searchQuery: string;
  isCreatingWorkspace: boolean;
  setIsCreatingWorkspace: (val: boolean) => void;
  newWorkspaceName: string;
  setNewWorkspaceName: (val: string) => void;
  newWorkspaceType: string;
  setNewWorkspaceType: (val: string) => void;
  workspaceTypes: any[];
  handleCreateWorkspace: () => void;
  handleDeleteWorkspace: (id: number) => void;
  isLoading: boolean;
}

export const MangeWorkspace: React.FC<MangeWorkspaceProps> = ({
  workspaces,
  searchQuery,
  isCreatingWorkspace,
  setIsCreatingWorkspace,
  newWorkspaceName,
  setNewWorkspaceName,
  newWorkspaceType,
  setNewWorkspaceType,
  workspaceTypes,
  handleCreateWorkspace,
  handleDeleteWorkspace,
  isLoading,
}) => {
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(
    null,
  );
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);

  const filteredWorkspaces = workspaces.filter((w) => {
    const q = searchQuery.toLowerCase();
    return (
      (w.workspace_name || "").toLowerCase().includes(q) ||
      (w.workspace_type || "").toLowerCase().includes(q) ||
      (w.name || "").toLowerCase().includes(q)
    );
  });

  const displayWorkspaces = filteredWorkspaces.map((w, index) => ({
    ...w,
    displayIndex: index + 1
  }));

  return (
    <div className="space-y-6">
      {/* Create Workspace Form Inline */}
      <AnimatePresence>
        {isCreatingWorkspace && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 border border-[var(--border)] rounded-2xl bg-[var(--surface)] mb-6 flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 ml-1">
                  Workspace Name
                </label>
                <input
                  autoFocus
                  type="text"
                  placeholder="Enter new workspace name..."
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 ml-1">
                  Workspace Type
                </label>
                <select
                  value={newWorkspaceType}
                  onChange={(e) => setNewWorkspaceType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                >
                  {workspaceTypes.map((t) => (
                    <option key={t.id} value={t.type_name}>
                      {t.type_name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleCreateWorkspace}
                disabled={!newWorkspaceName.trim() || isLoading}
                className="px-6 py-2.5 rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-colors disabled:opacity-50 font-medium h-[46px] cursor-pointer"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreatingWorkspace(false);
                  setNewWorkspaceName("");
                  setNewWorkspaceType(workspaceTypes.length > 0 ? workspaceTypes[0].type_name : "");
                }}
                className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors h-[46px] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DataTable
        value={displayWorkspaces}
        paginator
        rows={5}
        rowsPerPageOptions={[5, 10, 25, 50]}
        tableStyle={{ minWidth: "50rem" }}
        emptyMessage={
          <div className="p-8 text-center text-[var(--text-secondary)]">
            No workspaces found.
          </div>
        }
        className="border border-[var(--border)] rounded-2xl overflow-hidden bg-[var(--surface)] shadow-sm"
        pt={{
          thead: { className: "bg-[var(--bg)]/50" },
          tbody: { className: "bg-[var(--surface)]" },
          bodyRow: {
            className: "hover:bg-[var(--surface-hover)] transition-colors",
          },
          paginator: {
            root: {
              className:
                "!bg-[var(--surface)] !border-t !border-[var(--border)] !py-3 !px-4 !flex !items-center !justify-center !gap-1",
            },
            pages: {
              className: "!flex !items-center !gap-1",
            },
            firstPageButton: ({ context }: any) => ({
              className: `!w-9 !h-9 !rounded-lg !border !border-transparent !transition-colors !flex !items-center !justify-center ${context.disabled ? '!opacity-50 !cursor-not-allowed !text-[var(--text-secondary)]' : 'hover:!bg-[var(--surface-hover)] hover:!text-[var(--text-primary)] !text-[var(--text-secondary)] hover:!border-[var(--border)]'}`,
            }),
            prevPageButton: ({ context }: any) => ({
              className: `!w-9 !h-9 !rounded-lg !border !border-transparent !transition-colors !flex !items-center !justify-center ${context.disabled ? '!opacity-50 !cursor-not-allowed !text-[var(--text-secondary)]' : 'hover:!bg-[var(--surface-hover)] hover:!text-[var(--text-primary)] !text-[var(--text-secondary)] hover:!border-[var(--border)]'}`,
            }),
            nextPageButton: ({ context }: any) => ({
              className: `!w-9 !h-9 !rounded-lg !border !border-transparent !transition-colors !flex !items-center !justify-center ${context.disabled ? '!opacity-50 !cursor-not-allowed !text-[var(--text-secondary)]' : 'hover:!bg-[var(--surface-hover)] hover:!text-[var(--text-primary)] !text-[var(--text-secondary)] hover:!border-[var(--border)]'}`,
            }),
            lastPageButton: ({ context }: any) => ({
              className: `!w-9 !h-9 !rounded-lg !border !border-transparent !transition-colors !flex !items-center !justify-center ${context.disabled ? '!opacity-50 !cursor-not-allowed !text-[var(--text-secondary)]' : 'hover:!bg-[var(--surface-hover)] hover:!text-[var(--text-primary)] !text-[var(--text-secondary)] hover:!border-[var(--border)]'}`,
            }),
            pageButton: ({ context }: any) => ({
              className: `!w-9 !h-9 !rounded-lg !transition-colors !flex !items-center !justify-center text-sm ${context.active
                  ? "!bg-[var(--accent)] !text-white !font-semibold"
                  : "hover:!bg-[var(--surface-hover)] hover:!text-[var(--text-primary)] !text-[var(--text-secondary)] hover:!border-[var(--border)] !border !border-transparent"
                }`,
            }),
            RPPDropdown: {
              root: {
                className:
                  "!bg-[var(--surface)] !border !border-[var(--border)] hover:!border-[var(--accent)] !rounded-lg !px-2 !py-1 text-sm !text-[var(--text-primary)] !flex !items-center !gap-1.5 !cursor-pointer !outline-none !transition-colors",
              },
              input: { className: "!px-1 !font-medium" },
              trigger: {
                className:
                  "!w-5 !text-[var(--text-secondary)] !flex !items-center !justify-center",
              },
              panel: {
                className:
                  "!bg-[var(--surface)] !border border-[var(--border)] !rounded-lg !shadow-lg !py-1 !mt-1 !z-50",
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
          headerClassName="!bg-[var(--bg)]/50 !text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wider !px-6 !py-4 !border-b !border-[var(--border)] text-left"
          className="!px-6 !py-4 !border-b !border-[var(--border)] text-sm !text-[var(--text-secondary)] font-medium"
          style={{ width: "15%" }}
        />
        <Column
          field="workspace_name"
          header="Workspace Name"
          headerClassName="!bg-[var(--bg)]/50 !text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wider !px-6 !py-4 !border-b !border-[var(--border)] text-left"
          className="!px-6 !py-4 !border-b !border-[var(--border)] text-sm !text-[var(--text-primary)] font-medium"
          style={{ width: "35%" }}
        />
        <Column
          field="workspace_type"
          header="Type"
          headerClassName="!bg-[var(--bg)]/50 !text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wider !px-6 !py-4 !border-b !border-[var(--border)] text-left"
          className="!px-6 !py-4 !border-b !border-[var(--border)] text-sm !text-[var(--text-primary)] font-medium"
          style={{ width: "15%" }}
          body={(ws: Workspace) => (
            <div className="-ml-3">
              <span className="inline-flex items-center justify-center px-3 rounded-full text-[11px] font-medium bg-[var(--surface-hover)] text-[var(--text-primary)] h-6 border border-[var(--border)]/50">
                {ws.workspace_type || 'Generic'}
              </span>
            </div>
          )}
        />
        <Column
          field="session_id"
          header="Session/WorkSpace ID"
          headerClassName="!bg-[var(--bg)]/50 !text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wider !px-6 !py-4 !border-b !border-[var(--border)] text-left"
          className="!px-6 !py-4 !border-b !border-[var(--border)]"
          style={{ width: "25%" }}
          body={(ws: Workspace) => (
            <div
              className="font-mono text-[11px] text-[var(--text-secondary)] break-all select-all inline-block"
              title={ws.session_id}
            >
              {ws.session_id}
            </div>
          )}
        />
        <Column
          header="Actions"
          headerClassName="!bg-[var(--bg)]/50 !text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wider !px-6 !py-4 !border-b !border-[var(--border)] text-right"
          className="!px-6 !py-4 !border-b !border-[var(--border)] text-right"
          style={{ width: "10%" }}
          body={(ws: Workspace) => (
            <div className="flex justify-start">
              <button
                onClick={() => {
                  setWorkspaceToDelete(ws);
                  setDeleteConfirmationText("");
                  setIsCaptchaValid(false);
                }}
                className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors focus:opacity-100 cursor-pointer"
                title="Delete Workspace"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />
      </DataTable>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {workspaceToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xl max-w-md w-full mx-4"
            >
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                Delete Workspace
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
                Are you sure you want to delete this workspace? This action
                cannot be undone. Please type{" "}
                <span className="font-bold text-[var(--text-primary)] select-all">
                  {workspaceToDelete.workspace_name}
                </span>{" "}
                to confirm.
              </p>

              <input
                autoFocus
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] mb-4"
                placeholder={`Type '${workspaceToDelete.workspace_name}' here...`}
              />

              <div className="mb-6">
                <Captcha onValidate={setIsCaptchaValid} expireTimeMs={60000} />
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={() => {
                    setWorkspaceToDelete(null);
                    setDeleteConfirmationText("");
                    setIsCaptchaValid(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleDeleteWorkspace(workspaceToDelete.id);
                    setWorkspaceToDelete(null);
                    setDeleteConfirmationText("");
                    setIsCaptchaValid(false);
                  }}
                  disabled={
                    deleteConfirmationText !== workspaceToDelete.workspace_name ||
                    !isCaptchaValid
                  }
                  className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
