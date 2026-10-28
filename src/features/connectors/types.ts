export interface Connector {
  id: string;
  name: string;
  description: string;
  type: 'Database' | 'Data Warehouse' | 'Integration' | 'File Upload';
  icon: string;
  status: 'connected' | 'disconnected';
  disabled?: boolean;
}
