export type StepStatus = 'pending' | 'processing' | 'awaiting_input' | 'completed' | 'error';

export interface AgentSituation {
  buttons: string[];
  message: string;
  table: string;
  type: string;
}

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  agentName: string;
  status: StepStatus;
  activities: string[];
  question?: string;
  options?: string[];
}

export interface WorkflowState {
  currentStepIndex: number;
  steps: WorkflowStep[];
}

export interface AgentHistoryItem {
  id: string;
  date: string;
  action: string;
  details: string;
  status: 'completed' | 'pending_input' | 'processing' | 'failed';
  prompt?: string;
  options?: string[];
  activities?: string[];
  customInputType?: 'table_selection' | 'session_analysis_selection';
  customInputData?: any;
  connectionName?: string;
  connectorId?: string;
  session_id?: string;
  contextualInsights?: string[];
  situations?: AgentSituation[];
  db_type?: string;
  topic?: string;
}

export interface AgentData {
  id: string;
  name: string;
  historyName: string;
  icon: string;
  description: string;
  history: AgentHistoryItem[];
}
