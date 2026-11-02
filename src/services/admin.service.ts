import { apiService } from './api.service';
import { API_ENDPOINTS } from './api.config';

export interface AdminUser {
    id: number;
    name?: string | null;
    email: string;
    role?: string;
    created_at?: string;
}

export const adminService = {
    getSystemConfigs: async (): Promise<any> => {
        return apiService.get('/api/system-config');
    },

    getSchedulerConfig: async (): Promise<any> => {
        return apiService.get('/api/scheduler/config');
    },

    updateSchedulerConfig: async (data: { schedule_time: string; frequency?: string; is_active?: boolean }): Promise<any> => {
        return apiService.post('/api/scheduler/config', data);
    },

    runSchedulerNow: async (): Promise<any> => {
        return apiService.post('/api/scheduler/run-now');
    },

    updateSystemConfig: async (key: string, value: any, description: string = ''): Promise<any> => {
        return apiService.post('/api/system-config', {
            key,
            value,
            description
        });
    },

    getUsers: async (): Promise<any> => {
        return apiService.get(API_ENDPOINTS.USERS.GET_USERS);
    },

    getAllWorkspaces: async (userId: number): Promise<any> => {
        return apiService.get(`${API_ENDPOINTS.WORKSPACE.GET_ADMIN_WORKSPACES}?user_id=${userId}`);
    },

    assignWorkspace: async (userId: number, workspaceId: number): Promise<any> => {
        return apiService.post('/admin/assign-workspace', {
            user_id: userId,
            workspace_id: workspaceId
        });
    },

    assignWorkspaceUsers: async (adminId: number, workspaceId: number, userIds: number[]): Promise<any> => {
        return apiService.post(API_ENDPOINTS.WORKSPACE.ASSIGN_WORKSPACE_USERS, {
            admin_id: adminId,
            workspace_id: workspaceId,
            user_ids: userIds
        });
    },

    createWorkspace: async (userId: number, workspaceName: string, workspaceType: string = 'Generic'): Promise<any> => {
        return apiService.post(API_ENDPOINTS.WORKSPACE.CREATE, {
            user_id: userId,
            workspace_name: workspaceName,
            workspace_type: workspaceType
        });
    },

    getWorkspaceUsers: async (workspaceId: number): Promise<any> => {
        return apiService.post(API_ENDPOINTS.WORKSPACE.WORKSPACE_USERS, {
            workspace_id: workspaceId
        });
    },

    deleteWorkspace: async (workspaceId: number): Promise<any> => {
        return apiService.delete(`${API_ENDPOINTS.WORKSPACE.GET_WORKSPACES}/${workspaceId}`);
    },

    createUser: async (adminId: number, userData: any): Promise<any> => {
        return apiService.post(API_ENDPOINTS.USERS.CREATE_USER, {
            admin_id: adminId,
            ...userData
        });
    },

    editUser: async (adminId: number, userId: number, userData: any): Promise<any> => {
        return apiService.post(`${API_ENDPOINTS.USERS.EDIT_USER}/${userId}`, {
            admin_id: adminId,
            ...userData
        });
    },

    deleteUser: async (adminId: number, userId: number): Promise<any> => {
        return apiService.delete(`${API_ENDPOINTS.USERS.DELETE_USER}/${userId}`, {
            admin_id: adminId
        });
    }
};
