import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  MessageSquare,
  Save,
  Loader2,
  RefreshCw,
  Plus,
  Edit2,
  ArrowLeft,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Workspace } from "../../../services/workspace.service";
import { promptService } from "../../../services/prompt.service";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Captcha } from "../../../ui-kit";
interface CustomPromptsProps {
  workspaces: Workspace[];
  searchQuery: string;
}

interface DeleteTarget {
  workspace_id: number;
  prompt_type: string;
  data_category: string;
  workspace_name: string;
  prompt_type_label: string;
}

export const CustomPrompts: React.FC<CustomPromptsProps> = ({
  workspaces,
  searchQuery,
}) => {
  const [viewMode, setViewMode] = useState<"list" | "form">("list");

  const [allPrompts, setAllPrompts] = useState<any[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | "">(
    "",
  );
  const [selectedPromptType, setSelectedPromptType] =
    useState<string>("");
  const [selectedDataCategory, setSelectedDataCategory] = useState<string>("global");
  const [promptText, setPromptText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);

  const [promptTypes, setPromptTypes] = useState<
    { value: string; label: string }[]
  >([]);
  const [dataCategories, setDataCategories] = useState<
    { value: string; label: string }[]
  >([]);
  useEffect(() => {
    const loadData = async () => {
      try {
        const [ptRes, dcRes] = await Promise.all([
          promptService.getPromptTypes(),
          promptService.getDataCategories()
        ]);
        if (ptRes?.success && ptRes?.prompt_types) {
          setPromptTypes(ptRes.prompt_types);
        }
        if (dcRes?.success && dcRes?.categories) {
          setDataCategories(dcRes.categories.map((c: any) => ({
            value: c.category_code,
            label: c.category_name
          })));
        }
      } catch (error) {
        console.error("Failed to fetch custom prompts master data", error);
      }
    };
    loadData();
  }, []);

  const fetchAllPrompts = async () => {
    setIsLoadingList(true);
    try {
      const response = await promptService.getAllWorkspacePrompts();
      if (response?.success && response?.prompts) {
        setAllPrompts(response.prompts);
      }
    } catch (error) {
      console.error("Failed to fetch all prompts", error);
      toast.error("Failed to load custom prompts");
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (viewMode === "list") {
      fetchAllPrompts();
    }
  }, [viewMode]);

  const handleAddClick = () => {
    setIsEditMode(false);
    setSelectedWorkspaceId("");
    setSelectedPromptType("");
    setSelectedDataCategory("");
    setPromptText("");
    setViewMode("form");
  };

  const handleEditClick = (prompt: any) => {
    setIsEditMode(true);
    setSelectedWorkspaceId(prompt.workspace_id);
    setSelectedPromptType(prompt.prompt_type);
    setSelectedDataCategory(prompt.data_category);
    setPromptText(prompt.custom_prompt);
    setViewMode("form");
  };

  const handleSave = async () => {
    if (selectedWorkspaceId === "") {
      toast.error("Please select a workspace");
      return;
    }
    if (!selectedPromptType) {
      toast.error("Please select a prompt type");
      return;
    }
    if (!promptText.trim()) {
      toast.error("Prompt cannot be empty");
      return;
    }
    if (!selectedDataCategory.trim()) {
      toast.error("Data Category cannot be empty");
      return;
    }
    setIsSaving(true);
    try {
      const response = await promptService.setWorkspacePrompt(
        selectedWorkspaceId as number,
        selectedPromptType,
        promptText,
        selectedDataCategory
      );
      if (response?.success) {
        toast.success(
          isEditMode
            ? "Custom prompt updated successfully!"
            : "Custom prompt added successfully!",
        );
        setViewMode("list");
      } else {
        toast.error(response?.message || "Failed to save prompt");
      }
    } catch (error) {
      console.error("Failed to save prompt", error);
      toast.error("Failed to save custom prompt");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (p: any) => {
    setDeleteTarget({
      workspace_id: p.workspace_id,
      prompt_type: p.prompt_type,
      data_category: p.data_category,
      workspace_name:
        p.workspace_id === 0
          ? "Global Fallback"
          : p.workspace_name || `Workspace #${p.workspace_id}`,
      prompt_type_label: p.prompt_type_label || p.prompt_type,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const response = await promptService.deleteWorkspacePrompt(
        deleteTarget.workspace_id,
        deleteTarget.prompt_type,
        deleteTarget.data_category
      );
      if (response?.success) {
        toast.success("Custom prompt deleted successfully!");
        setDeleteTarget(null);
        setDeleteConfirmationText("");
        setIsCaptchaValid(false);
        await fetchAllPrompts();
      } else {
        toast.error(response?.message || "Failed to delete prompt");
      }
    } catch (error) {
      console.error("Failed to delete prompt", error);
      toast.error("Failed to delete custom prompt");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPrompts = allPrompts.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      (p.workspace_name || "").toLowerCase().includes(q) ||
      (p.prompt_type_label || "").toLowerCase().includes(q) ||
      (p.custom_prompt || "").toLowerCase().includes(q) ||
      (p.data_category || "").toLowerCase().includes(q)
    );
  });

  const displayPrompts = filteredPrompts.map((p, index) => ({
    ...p,
    displayIndex: index + 1
  }));

  return (
    <div className="w-full h-full flex flex-col space-y-4 min-h-0">
      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xl max-w-md w-full mx-4"
            >
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                Delete Custom Prompt
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
                Are you sure you want to delete the prompt for workspace <span className="font-semibold text-[var(--text-primary)]">{deleteTarget.workspace_name}</span>? This action cannot be undone. Please type <span className="font-bold text-[var(--text-primary)] select-all">{deleteTarget.prompt_type_label}</span> to confirm.
              </p>

              <input
                autoFocus
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] mb-4"
                placeholder={`Type '${deleteTarget.prompt_type_label}' here...`}
              />

              <div className="mb-6">
                <Captcha onValidate={setIsCaptchaValid} expireTimeMs={60000} />
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={() => {
                    setDeleteTarget(null);
                    setDeleteConfirmationText("");
                    setIsCaptchaValid(false);
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleConfirmDelete();
                  }}
                  disabled={
                    isDeleting ||
                    deleteConfirmationText !== deleteTarget.prompt_type_label ||
                    !isCaptchaValid
                  }
                  className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {viewMode === "list" ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm flex flex-col flex-1 min-h-0">
          <div className="shrink-0 p-4 border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2 text-[var(--accent)]">
              <MessageSquare className="w-5 h-5" />
              <span className="text-sm font-semibold">Custom Prompts</span>
            </div>
            <button
              onClick={handleAddClick}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Prompt
            </button>
          </div>

          {isLoadingList ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3 border-t border-[var(--border)]">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
              <span className="text-sm text-[var(--text-secondary)]">
                Loading prompts...
              </span>
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col">
              <DataTable
                value={displayPrompts}
                scrollable
                scrollHeight="flex"
                paginator
                rows={5}
                rowsPerPageOptions={[5, 10, 25, 50]}
                emptyMessage={
                  <div className="p-8 text-center text-[var(--text-secondary)]">
                    {searchQuery
                      ? "No prompts match your search."
                      : "No custom prompts found."}
                  </div>
                }
                className="w-full"
                pt={{
                  wrapper: { className: "custom-scrollbar" },
                  thead: { className: "!bg-[var(--surface)] !z-10" },
                  tbody: { className: "bg-[var(--surface)]" },
                  bodyRow: {
                    className:
                      "hover:bg-[var(--surface-hover)] transition-colors",
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
                  headerClassName="!bg-[var(--bg)] !text-[var(--text-secondary)] font-bold text-xs uppercase tracking-tight !px-4 !py-4 !border-t !border-b !border-[var(--border)] text-left"
                  className="!px-4 !py-4 !border-b !border-[var(--border)] text-sm !text-[var(--text-secondary)] font-medium"
                  style={{ width: "10%" }}
                />
                <Column
                  header="Workspace"
                  headerClassName="!bg-[var(--bg)] !text-[var(--text-secondary)] font-bold text-xs uppercase tracking-tight !px-4 !py-4 !border-t !border-b !border-[var(--border)] text-left"
                  className="!px-4 !py-4 !border-b !border-[var(--border)] text-sm !text-[var(--text-primary)] font-medium truncate"
                  style={{ width: "20%" }}
                  body={(p: any) => (
                    <div className="truncate" title={p.workspace_name}>
                      {p.workspace_id === 0
                        ? "Global"
                        : p.workspace_name || `Workspace #${p.workspace_id}`}
                    </div>
                  )}
                />
                <Column
                  header="Prompt Type"
                  headerClassName="!bg-[var(--bg)] !text-[var(--text-secondary)] font-bold text-xs uppercase tracking-tight !px-4 !py-4 !border-t !border-b !border-[var(--border)] text-left"
                  className="!px-4 !py-4 !border-b !border-[var(--border)] text-sm !text-[var(--text-secondary)] truncate"
                  style={{ width: "20%" }}
                  body={(p: any) => (
                    <div className="truncate">
                      {p.prompt_type_label || p.prompt_type}
                    </div>
                  )}
                />
                <Column
                  header="Data Category"
                  headerClassName="!bg-[var(--bg)] !text-[var(--text-secondary)] font-bold text-xs uppercase tracking-tight !px-4 !py-4 !border-t !border-b !border-[var(--border)] text-left"
                  className="!px-4 !py-4 !border-b !border-[var(--border)] text-sm !text-[var(--text-secondary)] truncate"
                  style={{ width: "20%" }}
                  body={(p: any) => (
                    <div className="truncate capitalize">
                      {p.data_category === 'global' ? 'Global/Generic' : (p.data_category || 'Global/Generic')}
                    </div>
                  )}
                />
                <Column
                  header="Prompt"
                  headerClassName="!bg-[var(--bg)] !text-[var(--text-secondary)] font-bold text-xs uppercase tracking-tight !px-4 !py-4 !border-t !border-b !border-[var(--border)] text-left"
                  className="!px-4 !py-4 !border-b !border-[var(--border)] text-sm !text-[var(--text-secondary)] truncate"
                  style={{ width: "25%" }}
                  body={(p: any) => (
                    <div className="truncate" title={p.custom_prompt}>
                      {p.custom_prompt?.length > 80
                        ? `${p.custom_prompt.substring(0, 80)}...`
                        : p.custom_prompt}
                    </div>
                  )}
                />
                <Column
                  header="Actions"
                  headerClassName="!bg-[var(--bg)] !text-[var(--text-secondary)] font-bold text-xs uppercase tracking-tight !px-4 !py-4 !border-t !border-b !border-[var(--border)] text-right"
                  className="!px-4 !py-4 !border-b !border-[var(--border)] text-right"
                  style={{ width: "15%" }}
                  body={(p: any) => (
                    <div className="flex justify-end items-center gap-1">
                      <button
                        onClick={() => handleEditClick(p)}
                        className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-all cursor-pointer"
                        title="View / Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(p)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                />
              </DataTable>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 pr-2 mb-0">
          <div className="shrink-0 flex items-center gap-4 mb-3 pb-3 border-b border-[var(--border)]">
            <button
              onClick={() => setViewMode("list")}
              className="p-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-secondary)] hover:bg-[var(--bg)]/80 hover:text-[var(--text-primary)] transition-all cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                {isEditMode ? "Edit Custom Prompt" : "Add Custom Prompt"}
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {isEditMode
                  ? "Update the existing system instructions."
                  : "Set global behavior and context for a workspace."}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-4 mb-3">

            <div className="flex-1">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Select Prompt Type
              </label>
              <select
                value={selectedPromptType}
                onChange={(e) => setSelectedPromptType(e.target.value)}
                disabled={isEditMode}
                className="w-full px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all disabled:opacity-50 cursor-pointer disabled:cursor-auto"
              >
                <option value="">-- Select --</option>
                {promptTypes.map((pt) => (
                  <option key={pt.value} value={pt.value}>
                    {pt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Prompt Category
              </label>
              <select
                value={selectedDataCategory}
                onChange={(e) => {
                  // const val = e.target.value;
                  setSelectedDataCategory(e.target.value);
                  // if (val === "global") {
                  //   setSelectedWorkspaceId(0);
                  // }
                }}
                disabled={isEditMode}
                className="w-full px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all disabled:opacity-50 cursor-pointer disabled:cursor-auto"
              >
                <option value="">-- Select --</option>
                {dataCategories.map((dc) => (
                  <option key={dc.value} value={dc.value}>
                    {dc.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Select Workspace
              </label>
              <select
                value={selectedWorkspaceId}
                onChange={(e) =>
                  setSelectedWorkspaceId(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                disabled={isEditMode}
                className="w-full px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all disabled:opacity-50 cursor-pointer disabled:cursor-auto"
              >
                <option value="">-- Choose a workspace --</option>
                <option value={0}>Global</option>
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.workspace_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 space-y-4 pb-2">
            <div className="relative flex-1 min-h-0">
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                className="w-full h-full p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] resize-none font-mono text-sm custom-scrollbar transition-all"
                placeholder="Enter system instructions here..."
              />
            </div>

            <div className="shrink-0 flex items-center justify-between pt-4 border-t border-[var(--border)]">
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <RefreshCw className="w-4 h-4" />
                <span>Changes apply immediately to new sessions.</span>
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent)]/90 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:pointer-events-none cursor-pointer"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {isEditMode ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="shrink-0 grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        <div className="bg-[var(--accent)]/5 border border-[var(--accent)]/20 rounded-xl p-3">
          <h3 className="font-semibold text-[var(--accent)] mb-2">Pro Tips</h3>
          <ul className="space-y-2 text-sm text-[var(--text-secondary)] list-disc list-inside">
            <li>
              Define clear rules about how the AI should interpret columns.
            </li>
            <li>Explicitly forbid the AI from hallucinating data.</li>
            <li>
              If your data is healthcare-related, instruct it to act as a
              medical analyst.
            </li>
          </ul>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5">
          <h3 className="font-semibold text-amber-500 mb-2">
            Note on Structured Queries
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            The strict database querying rules (SQL/AQL syntax guidelines)
            remain intact in the background to ensure stability. Your custom
            prompt focuses entirely on business logic, tone, and analysis
            context.
          </p>
        </div>
      </div>
    </div>
  );
};
