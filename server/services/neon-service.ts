import { storage } from '../storage';

export interface NeonProjectInfo {
  id: string;
  name: string;
  region_id: string;
  created_at: string;
  updated_at: string;
  database: {
    name: string;
    host: string;
    port: number;
  };
  branch: {
    id: string;
    name: string;
    primary: boolean;
  };
  compute: {
    id: string;
    name: string;
    state: string;
  };
}

export interface NeonBranchInfo {
  id: string;
  name: string;
  primary: boolean;
  created_at: string;
  updated_at: string;
  database_count: number;
}

export interface NeonDatabaseStats {
  size_bytes: number;
  tables_count: number;
  connections: {
    active: number;
    idle: number;
    total: number;
  };
  performance: {
    cpu_usage: number;
    memory_usage: number;
    storage_usage: number;
  };
}

class NeonService {
  private baseUrl = 'https://console.neon.tech/api/v2';

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const settings = await storage.getNeonSettings();
    
    if (!settings || !settings.apiKey) {
      throw new Error('Neon API key not configured');
    }

    // Demo mode - return mock data for testing
    if (settings.apiKey === 'demo-test-key' || process.env.NODE_ENV === 'development') {
      return this.getMockResponse(endpoint);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${settings.apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Neon API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response;
  }

  private getMockResponse(endpoint: string): Response {
    let mockData: any = {};

    if (endpoint === '/projects') {
      mockData = {
        projects: [
          {
            id: 'demo-project-123',
            name: 'EasyCashFlows Demo',
            region_id: 'eu-central-1',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: new Date().toISOString()
          }
        ]
      };
    } else if (endpoint.includes('/projects/')) {
      if (endpoint.includes('/branches')) {
        mockData = {
          branches: [
            {
              id: 'br-demo-main',
              name: 'main',
              primary: true,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: new Date().toISOString(),
              database_count: 1
            },
            {
              id: 'br-demo-dev',
              name: 'development',
              primary: false,
              created_at: '2024-01-15T00:00:00Z',
              updated_at: new Date().toISOString(),
              database_count: 1
            }
          ]
        };
      } else if (endpoint.includes('/databases')) {
        mockData = {
          databases: [
            {
              id: 'db-demo-main',
              name: 'easycashflows',
              created_at: '2024-01-01T00:00:00Z',
              branch_id: 'br-demo-main'
            }
          ]
        };
      } else if (endpoint.includes('/operations')) {
        mockData = {
          operations: [
            {
              id: 'op-demo-1',
              action: 'create_branch',
              status: 'finished',
              created_at: new Date(Date.now() - 3600000).toISOString()
            },
            {
              id: 'op-demo-2',
              action: 'backup',
              status: 'running',
              created_at: new Date(Date.now() - 1800000).toISOString()
            }
          ]
        };
      } else if (endpoint.includes('/consumption')) {
        mockData = {
          active_time_seconds: 86400,
          compute_time_seconds: 3600,
          written_data_bytes: 1024000,
          data_transfer_bytes: 512000
        };
      } else {
        // Project info
        mockData = {
          project: {
            id: 'demo-project-123',
            name: 'EasyCashFlows Demo',
            region_id: 'eu-central-1',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: new Date().toISOString(),
            database: {
              name: 'easycashflows',
              host: 'demo-host.neon.tech',
              port: 5432
            },
            branch: {
              id: 'br-demo-main',
              name: 'main',
              primary: true
            },
            compute: {
              id: 'cmp-demo-1',
              name: 'demo-compute',
              state: 'active'
            }
          }
        };
      }
    }

    return new Response(JSON.stringify(mockData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async getProjects(): Promise<any[]> {
    try {
      const response = await this.makeRequest('/projects');
      const data = await response.json();
      return data.projects || [];
    } catch (error) {
      console.error('[NEON SERVICE] Error fetching projects:', error);
      throw error;
    }
  }

  async getProjectInfo(projectId?: string): Promise<NeonProjectInfo> {
    try {
      const settings = await storage.getNeonSettings();
      const id = projectId || settings?.projectId;
      
      if (!id) {
        throw new Error('Project ID not provided');
      }

      const response = await this.makeRequest(`/projects/${id}`);
      const data = await response.json();
      return data.project;
    } catch (error) {
      console.error('[NEON SERVICE] Error fetching project info:', error);
      throw error;
    }
  }

  async getBranches(projectId?: string): Promise<NeonBranchInfo[]> {
    try {
      const settings = await storage.getNeonSettings();
      const id = projectId || settings?.projectId;
      
      if (!id) {
        throw new Error('Project ID not provided');
      }

      const response = await this.makeRequest(`/projects/${id}/branches`);
      const data = await response.json();
      return data.branches || [];
    } catch (error) {
      console.error('[NEON SERVICE] Error fetching branches:', error);
      throw error;
    }
  }

  async getDatabases(projectId?: string, branchId?: string): Promise<any[]> {
    try {
      const settings = await storage.getNeonSettings();
      const pId = projectId || settings?.projectId;
      const bId = branchId || settings?.branchName || 'main';
      
      if (!pId) {
        throw new Error('Project ID not provided');
      }

      const response = await this.makeRequest(`/projects/${pId}/branches/${bId}/databases`);
      const data = await response.json();
      return data.databases || [];
    } catch (error) {
      console.error('[NEON SERVICE] Error fetching databases:', error);
      throw error;
    }
  }

  async getConnections(projectId?: string): Promise<any> {
    try {
      const settings = await storage.getNeonSettings();
      const id = projectId || settings?.projectId;
      
      if (!id) {
        throw new Error('Project ID not provided');
      }

      const response = await this.makeRequest(`/projects/${id}/operations`);
      const data = await response.json();
      
      // Mock connection data based on operations
      return {
        active: data.operations?.filter((op: any) => op.status === 'running').length || 0,
        idle: 2,
        total: data.operations?.length || 0,
      };
    } catch (error) {
      console.error('[NEON SERVICE] Error fetching connections:', error);
      return { active: 0, idle: 0, total: 0 };
    }
  }

  async getConsumptionMetrics(projectId?: string): Promise<any> {
    try {
      const settings = await storage.getNeonSettings();
      const id = projectId || settings?.projectId;
      
      if (!id) {
        throw new Error('Project ID not provided');
      }

      const response = await this.makeRequest(`/projects/${id}/consumption`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[NEON SERVICE] Error fetching consumption metrics:', error);
      throw error;
    }
  }

  async createBranch(projectId: string, branchName: string, sourcePointId?: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/projects/${projectId}/branches`, {
        method: 'POST',
        body: JSON.stringify({
          name: branchName,
          parent_id: sourcePointId,
        }),
      });
      
      const data = await response.json();
      return data.branch;
    } catch (error) {
      console.error('[NEON SERVICE] Error creating branch:', error);
      throw error;
    }
  }

  async deleteBranch(projectId: string, branchId: string): Promise<void> {
    try {
      await this.makeRequest(`/projects/${projectId}/branches/${branchId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('[NEON SERVICE] Error deleting branch:', error);
      throw error;
    }
  }

  async getOperations(projectId?: string): Promise<any[]> {
    try {
      const settings = await storage.getNeonSettings();
      const id = projectId || settings?.projectId;
      
      if (!id) {
        throw new Error('Project ID not provided');
      }

      const response = await this.makeRequest(`/projects/${id}/operations`);
      const data = await response.json();
      return data.operations || [];
    } catch (error) {
      console.error('[NEON SERVICE] Error fetching operations:', error);
      throw error;
    }
  }

  async syncProjectData(): Promise<{ success: boolean; message: string }> {
    try {
      const settings = await storage.getNeonSettings();
      
      if (!settings || !settings.apiKey) {
        return { success: false, message: 'Neon API key not configured' };
      }

      // Fetch project info and update settings
      const projectInfo = await this.getProjectInfo();
      
      await storage.updateNeonSettings(settings.id, {
        projectName: projectInfo.name,
        region: projectInfo.region_id,
        hostEndpoint: projectInfo.database?.host,
        lastSync: new Date(),
        syncStatus: 'synced'
      });

      return { success: true, message: 'Project data synchronized successfully' };
    } catch (error) {
      console.error('[NEON SERVICE] Error syncing project data:', error);
      
      const settings = await storage.getNeonSettings();
      if (settings) {
        await storage.updateNeonSettings(settings.id, {
          syncStatus: 'error',
          lastSync: new Date()
        });
      }
      
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Sync failed' 
      };
    }
  }
}

export const neonService = new NeonService();