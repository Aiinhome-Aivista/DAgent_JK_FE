import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  Database,
  UploadCloud,
  HelpCircle,
  Users,
  Mail,
  Sliders,
  Download,
  AlertTriangle,
} from "lucide-react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { PricingPlan } from "../types";
import { pricingService } from "../../../services/pricing.service";
import { Captcha } from "../../../ui-kit";

interface ManagePricingProps {
  searchQuery: string;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

interface PricingFormData {
  plan_name: string;
  data_storage: number | "";
  uploads: number | "";
  insights_queries: number | "";
  basic_features: string;
  download_allowed: string;
  number_of_users: number | "";
  custom_kpi: string;
  scheduled_email: string;
  audit_memory: string;
  connectors: string;
  price_text: string;
}

const initialFormData: PricingFormData = {
  plan_name: "",
  data_storage: "",
  uploads: "",
  insights_queries: "",
  basic_features: "",
  download_allowed: "Available",
  number_of_users: 1,
  custom_kpi: "Available",
  scheduled_email: "Available",
  audit_memory: "",
  connectors: "",
  price_text: "",
};

export const ManagePricing: React.FC<ManagePricingProps> = ({
  searchQuery,
  isModalOpen,
  setIsModalOpen,
}) => {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<PricingPlan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);
  const [formData, setFormData] = useState<PricingFormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const response = await pricingService.getPlans();
      if (response && response.pricing) {
        setPlans(response.pricing);
      } else {
        setPlans([]);
      }
    } catch (err: any) {
      console.error("Failed to load pricing plans:", err);
      toast.error(err.message || "Failed to load pricing plans");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (isModalOpen && !editingPlan) {
      setFormData(initialFormData);
      setError(null);
    }
  }, [isModalOpen, editingPlan]);

  const normalizeAvailability = (val: string | undefined) => {
    const v = val?.trim().toLowerCase();
    if (v === "available" || v === "allowed" || v === "yes" || v === "true") {
      return "Available";
    }
    return "Unavailable";
  };

  const handleOpenEdit = (plan: PricingPlan) => {
    setEditingPlan(plan);
    const isGold = plan.plan_name?.trim().toLowerCase() === "gold";
    setFormData({
      plan_name: plan.plan_name || "",
      data_storage: isGold || plan.data_storage === -1 ? "" : (plan.data_storage !== undefined ? plan.data_storage : ""),
      uploads: isGold || plan.uploads === -1 ? "" : (plan.uploads !== undefined ? plan.uploads : ""),
      insights_queries: isGold || plan.insights_queries === -1 ? "" : (plan.insights_queries !== undefined ? plan.insights_queries : ""),
      basic_features: plan.basic_features || "",
      download_allowed: normalizeAvailability(plan.download_allowed),
      number_of_users: isGold || plan.number_of_users === -1 ? "" : (plan.number_of_users !== undefined ? plan.number_of_users : 1),
      custom_kpi: normalizeAvailability(plan.custom_kpi),
      scheduled_email: normalizeAvailability(plan.scheduled_email),
      audit_memory: plan.audit_memory || "",
      connectors: plan.connectors || "",
      price_text: plan.price_text || "",
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
    setFormData(initialFormData);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.plan_name.trim()) {
      setError("Plan Name is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const isGold = formData.plan_name.trim().toLowerCase() === "gold";
    const payload = {
      plan_name: formData.plan_name.trim(),
      data_storage: isGold ? -1 : (formData.data_storage === "" ? 0 : Number(formData.data_storage)),
      uploads: isGold ? -1 : (formData.uploads === "" ? 0 : Number(formData.uploads)),
      insights_queries: isGold ? -1 : (formData.insights_queries === "" ? 0 : Number(formData.insights_queries)),
      basic_features: formData.basic_features.trim(),
      download_allowed: formData.download_allowed,
      number_of_users: isGold ? -1 : (formData.number_of_users === "" ? 1 : Number(formData.number_of_users)),
      custom_kpi: formData.custom_kpi,
      scheduled_email: formData.scheduled_email,
      audit_memory: formData.audit_memory.trim(),
      connectors: formData.connectors.trim(),
      price_text: formData.price_text.trim(),
    };

    try {
      if (editingPlan) {
        await pricingService.updatePlan(editingPlan.id, payload);
        toast.success("Pricing plan updated successfully");
      } else {
        await pricingService.createPlan(payload);
        toast.success("Pricing plan created successfully");
      }
      handleCloseModal();
      fetchPlans();
    } catch (err: any) {
      console.error("Error saving pricing plan:", err);
      setError(err.message || "Failed to save pricing plan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!planToDelete) return;
    setIsDeleting(true);
    try {
      await pricingService.deletePlan(planToDelete.id);
      toast.success("Pricing plan deleted successfully");
      setPlanToDelete(null);
      fetchPlans();
    } catch (err: any) {
      console.error("Failed to delete pricing plan:", err);
      toast.error(err.message || "Failed to delete pricing plan");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPlans = plans.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.plan_name?.toLowerCase().includes(q) ||
      p.basic_features?.toLowerCase().includes(q) ||
      p.data_storage?.toString().includes(q) ||
      p.uploads?.toString().includes(q) ||
      p.insights_queries?.toString().includes(q) ||
      p.number_of_users?.toString().includes(q)
    );
  });

  const displayPlans = filteredPlans.map((p, index) => ({
    ...p,
    displayIndex: index + 1
  }));

  const renderLimit = (
    val: number | undefined,
    planName: string | undefined,
    unit?: string
  ) => {
    const isGold = planName?.trim().toLowerCase() === "gold";
    if (isGold || val === -1) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
          Unlimited
        </span>
      );
    }
    if (val === undefined || val === null) return <span>—</span>;
    return (
      <span>
        {val}
        {unit ? ` ${unit}` : ""}
      </span>
    );
  };

  const renderBadge = (value: string | undefined) => {
    const v = value?.trim().toLowerCase();
    const isAvailable =
      v === "available" ||
      v === "allowed" ||
      v === "yes" ||
      v === "true";
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isAvailable
          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
          : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
          }`}
      >
        {isAvailable ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        {isAvailable ? "Available" : "Unavailable"}
      </span>
    );
  };

  const actionBodyTemplate = (rowData: PricingPlan) => {
    return (
      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={() => handleOpenEdit(rowData)}
          title="Edit Plan"
          className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors cursor-pointer"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setPlanToDelete(rowData);
            setDeleteConfirmationText("");
            setIsCaptchaValid(false);
          }}
          title="Delete Plan"
          className="p-1.5 rounded-lg border border-[var(--border)] text-rose-500 hover:border-rose-500/30 hover:bg-rose-500/10 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <DataTable
        value={displayPlans}
        loading={isLoading}
        paginator
        rows={5}
        rowsPerPageOptions={[5, 10, 25, 50]}
        tableStyle={{ minWidth: "60rem" }}
        emptyMessage={
          <div className="p-8 text-center text-[var(--text-secondary)]">
            No pricing plans found.
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
        />
        <Column
          field="plan_name"
          header="Plan Name"
          headerClassName="!bg-[var(--bg)]/50 !text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wider !px-6 !py-4 !border-b !border-[var(--border)] text-left"
          className="!px-6 !py-4 !border-b !border-[var(--border)] text-sm !text-[var(--text-primary)] font-semibold"
          body={(row: PricingPlan) => (
            <span className="font-semibold text-[var(--text-primary)]">
              {row.plan_name}
            </span>
          )}
        />
        <Column
          field="price_text"
          header="Price"
          headerClassName="!bg-[var(--bg)]/50 !text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wider !px-6 !py-4 !border-b !border-[var(--border)] text-left"
          className="!px-6 !py-4 !border-b !border-[var(--border)] text-sm !text-[var(--text-primary)]"
          body={(row: PricingPlan) => (
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {row.price_text || "—"}
            </span>
          )}
        />
        <Column
          field="data_storage"
          header="Storage"
          headerClassName="!bg-[var(--bg)]/50 !text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wider !px-6 !py-4 !border-b !border-[var(--border)] text-left"
          className="!px-6 !py-4 !border-b !border-[var(--border)] text-sm !text-[var(--text-secondary)] font-medium"
          body={(row: PricingPlan) => renderLimit(row.data_storage, row.plan_name, "GB")}
        />
        <Column
          field="uploads"
          header="Uploads"
          headerClassName="!bg-[var(--bg)]/50 !text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wider !px-6 !py-4 !border-b !border-[var(--border)] text-left"
          className="!px-6 !py-4 !border-b !border-[var(--border)] text-sm !text-[var(--text-secondary)] font-medium"
          body={(row: PricingPlan) => renderLimit(row.uploads, row.plan_name, "/ day")}
        />
        <Column
          field="insights_queries"
          header="Queries / Insights"
          headerClassName="!bg-[var(--bg)]/50 !text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wider !px-6 !py-4 !border-b !border-[var(--border)] text-left"
          className="!px-6 !py-4 !border-b !border-[var(--border)] text-sm !text-[var(--text-secondary)] font-medium"
          body={(row: PricingPlan) => renderLimit(row.insights_queries, row.plan_name, "/ day")}
        />
        <Column
          field="number_of_users"
          header="Users"
          headerClassName="!bg-[var(--bg)]/50 !text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wider !px-6 !py-4 !border-b !border-[var(--border)] text-left"
          className="!px-6 !py-4 !border-b !border-[var(--border)] text-sm !text-[var(--text-secondary)] font-medium"
          body={(row: PricingPlan) => renderLimit(row.number_of_users, row.plan_name)}
        />
        <Column
          field="basic_features"
          header="Basic Features"
          headerClassName="!bg-[var(--bg)]/50 !text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wider !px-6 !py-4 !border-b !border-[var(--border)] text-left"
          className="!px-6 !py-4 !border-b !border-[var(--border)] text-sm !text-[var(--text-secondary)] font-medium"
          body={(row: PricingPlan) => (
            <div className="flex flex-wrap gap-1 max-w-xs">
              {row.basic_features ? (
                row.basic_features.split(',').map((feat, idx) => {
                  const featureName = feat.trim();
                  if (!featureName) return null;
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      title={featureName}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span className="truncate max-w-[120px]">{featureName}</span>
                    </span>
                  );
                })
              ) : (
                <span>—</span>
              )}
            </div>
          )}
        />
        <Column
          field="audit_memory"
          header="Audit Memory"
          headerClassName="!bg-[var(--bg)]/50 !text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wider !px-6 !py-4 !border-b !border-[var(--border)] text-left"
          className="!px-6 !py-4 !border-b !border-[var(--border)] text-sm !text-[var(--text-secondary)] font-medium"
          body={(row: PricingPlan) => row.audit_memory || "—"}
        />
        <Column
          field="connectors"
          header="Connectors"
          headerClassName="!bg-[var(--bg)]/50 !text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wider !px-6 !py-4 !border-b !border-[var(--border)] text-left"
          className="!px-6 !py-4 !border-b !border-[var(--border)] text-sm !text-[var(--text-secondary)] font-medium"
          body={(row: PricingPlan) => (
            <div className="max-w-[150px] truncate" title={row.connectors}>
              {row.connectors || "—"}
            </div>
          )}
        />
        <Column
          field="download_allowed"
          header="Download"
          headerClassName="!bg-[var(--bg)]/50 !text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wider !px-6 !py-4 !border-b !border-[var(--border)] text-left"
          className="!px-6 !py-4 !border-b !border-[var(--border)] text-sm"
          body={(row: PricingPlan) => renderBadge(row.download_allowed)}
        />
        <Column
          field="custom_kpi"
          header="Custom KPI"
          headerClassName="!bg-[var(--bg)]/50 !text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wider !px-6 !py-4 !border-b !border-[var(--border)] text-left"
          className="!px-6 !py-4 !border-b !border-[var(--border)] text-sm"
          body={(row: PricingPlan) => renderBadge(row.custom_kpi)}
        />
        <Column
          field="scheduled_email"
          header="Scheduled Email"
          headerClassName="!bg-[var(--bg)]/50 !text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wider !px-6 !py-4 !border-b !border-[var(--border)] text-left"
          className="!px-6 !py-4 !border-b !border-[var(--border)] text-sm"
          body={(row: PricingPlan) => renderBadge(row.scheduled_email)}
        />
        <Column
          body={actionBodyTemplate}
          header="Actions"
          headerClassName="!bg-[var(--bg)]/50 !text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wider !px-6 !py-4 !border-b !border-[var(--border)] text-right"
          className="!px-6 !py-4 !border-b !border-[var(--border)] text-right"
          style={{ width: "100px" }}
        />
      </DataTable>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  {editingPlan ? "Edit Pricing Plan" : "Create Pricing Plan"}
                </h2>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors text-[var(--text-secondary)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm flex items-start gap-2">
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Plan Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                    Plan Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Starter, Pro, Enterprise"
                    value={formData.plan_name}
                    onChange={(e) =>
                      setFormData({ ...formData, plan_name: e.target.value })
                    }
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>

                {/* Price Text */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                    Price Text <span className="text-[var(--text-secondary)] font-normal text-xs">(e.g. 60,000/Y)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 60,000/Y, Custom"
                    value={formData.price_text}
                    onChange={(e) =>
                      setFormData({ ...formData, price_text: e.target.value })
                    }
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>

                {/* Data Storage */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                    Data Storage (GB) <span className="text-rose-500">*</span>
                  </label>
                  {formData.plan_name.trim().toLowerCase() === "gold" ? (
                    <div className="w-full px-4 py-2.5 text-sm rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 font-semibold flex items-center justify-between">
                      <span>Unlimited</span>
                      <span className="text-xs text-[var(--text-secondary)] font-normal">Gold Plan Default</span>
                    </div>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="e.g. 10"
                      value={formData.data_storage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          data_storage:
                            e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  )}
                </div>

                {/* Uploads */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                    Uploads (per day) <span className="text-rose-500">*</span>
                  </label>
                  {formData.plan_name.trim().toLowerCase() === "gold" ? (
                    <div className="w-full px-4 py-2.5 text-sm rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 font-semibold flex items-center justify-between">
                      <span>Unlimited</span>
                      <span className="text-xs text-[var(--text-secondary)] font-normal">Gold Plan Default</span>
                    </div>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="e.g. 50"
                      value={formData.uploads}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          uploads:
                            e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  )}
                </div>

                {/* Insights Queries */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                    Insights Queries (per day) <span className="text-rose-500">*</span>
                  </label>
                  {formData.plan_name.trim().toLowerCase() === "gold" ? (
                    <div className="w-full px-4 py-2.5 text-sm rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 font-semibold flex items-center justify-between">
                      <span>Unlimited</span>
                      <span className="text-xs text-[var(--text-secondary)] font-normal">Gold Plan Default</span>
                    </div>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="e.g. 1000"
                      value={formData.insights_queries}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          insights_queries:
                            e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  )}
                </div>

                {/* Number of Users */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                    Number of Users <span className="text-rose-500">*</span>
                  </label>
                  {formData.plan_name.trim().toLowerCase() === "gold" ? (
                    <div className="w-full px-4 py-2.5 text-sm rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 font-semibold flex items-center justify-between">
                      <span>Unlimited</span>
                      <span className="text-xs text-[var(--text-secondary)] font-normal">Gold Plan Default</span>
                    </div>
                  ) : (
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="e.g. 5"
                      value={formData.number_of_users}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          number_of_users:
                            e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  )}
                </div>

                {/* Basic Features */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                    Basic Features
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Basic Analytics, Document RAG, Graph view"
                    value={formData.basic_features}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        basic_features: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none"
                  />
                </div>

                {/* Download Allowed */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                    Download Allowed
                  </label>
                  <select
                    value={formData.download_allowed}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        download_allowed: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] cursor-pointer"
                  >
                    <option value="Available">Available</option>
                    <option value="Unavailable">Unavailable</option>
                  </select>
                </div>

                {/* Custom KPI */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                    Custom KPI
                  </label>
                  <select
                    value={formData.custom_kpi}
                    onChange={(e) =>
                      setFormData({ ...formData, custom_kpi: e.target.value })
                    }
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] cursor-pointer"
                  >
                    <option value="Available">Available</option>
                    <option value="Unavailable">Unavailable</option>
                  </select>
                </div>

                {/* Scheduled Email */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                    Scheduled Email
                  </label>
                  <select
                    value={formData.scheduled_email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduled_email: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] cursor-pointer"
                  >
                    <option value="Available">Available</option>
                    <option value="Unavailable">Unavailable</option>
                  </select>
                </div>

                {/* Audit Memory */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                    Audit Memory
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3 days, 7 days, unlimited"
                    value={formData.audit_memory}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        audit_memory: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>

                {/* Connectors */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                    Connectors
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. File upload, LLM search"
                    value={formData.connectors}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        connectors: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center gap-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] py-2.5 text-sm font-medium rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingPlan ? (
                    <Edit2 className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {editingPlan ? "Save Changes" : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {planToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-500 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  Delete Pricing Plan
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Are you sure you want to delete the plan{" "}
              <span className="font-semibold text-[var(--text-primary)]">
                "{planToDelete.plan_name}"
              </span>
              ? Please type{" "}
              <span className="font-bold text-[var(--text-primary)] select-all">
                {planToDelete.plan_name}
              </span>{" "}
              to confirm.
            </p>

            <input
              autoFocus
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] mb-4"
              placeholder={`Type '${planToDelete.plan_name}' here...`}
            />

            <div className="mb-6">
              <Captcha onValidate={setIsCaptchaValid} expireTimeMs={60000} />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setPlanToDelete(null);
                  setDeleteConfirmationText("");
                  setIsCaptchaValid(false);
                }}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || deleteConfirmationText !== planToDelete.plan_name || !isCaptchaValid}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
