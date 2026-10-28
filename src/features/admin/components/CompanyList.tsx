import React, { useState, useEffect } from "react";
import { Loader2, Save, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { companyService } from "../../../services/company.service";
import { pricingService } from "../../../services/pricing.service";
import { PricingPlan } from "../types";

export type PlanType = string;

export interface CompanyItem {
  id: number;
  company_name: string;
  company_type: string;
  address: string;
  phone_number: string;
  plan_type: PlanType;
}

interface CompanyListProps {
  searchQuery?: string;
  isCreatingCompany?: boolean;
  setIsCreatingCompany?: (val: boolean) => void;
}

export const CompanyList: React.FC<CompanyListProps> = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<PricingPlan[]>([]);

  const [formData, setFormData] = useState({
    company_name: "",
    company_type: "",
    address: "",
    phone_number: "+91 ",
    plan_type: "N/A",
  });

  const [companyId, setCompanyId] = useState<number | null>(null);

  useEffect(() => {
    fetchPlans();
    fetchCompany();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await pricingService.getPlans();
      if (response && response.pricing) {
        setAvailablePlans(response.pricing);
      }
    } catch (error) {
      console.error("Failed to load plans:", error);
    }
  };

  const fetchCompany = async () => {
    setIsLoading(true);
    try {
      const response = await companyService.getCompanies();
      const companiesList = response.data?.data || response.data || [];
      if (companiesList.length > 0) {
        const comp = companiesList[0];
        setCompanyId(comp.id);
        setFormData({
          company_name: comp.company_name || "",
          company_type: comp.company_type || "General",
          address: comp.address || "",
          phone_number: comp.phone_number || "+91 ",
          plan_type: comp.plan_type || "N/A",
        });
        setIsEditMode(true);
      } else {
        setIsEditMode(false);
      }
    } catch (error) {
      toast.error("Failed to load company details");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith("+91 ")) {
      val = "+91 " + val.replace(/\+91\s?/g, "");
    }
    const digits = val.slice(4).replace(/\D/g, "").slice(0, 10);
    val = "+91 " + digits;
    setFormData({ ...formData, phone_number: val });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name.trim()) return;

    setIsLoading(true);
    try {
      const payload = {
        company_name: formData.company_name.trim(),
        company_type: formData.company_type.trim() || "General",
        address: formData.address.trim() || "N/A",
        phone_number: formData.phone_number.trim() || "N/A",
        plan_type: formData.plan_type,
      };

      if (isEditMode && companyId !== null) {
        await companyService.updateCompany(companyId, payload);
        toast.success("Company details updated successfully!");
      } else {
        const response = await companyService.createCompany(payload);
        if (response.id) setCompanyId(response.id);
        toast.success("Company created successfully!");
        setIsEditMode(true);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Operation failed";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2 ml-1">
              Company Name *
            </label>
            <input
              autoFocus={!isEditMode}
              type="text"
              required
              placeholder="Enter company name..."
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2 ml-1">
              Company Type
            </label>
            <input
              type="text"
              placeholder="e.g. Technology, Healthcare"
              value={formData.company_type}
              onChange={(e) => setFormData({ ...formData, company_type: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2 ml-1">
              Phone Number
            </label>
            <input
              type="text"
              placeholder="+91 98765 43210"
              value={formData.phone_number}
              onChange={handlePhoneChange}
              className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-mono transition-shadow"
            />
          </div>

          {/* <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2 ml-1">
              Plan Type
            </label>
            <select
              value={formData.plan_type}
              onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] cursor-pointer transition-shadow"
            >
              {availablePlans.map((plan) => (
                <option key={plan.id} value={plan.plan_name}>
                  {plan.plan_name}
                </option>
              ))}
              {availablePlans.length === 0 && (
                <option value="N/A">N/A (No plans created)</option>
              )}
            </select>
          </div> */}
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2 ml-1">
            Full Address
          </label>
          <textarea
            placeholder="Enter full office address..."
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-shadow resize-y"
          />
        </div>

        <div className="pt-6">
          <button
            type="submit"
            disabled={isLoading || !formData.company_name.trim()}
            className="px-8 py-3 rounded-xl bg-[var(--accent)] text-sm font-semibold text-white hover:bg-[var(--accent)]/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-[var(--accent)]/20 min-w-[160px]"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isEditMode ? (
              <>
                <Save className="w-5 h-5" />
                Update Details
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Add Company
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};


