import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Edit2, Trash2, Save, X, Loader2, Database, Terminal, ChevronLeft, ChevronRight } from "lucide-react";
import { promptService } from "../../../services/prompt.service";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

export const ManageMasterData = ({ searchQuery = "" }: { searchQuery?: string }) => {
  const [activeTab, setActiveTab] = useState<"dataCategories" | "promptTypes">("dataCategories");

  // Data State
  const [dataCategories, setDataCategories] = useState<any[]>([]);
  const [promptTypes, setPromptTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState(""); // Only for prompt types

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "dataCategories") {
        const res = await promptService.getDataCategories();
        if (res?.success) setDataCategories(res.categories || []);
      } else {
        const res = await promptService.getPromptTypesCrud();
        if (res?.success) setPromptTypes(res.prompt_types || []);
      }
    } catch (error) {
      console.error(error);
      toast.error(`Failed to load ${activeTab === "dataCategories" ? "categories" : "prompt types"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item: any) => {
    setIsEditing(true);
    setEditId(item.id);
    if (activeTab === "dataCategories") {
        setCode(item.category_code);
        setName(item.category_name);
    } else {
        setCode(item.type_code);
        setName(item.display_name);
        setDescription(item.description || "");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    
    try {
      if (activeTab === "dataCategories") {
        await promptService.deleteDataCategory(id);
      } else {
        await promptService.deletePromptType(id);
      }
      toast.success("Deleted successfully");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Delete failed");
    }
  };

  const handleSave = async () => {
    if (!code.trim() || !name.trim()) {
      toast.error("Code and Name are required");
      return;
    }
    
    setIsSaving(true);
    try {
      if (activeTab === "dataCategories") {
        if (isEditing && editId) {
          await promptService.updateDataCategory(editId, code, name);
        } else {
          await promptService.createDataCategory(code, name);
        }
      } else {
        if (isEditing && editId) {
          await promptService.updatePromptType(editId, code, name, description);
        } else {
          await promptService.createPromptType(code, name, description);
        }
      }
      toast.success("Saved successfully");
      handleCancel();
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditId(null);
    setCode("");
    setName("");
    setDescription("");
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-[var(--text-primary)]">
      <div className="flex px-2 pt-2 border-b border-[var(--border)] mb-4">
        <button
          className={`px-4 py-2 flex items-center gap-2 border-b-2 font-medium transition-colors ${
            activeTab === "dataCategories"
              ? "border-[var(--accent)] text-[var(--accent)]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
          onClick={() => { setActiveTab("dataCategories"); handleCancel(); setCurrentPage(1); }}
        >
          <Database size={16} /> Data Categories
        </button>
        <button
          className={`px-4 py-2 flex items-center gap-2 border-b-2 font-medium transition-colors ${
            activeTab === "promptTypes"
              ? "border-[var(--accent)] text-[var(--accent)]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
          onClick={() => { setActiveTab("promptTypes"); handleCancel(); setCurrentPage(1); }}
        >
          <Terminal size={16} /> Prompt Types
        </button>
      </div>

      <div className="flex-1 overflow-auto flex flex-col gap-4 px-2 pb-4">
        {/* Form Section */}
        <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] shadow-sm">
          <h3 className="text-lg font-semibold mb-4">
            {isEditing ? "Edit" : "Add New"} {activeTab === "dataCategories" ? "Category" : "Prompt Type"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-[var(--border)] bg-transparent text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                placeholder={activeTab === "dataCategories" ? "e.g., global" : "e.g., analyze_v1"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-[var(--border)] bg-transparent text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                placeholder={activeTab === "dataCategories" ? "e.g., Global / Generic" : "e.g., Session Analysis"}
              />
            </div>
            {activeTab === "promptTypes" && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-[var(--border)] bg-transparent text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  placeholder="Optional description"
                  rows={2}
                />
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4 justify-end">
             {isEditing && (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-xl bg-gray-500 text-white hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <X size={16} /> Cancel
                </button>
              )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isEditing ? "Update" : "Save"}
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden shadow-sm flex-1 flex flex-col">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="animate-spin text-[var(--accent)]" size={24} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              {(() => {
                const baseData = activeTab === "dataCategories" ? dataCategories : promptTypes;
                const data = baseData.filter(item => {
                  if (!searchQuery) return true;
                  const q = searchQuery.toLowerCase();
                  if (activeTab === "dataCategories") {
                    return (item.category_code?.toLowerCase().includes(q) || item.category_name?.toLowerCase().includes(q));
                  } else {
                    return (item.type_code?.toLowerCase().includes(q) || item.display_name?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q));
                  }
                });
                
                return (
                  <DataTable
                    value={data}
                    paginator
                    rows={5}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    emptyMessage={<div className="p-8 text-center text-[var(--text-secondary)]">No {activeTab === "dataCategories" ? "Categories" : "Prompt Types"} found.</div>}
                    className="w-full text-left"
                    pt={{
                      thead: { className: 'bg-[var(--bg)] border-b border-[var(--border)]' },
                      tbody: { className: 'bg-[var(--surface)]' },
                      bodyRow: { className: 'hover:bg-[var(--bg-hover)] transition-colors border-b border-[var(--border)]' },
                      paginator: {
                        root: { className: '!bg-[var(--surface)] !border-t !border-[var(--border)] !py-3 !px-4 !flex !items-center !justify-center !gap-1' },
                        pages: { className: '!flex !items-center !gap-1' },
                        firstPageButton: ({ context }: any) => ({ className: `!w-9 !h-9 !rounded-lg !border !border-transparent !transition-colors !flex !items-center !justify-center ${context.disabled ? '!opacity-50 !cursor-not-allowed !text-[var(--text-secondary)]' : 'hover:!bg-[var(--surface-hover)] hover:!text-[var(--text-primary)] !text-[var(--text-secondary)] hover:!border-[var(--border)]'}` }),
                        prevPageButton: ({ context }: any) => ({ className: `!w-9 !h-9 !rounded-lg !border !border-transparent !transition-colors !flex !items-center !justify-center ${context.disabled ? '!opacity-50 !cursor-not-allowed !text-[var(--text-secondary)]' : 'hover:!bg-[var(--surface-hover)] hover:!text-[var(--text-primary)] !text-[var(--text-secondary)] hover:!border-[var(--border)]'}` }),
                        nextPageButton: ({ context }: any) => ({ className: `!w-9 !h-9 !rounded-lg !border !border-transparent !transition-colors !flex !items-center !justify-center ${context.disabled ? '!opacity-50 !cursor-not-allowed !text-[var(--text-secondary)]' : 'hover:!bg-[var(--surface-hover)] hover:!text-[var(--text-primary)] !text-[var(--text-secondary)] hover:!border-[var(--border)]'}` }),
                        lastPageButton: ({ context }: any) => ({ className: `!w-9 !h-9 !rounded-lg !border !border-transparent !transition-colors !flex !items-center !justify-center ${context.disabled ? '!opacity-50 !cursor-not-allowed !text-[var(--text-secondary)]' : 'hover:!bg-[var(--surface-hover)] hover:!text-[var(--text-primary)] !text-[var(--text-secondary)] hover:!border-[var(--border)]'}` }),
                        pageButton: ({ context }: any) => ({
                          className: `!w-9 !h-9 !rounded-lg !transition-colors !flex !items-center !justify-center text-sm ${context.active
                            ? '!bg-[var(--accent)] !text-white !font-semibold'
                            : 'hover:!bg-[var(--surface-hover)] hover:!text-[var(--text-primary)] !text-[var(--text-secondary)] hover:!border-[var(--border)] !border !border-transparent'
                            }`
                        }),
                        RPPDropdown: {
                          root: { className: '!bg-[var(--surface)] !border !border-[var(--border)] hover:!border-[var(--accent)] !rounded-lg !px-2 !py-1 text-sm !text-[var(--text-primary)] !flex !items-center !gap-1.5 !cursor-pointer !outline-none !transition-colors' },
                          input: { className: '!px-1 !font-medium' },
                          trigger: { className: '!w-5 !text-[var(--text-secondary)] !flex !items-center !justify-center' },
                          panel: { className: '!bg-[var(--surface)] !border border-[var(--border)] !rounded-lg !shadow-lg !py-1 !mt-1 !z-50' },
                          item: ({ context }: any) => ({
                            className: `!px-4 !py-2 text-sm !cursor-pointer !transition-colors ${context.selected
                              ? '!bg-[var(--accent)] !text-white !font-semibold'
                              : 'hover:!bg-[var(--surface-hover)] !text-[var(--text-primary)]'
                              }`
                          })
                        }
                      }
                    }}
                  >
                    <Column field="id" header="ID" headerClassName="p-4 font-semibold text-sm" className="p-4 text-sm" />
                    <Column field={activeTab === "dataCategories" ? "category_code" : "type_code"} header="Code" headerClassName="p-4 font-semibold text-sm" className="p-4 text-sm" />
                    <Column field={activeTab === "dataCategories" ? "category_name" : "display_name"} header="Display Name" headerClassName="p-4 font-semibold text-sm" className="p-4 text-sm font-medium" />
                    {activeTab === "promptTypes" && <Column field="description" header="Description" headerClassName="p-4 font-semibold text-sm" className="p-4 text-sm text-[var(--text-secondary)]" />}
                    <Column
                      header="Actions"
                      headerClassName="p-4 font-semibold text-sm !text-center"
                      className="p-4 text-sm !text-center"
                      style={{ width: '120px' }}
                      body={(item: any) => (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    />
                  </DataTable>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
