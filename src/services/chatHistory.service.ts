import { apiService, IApiService } from './api.service';
import { API_ENDPOINTS } from './api.config';

export interface QueryHistoryItem {
  answer: string;
  follow_up_questions: string[];
  question: string;
  questionId: string;
  visualizations: any[];
}

export interface QuerySession {
  querySessionHistory: QueryHistoryItem[];
  querySessionId: string;
  querySessionName: string;
  userId?: number;
  userName?: string;
}

export interface ChatHistoryResponse {
  querySessions: QuerySession[];
  status: string;
  statusCode: number;
}

export interface IChatHistoryService {
  getSessionChatHistory(sessionId: string, userId: number): Promise<ChatHistoryResponse>;
  saveSessionChatHistory(data: any): Promise<any>;
}

class ChatHistoryService implements IChatHistoryService {
  private api: IApiService;

  constructor(api: IApiService) {
    this.api = api;
  }

  async getSessionChatHistory(sessionId: string, userId: number): Promise<ChatHistoryResponse> {
    return this.api.get(`${API_ENDPOINTS.COMMON.SESSION_CHAT_HISTORY}?session_id=${sessionId}&user_id=${userId}`);
  }

  async saveSessionChatHistory(data: any): Promise<any> {
    return this.api.post(API_ENDPOINTS.COMMON.SESSION_CHAT_HISTORY, data);
  }
}

export const chatHistoryService: IChatHistoryService = new ChatHistoryService(apiService);
