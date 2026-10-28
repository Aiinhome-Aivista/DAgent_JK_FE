import { apiService } from './api.service';
import { API_ENDPOINTS } from './api.config';

export const promptService = {
    getPromptTypes: async (): Promise<any> => {
        return apiService.get(API_ENDPOINTS.PROMPTS.GET_TYPES);
    },
    
    getWorkspacePrompts: async (workspaceId: number): Promise<any> => {
        return apiService.get(`${API_ENDPOINTS.PROMPTS.WORKSPACE_PROMPT}/${workspaceId}`);
    },

    getWorkspacePromptByType: async (workspaceId: number, promptType: string): Promise<any> => {
        return apiService.get(`${API_ENDPOINTS.PROMPTS.WORKSPACE_PROMPT}/${workspaceId}/${promptType}`);
    },

    setWorkspacePrompt: async (workspaceId: number, promptType: string, customPrompt: string, dataCategory: string = 'global'): Promise<any> => {
        return apiService.post(API_ENDPOINTS.PROMPTS.WORKSPACE_PROMPT, {
            workspace_id: workspaceId,
            prompt_type: promptType,
            custom_prompt: customPrompt,
            data_category: dataCategory
        });
    },

    getAllWorkspacePrompts: async (): Promise<any> => {
        return apiService.get(API_ENDPOINTS.PROMPTS.GET_ALL_WORKSPACE_PROMPTS);
    },

    deleteWorkspacePrompt: async (workspaceId: number, promptType: string, dataCategory: string = 'global'): Promise<any> => {
        return apiService.delete(API_ENDPOINTS.PROMPTS.DELETE_WORKSPACE_PROMPT, {
            workspace_id: workspaceId,
            prompt_type: promptType,
            data_category: dataCategory
        });
    },

    // --- Master Data Categories ---
    getDataCategories: async (): Promise<any> => {
        return apiService.get('/api/data-categories');
    },
    createDataCategory: async (category_code: string, category_name: string): Promise<any> => {
        return apiService.post('/api/data-categories', { category_code, category_name });
    },
    updateDataCategory: async (id: number, category_code: string, category_name: string): Promise<any> => {
        return apiService.put(`/api/data-categories/${id}`, { category_code, category_name });
    },
    deleteDataCategory: async (id: number): Promise<any> => {
        return apiService.delete(`/api/data-categories/${id}`);
    },

    // --- Prompt Types Master ---
    getPromptTypesCrud: async (): Promise<any> => {
        return apiService.get('/api/prompt-types-crud');
    },
    createPromptType: async (type_code: string, display_name: string, description: string): Promise<any> => {
        return apiService.post('/api/prompt-types-crud', { type_code, display_name, description });
    },
    updatePromptType: async (id: number, type_code: string, display_name: string, description: string): Promise<any> => {
        return apiService.put(`/api/prompt-types-crud/${id}`, { type_code, display_name, description });
    },
    deletePromptType: async (id: number): Promise<any> => {
        return apiService.delete(`/api/prompt-types-crud/${id}`);
    }
};
