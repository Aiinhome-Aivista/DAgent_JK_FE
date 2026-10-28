import { ApiConfig, defaultConfig } from './api.config';
import toast from 'react-hot-toast';

export interface IApiService {
  get<T>(endpoint: string): Promise<T>;
  post<T>(endpoint: string, data: any): Promise<T>;
  put<T>(endpoint: string, data: any): Promise<T>;
  delete<T>(endpoint: string, data?: any): Promise<T>;
  download(endpoint: string, data: any, filename: string): Promise<void>;
}

class ApiService implements IApiService {
  private config: ApiConfig;

  constructor(config: ApiConfig = defaultConfig) {
    this.config = config;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Backend returns {"msg": "...", "status": false} or {"message": "...", "details": "...", "status": "error"}
      const errorMessage = errorData.message || errorData.msg || `API Error: ${response.status} ${response.statusText}`;
      const detailedMessage = errorData.details ? `${errorMessage}: ${errorData.details}` : errorMessage;
      throw new Error(detailedMessage);
    }
    return response.json();
  }

  private handleError(error: any) {
    // Global error handling logic
    console.error('[Global API Error]', error);
    // You could integrate a toast library here (e.g., toast.error(error.message))
    if (error?.message && error.message.toLowerCase().includes('limit exceeded')) {
      toast.error(error.message, { duration: 5000 });
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const userId = localStorage.getItem('DAgent_user_id');
    if (userId) {
      headers['user_id'] = userId;
      headers['user-id'] = userId; // Fallback in case backend expects kebab-case
    }
    return headers;
  }

  async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    try {
      const isFormData = data instanceof FormData;
      const headers = this.getHeaders();
      
      // If it's FormData, we must let the browser set the Content-Type with the boundary
      if (isFormData) {
        delete headers['Content-Type'];
      }

      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: isFormData ? data : JSON.stringify(data),
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async delete<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async download(endpoint: string, data: any, filename: string): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }
}

// Export as a singleton instance of the interface
export const apiService = new ApiService();
