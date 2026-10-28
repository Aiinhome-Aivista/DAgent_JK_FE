import { apiService } from './api.service';
import { API_ENDPOINTS } from './api.config';

export interface Company {
    id: number;
    company_name: string;
    company_type?: string;
    address?: string;
    phone_number?: string;
    plan_type?: string;
    created_at?: string;
}

export const companyService = {
    getCompanies: async (): Promise<any> => {
        return apiService.get(API_ENDPOINTS.COMPANY.GET_COMPANIES);
    },

    createCompany: async (companyData: Partial<Company>): Promise<any> => {
        return apiService.post(API_ENDPOINTS.COMPANY.CREATE_COMPANY, companyData);
    },

    updateCompany: async (companyId: number, companyData: Partial<Company>): Promise<any> => {
        return apiService.put(`${API_ENDPOINTS.COMPANY.EDIT_COMPANY}/${companyId}`, companyData);
    },

    deleteCompany: async (companyId: number): Promise<any> => {
        return apiService.delete(`${API_ENDPOINTS.COMPANY.DELETE_COMPANY}/${companyId}`);
    }
};
