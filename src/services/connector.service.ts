import { Connector } from '../features/connectors/types';
import { apiService, IApiService } from './api.service';
import { API_ENDPOINTS } from './api.config';

export interface IConnectorService {
  getCollections(connectorId: string): Promise<string[]>;
  addConnector(connector: Omit<Connector, 'id' | 'status'>): Promise<Connector>;
  createConnector(payload: any, userId?: number | null): Promise<any>;
  getConnectionHistory(sessionId: string | null): Promise<any>;
  continueToImport(payload: { user_id: string; connection_ids: string[]; session_id?: string }): Promise<any>;
  searchWeb(query: string, sessionId: string | null): Promise<any>;
  saveResult(payload: any): Promise<any>;
  getSavedResults(userId: string, topic?: string): Promise<any>;
  deleteSavedResult(id: string, userId: string): Promise<any>;
  describeSavedContent(userId: string): Promise<any>;
  getSessionSources(sessionId: string): Promise<any>;
  processSessionAnalysis(payload: { session_id: string; topics?: string[]; databases?: string[] }): Promise<any>;
  sendSessionChat(payload: { session_id: string; question: string; user_id?: number | string | null; visit_number?: number; is_new_query?: boolean }): Promise<any>;
  uploadCsv(payload: { user_id: string; session_id: string; files: File[] }): Promise<any>;
  importCsvData(payload: { user_id: number; connection_id?: number; connection_ids?: number[]; session_id: string }): Promise<any>;
  importSqlData(payload: { user_id: number; connection_id: number; session_id: string }): Promise<any>;
  deleteConnectionHistory(id: string, sessionId: string): Promise<any>;
  // ─── SAP HANA metadata (no data copy) ──────────────────────────────────
  discoverHanaMetadata(payload: { user_id: number; connection_id: number; session_id?: string | null }): Promise<any>;
  getHanaMetadata(connectionId: number, sessionId?: string | null, userId?: number | null): Promise<any>;
  getHanaKgraphStatus(sessionId: string, connectionId?: number | null): Promise<any>;
  rebuildHanaKgraph(payload: { connection_id: number; session_id: string; user_id?: number | null }): Promise<any>;
}

class ConnectorService implements IConnectorService {
  private api: IApiService;

  private collections: Record<string, string[]> = {
    '1': ['users', 'orders', 'products', 'transactions'],
    '2': ['leads', 'opportunities', 'campaigns']
  };

  constructor(api: IApiService) {
    this.api = api;
  }

