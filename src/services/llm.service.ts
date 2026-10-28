import { apiService } from './api.service';
import { API_ENDPOINTS } from './api.config';
import { LLMProvider, ScenarioAssignment } from '../features/admin/components/ManageLLM';

export interface CreateProviderPayload {
  name: string;
  provider_type: string;
  api_key?: string;
  model_name: string;
  base_url?: string;
  is_active?: boolean;
  company_id?: number | null;
}

export const llmService = {
  // ── Providers ───────────────────────────────────────────────────────────────
  getProviders: async (company_id?: number | null): Promise<{ status: boolean; providers: LLMProvider[] }> => {
    const params = company_id ? `?company_id=${company_id}` : '';
    return apiService.get(`${API_ENDPOINTS.LLM.PROVIDERS}${params}`);
  },

  createProvider: async (data: CreateProviderPayload): Promise<{ status: boolean; msg: string; id: number }> => {
    return apiService.post(API_ENDPOINTS.LLM.PROVIDERS, data);
  },

  updateProvider: async (id: number, data: Partial<CreateProviderPayload>): Promise<{ status: boolean; msg: string }> => {
    return apiService.put(`${API_ENDPOINTS.LLM.PROVIDERS}/${id}`, data);
  },

  deleteProvider: async (id: number): Promise<{ status: boolean; msg: string }> => {
    return apiService.delete(`${API_ENDPOINTS.LLM.PROVIDERS}/${id}`);
  },

  testProvider: async (id: number): Promise<{ status: boolean; msg: string; response?: string }> => {
    return apiService.post(`${API_ENDPOINTS.LLM.PROVIDERS}/${id}/test`, {});
  },

  // ── Assignments ─────────────────────────────────────────────────────────────
  getAssignments: async (company_id?: number | string | null): Promise<{ status: boolean; assignments: ScenarioAssignment[] }> => {
    const params = company_id ? `?company_id=${company_id}` : '';
    return apiService.get(`${API_ENDPOINTS.LLM.ASSIGNMENTS}${params}`);
  },

  deleteAssignments: async (company_id: number): Promise<{ status: boolean; msg: string }> => {
    return apiService.delete(`${API_ENDPOINTS.LLM.ASSIGNMENTS}?company_id=${company_id}`);
  },

  updateAssignments: async (
    assignments: Partial<ScenarioAssignment>[],
    company_id?: number | null
  ): Promise<{ status: boolean; msg: string }> => {
    return apiService.put(API_ENDPOINTS.LLM.ASSIGNMENTS, { assignments, company_id: company_id ?? null });
  },
};
