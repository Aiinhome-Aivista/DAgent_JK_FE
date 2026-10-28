export interface ReportOption {
    id: string;
    name: string;
}

export interface Recipient {
    id: string;
    name: string;
    email: string;
}

export interface ScheduledReport {
    id: string;
    recipientId: string;
    reportId: string;
    days: string[];
    time: string;
}

export const mockReports: ReportOption[] = [
    { id: '1', name: 'Year Wise Sales Comparison' },
    { id: '2', name: 'Sales By Zone' },
    { id: '3', name: 'Top 10 Tyre Types By Sales' },
    { id: '4', name: 'Actual Sales By Account Category (Cr)' },
    { id: '5', name: 'Non Billed Accounts %' },
    { id: '6', name: 'Overdue% (As On Date)' },
    { id: '7', name: 'Exposure %' },
    { id: '8', name: 'Sales Revenue' }
];

export let mockRecipients: Recipient[] = [
    { id: 'r1', name: 'Admin User', email: 'admin@d-agent.ai' },
    { id: 'r2', name: 'Team Group', email: 'team@example.com' }
];

export let mockSchedules: ScheduledReport[] = [
    {
        id: 's1',
        recipientId: 'r1',
        reportId: '1',
        days: ['Monday', 'Friday'],
        time: '09:00'
    }
];

export const updateMockRecipients = (newRecipients: Recipient[]) => {
    mockRecipients = newRecipients;
};

export const updateMockSchedules = (newSchedules: ScheduledReport[]) => {
    mockSchedules = newSchedules;
};
