import { apiService } from './api.service';
import { API_ENDPOINTS } from './api.config';
import { PricingPlan } from '../features/admin/types';

export const pricingService = {
  getPlans: async (): Promise<{ status: string; pricing: PricingPlan[] }> => {
    return apiService.get<{ status: string; pricing: PricingPlan[] }>(API_ENDPOINTS.PRICING.BASE);
  },

  createPlan: async (data: Omit<PricingPlan, 'id' | 'created_at' | 'updated_at'>): Promise<{ status: string; message: string }> => {
    return apiService.post<{ status: string; message: string }>(API_ENDPOINTS.PRICING.BASE, data);
  },

  updatePlan: async (id: number, data: Partial<PricingPlan>): Promise<{ status: string; message: string }> => {
    return apiService.put<{ status: string; message: string }>(`${API_ENDPOINTS.PRICING.BASE}/${id}`, data);
  },

  deletePlan: async (id: number): Promise<{ status: string; message: string }> => {
    return apiService.delete<{ status: string; message: string }>(`${API_ENDPOINTS.PRICING.BASE}/${id}`);
  }
};