  async getCollections(connectorId: string): Promise<string[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.collections[connectorId] || ['table1', 'table2']);
      }, 500);
    });
  }

  async addConnector(connector: Omit<Connector, 'id' | 'status'>): Promise<Connector> {
    const newConnector: Connector = {
      ...connector,
      id: Math.random().toString(36).substr(2, 9),
      status: 'connected'
    };

    this.collections[newConnector.id] = ['new_table_1', 'new_table_2'];

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(newConnector);
      }, 500);
    });
  }

  async createConnector(payload: any): Promise<any> {
    return this.api.post(API_ENDPOINTS.DATA_SOURCE.CREATE_CONNECTORS, payload);
  }

  async getConnectionHistory(sessionId: string | null): Promise<any> {
    if (!sessionId) return Promise.resolve({ status: 'success', agents: [] });
    return this.api.get(`${API_ENDPOINTS.DATA_SOURCE.CONNECTION_HISTORY}?session_id=${sessionId}`);
  }

  async deleteConnectionHistory(id: string, sessionId: string): Promise<any> {
    return this.api.delete(`${API_ENDPOINTS.DATA_SOURCE.CONNECTION_HISTORY}?id=${id}&session_id=${sessionId}`);
  }

  async continueToImport(payload: { user_id: string; connection_ids: string[]; session_id?: string }): Promise<any> {
    return this.api.post(API_ENDPOINTS.IMPORT.CONTINUE_TO_IMPORT, payload);
  }

  async searchWeb(query: string, sessionId: string | null): Promise<any> {
    return this.api.post(API_ENDPOINTS.DATA_SOURCE.WEB_SEARCH, {
      topic: query,
      session_id: sessionId
    });
  }

  async saveResult(payload: any): Promise<any> {
    return this.api.post(API_ENDPOINTS.IMPORT.SAVE_RESULT_SEARCH, payload);
  }

  async getSavedResults(userId: string, topic?: string): Promise<any> {
    if (!topic) {
      return Promise.resolve({ status: 'success', results: [] });
    }
    const url = `${API_ENDPOINTS.IMPORT.GET_SAVED_RESULTS}?user_id=${userId}&topic=${encodeURIComponent(topic)}`;
    return this.api.get(url);
  }

  async deleteSavedResult(id: string, userId: string): Promise<any> {
    return this.api.delete(`${API_ENDPOINTS.IMPORT.DELETE_SAVED_RESULT}/${id}?user_id=${userId}`);
  }

  async describeSavedContent(userId: string): Promise<any> {
    return this.api.post(API_ENDPOINTS.IMPORT.DESCRIBE_CONTENT, { user_id: userId });
  }

  async getSessionSources(sessionId: string): Promise<any> {
    return this.api.get(`${API_ENDPOINTS.IMPORT.SESSION_SOURCES}?session_id=${sessionId}`);
  }

  async processSessionAnalysis(payload: { session_id: string; topics?: string[]; databases?: string[] }): Promise<any> {
    return this.api.post(API_ENDPOINTS.IMPORT.SESSION_ANALYSIS, payload);
  }

  async sendSessionChat(payload: { session_id: string; question: string; user_id?: number | string | null; visit_number?: number; is_new_query?: boolean }): Promise<any> {
    return this.api.post(API_ENDPOINTS.CHAT.CHAT, payload);
  }

  async uploadCsv(payload: { user_id: string; session_id: string; files: File[] }): Promise<any> {
    const formData = new FormData();
    formData.append('user_id', payload.user_id);
    formData.append('session_id', payload.session_id);
    payload.files.forEach((file) => formData.append('files', file));
    return this.api.post(API_ENDPOINTS.FILE_UPLOAD.CSV_UPLOAD, formData);
  }

  async importCsvData(payload: { user_id: number; connection_id?: number; connection_ids?: number[]; session_id: string }): Promise<any> {
    return this.api.post('/import-csv-data', payload);
  }

  async importSqlData(payload: { user_id: number; connection_id: number; session_id: string }): Promise<any> {
    return this.api.post('/import-sql-data', payload);
  }

  // ─── SAP HANA: Metadata-only extraction (no raw data copied) ──────────────────
  /**
   * Trigger SAP HANA metadata discovery for whitelisted SAP_S4 views.
   * Connects to HANA, extracts schema/columns/PK/FK (NO raw data rows),
   * stores in sap_hana_view_metadata, then builds a KGraph in background.
   */
  async discoverHanaMetadata(
    payload: { user_id: number; connection_id: number; session_id?: string | null }
  ): Promise<any> {
    return this.api.post(API_ENDPOINTS.HANA.DISCOVER_METADATA, payload);
  }

  /**
   * Fetch the stored metadata for a SAP HANA connection.
   */
  async getHanaMetadata(
    connectionId: number,
    sessionId?: string | null,
    userId?: number | null
  ): Promise<any> {
    const params = new URLSearchParams();
    params.set('connection_id', String(connectionId));
    if (sessionId) params.set('session_id', sessionId);
    if (userId)    params.set('user_id', String(userId));
    return this.api.get(`${API_ENDPOINTS.HANA.GET_METADATA}?${params.toString()}`);
  }

  /**
   * Poll the SAP HANA KGraph build status (queued | building | ready | error).
   */
  async getHanaKgraphStatus(sessionId: string, connectionId?: number | null): Promise<any> {
    const params = new URLSearchParams();
    params.set('session_id', sessionId);
    if (connectionId) params.set('connection_id', String(connectionId));
    return this.api.get(`${API_ENDPOINTS.HANA.KGRAPH_STATUS}?${params.toString()}`);
  }

  /**
   * Rebuild the SAP HANA KGraph from the metadata already stored (HANA is not contacted).
   */
  async rebuildHanaKgraph(payload: { connection_id: number; session_id: string; user_id?: number | null }): Promise<any> {
    return this.api.post(API_ENDPOINTS.HANA.BUILD_KGRAPH, payload);
  }
}

export const connectorService: IConnectorService = new ConnectorService(apiService);
