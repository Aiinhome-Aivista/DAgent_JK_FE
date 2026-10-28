import { apiService } from './api.service';
import { API_ENDPOINTS } from './api.config';

export const authService = {
  login: async (email: string, password?: string) => {
    return apiService.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
  },
  adminLogin: async (email: string, password?: string) => {
    return apiService.post(API_ENDPOINTS.AUTH.ADMIN_LOGIN, { email, password });
  }
};
