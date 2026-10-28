import { apiService, IApiService } from './api.service';
import { API_ENDPOINTS } from './api.config';

export interface Workspace {
    id: number;
    session_id: string;
    workspace_name: string;
    is_active: number;
    created_at?: string;
    user_id?: number;
    name?: string;
    workspace_type?: string;
}

export interface WorkspaceType {
    id: number;
    type_name: string;
}

class WorkspaceService {
    private api: IApiService;

    constructor(api: IApiService) {
        this.api = api;
    }

    async createWorkspace(userId: number, name: string, workspaceType: string = 'Generic'): Promise<any> {
        return this.api.post(API_ENDPOINTS.WORKSPACE.CREATE, {
            user_id: userId,
            workspace_name: name,
            workspace_type: workspaceType
        });
    }

    async getWorkspaceTypes(): Promise<any> {
        return this.api.get('/workspace-types');
    }

    async createWorkspaceType(typeName: string): Promise<any> {
        return this.api.post('/workspace-types', { type_name: typeName });
    }

    async getWorkspaces(userId: number): Promise<any> {
        return this.api.get(`${API_ENDPOINTS.WORKSPACE.GET_WORKSPACES}?user_id=${userId}`);
    }

    async setActiveWorkspace(userId: number, workspaceId: number): Promise<any> {
        return this.api.post(API_ENDPOINTS.WORKSPACE.SET_ACTIVE_WORKSPACE, {
            user_id: userId,
            workspace_id: workspaceId
        });
    }
}

export const workspaceService = new WorkspaceService(apiService);
