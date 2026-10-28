export interface FieldGuide {
  title: string;
  description: string;
  tip: string;
}

export interface WebSearchResult {
  id?: string;
  url: string;
  title: string;
  brief: string;
  search_id?: string;
}

export interface ConnectorFormData {
  name: string;
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  schema?: string;
  warehouse?: string;
  role?: string;
  use_ssh?: boolean;
  ssh_host?: string;
  ssh_port?: string;
  ssh_username?: string;
  ssh_password?: string;
  use_same_credentials?: boolean;
}

