export interface AdminUser {
    id: number;
    name?: string | null;
    email: string;
    password?: string;
    role?: string;
    role_id?: number;
    created_at?: string;
    updated_at?: string;
    workspaces?: string;
    visibility?: number;
    company_id?: number | null;
    company_name?: string | null;
}

export interface PricingPlan {
    id: number;
    plan_name: string;
    data_storage: number;
    uploads: number;
    insights_queries: number;
    basic_features: string;
    download_allowed: string;
    number_of_users: number;
    custom_kpi: string;
    scheduled_email: string;
    audit_memory?: string;
    connectors?: string;
    price_text?: string;
    created_at?: string;
    updated_at?: string;
}

export type AdminTab = 'users' | 'workspaces' | 'assignUsers' | 'workspaceUsers' | 'company' | 'adminChats' | 'pendingKnowledge' | 'customPrompts' | 'scheduledReports' | 'llmConfig' | 'masterData' | 'kGraphReview';
