import axios from 'axios';
import { API_ENDPOINTS, defaultConfig } from './api.config';

export interface Workspace {
    id: number;
    name: string;
}

const getUrl = (endpoint: string) => `${defaultConfig.baseUrl.replace(/\/$/, '')}${endpoint}`;

export interface Recipient {
    id: number;
    name: string;
    email: string;
}

export interface ScheduledReport {
    id: number;
    recipient_id: number;
    workspace_id: number;
    report_ids: string[];
    time: string;
    days: string[];
    recipient_name?: string;
    recipient_email?: string;
    workspace_name?: string;
}

export const scheduleService = {
    // Recipients (Commented out as we are using users table now)
    // getRecipients: async () => {
    //     const response = await axios.get(getUrl(API_ENDPOINTS.REPORTS.RECIPIENTS));
    //     return response.data;
    // },
    // addRecipient: async (name: string, email: string) => {
    //     const response = await axios.post(getUrl(API_ENDPOINTS.REPORTS.RECIPIENTS), { name, email });
    //     return response.data;
    // },
    // updateRecipient: async (id: number, name: string, email: string) => {
    //     const response = await axios.put(`${getUrl(API_ENDPOINTS.REPORTS.RECIPIENTS)}/${id}`, { name, email });
    //     return response.data;
    // },
    // deleteRecipient: async (id: number) => {
    //     const response = await axios.delete(`${getUrl(API_ENDPOINTS.REPORTS.RECIPIENTS)}/${id}`);
    //     return response.data;
    // },
    
    // Workspace Users
    getAllUsers: async () => {
        const response = await axios.get(getUrl('/users'));
        return response.data;
    },
    getWorkspaceUsers: async (workspaceId: number) => {
        const response = await axios.post(getUrl('/workspace_users'), { workspace_id: workspaceId });
        return response.data;
    },

    // Schedules
    getSchedules: async () => {
        const response = await axios.get(getUrl(API_ENDPOINTS.REPORTS.SCHEDULES));
        return response.data;
    },
    addSchedule: async (data: Omit<ScheduledReport, 'id' | 'recipient_name' | 'recipient_email' | 'workspace_name'>) => {
        const response = await axios.post(getUrl(API_ENDPOINTS.REPORTS.SCHEDULES), data);
        return response.data;
    },
    updateSchedule: async (id: number, data: Omit<ScheduledReport, 'id' | 'recipient_name' | 'recipient_email' | 'workspace_name'>) => {
        const response = await axios.put(`${getUrl(API_ENDPOINTS.REPORTS.SCHEDULES)}/${id}`, data);
        return response.data;
    },
    deleteSchedule: async (id: number) => {
        const response = await axios.delete(`${getUrl(API_ENDPOINTS.REPORTS.SCHEDULES)}/${id}`);
        return response.data;
    },
    
    // Workspaces
    getWorkspaces: async () => {
        const response = await axios.get(getUrl('/get-workspace'));
        return response.data;
    },
    
    // Master Reports (Static for now as requested)
    getReportOptions: () => {
        return [
            { id: '1', name: 'Year Wise Sales Comparison' },
            { id: '2', name: 'Sales By Zone' },
            { id: '3', name: 'Top 10 Tyre Types By Sales' },
            { id: '4', name: 'Actual Sales By Account Category (Cr)' },
            { id: '5', name: 'Non Billed Accounts %' },
            { id: '6', name: 'Overdue% (As On Date)' },
            { id: '7', name: 'Exposure %' },
            { id: '8', name: 'Sales Revenue' },
            { id: '9', name: 'Domestic Sales Excel Report' }
        ];
    }
};
