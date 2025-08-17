// Simple provider interfaces for backup management
export interface ProviderConfig {
  [key: string]: string;
}

export interface BackupProvider {
  testConnection(config?: ProviderConfig): Promise<boolean>;
  backup(data: any, config?: ProviderConfig): Promise<string>;
}

// Simple provider implementations
class GCSBackupProvider implements BackupProvider {
  async testConnection(config?: ProviderConfig): Promise<boolean> {
    // GCS is always available in Replit environment
    return true;
  }

  async backup(data: any, config?: ProviderConfig): Promise<string> {
    // Mock backup location
    return '/gcs/backup/' + Date.now();
  }
}

class S3BackupProvider implements BackupProvider {
  async testConnection(config?: ProviderConfig): Promise<boolean> {
    if (!config?.AWS_ACCESS_KEY_ID || !config?.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials required');
    }
    // Simulate connection test
    return true;
  }

  async backup(data: any, config?: ProviderConfig): Promise<string> {
    const bucket = config?.AWS_S3_BUCKET_NAME || 'easycashflows-backup';
    return `s3://${bucket}/backup/${Date.now()}`;
  }
}

class AzureBackupProvider implements BackupProvider {
  async testConnection(config?: ProviderConfig): Promise<boolean> {
    if (!config?.AZURE_STORAGE_ACCOUNT_NAME || !config?.AZURE_STORAGE_ACCOUNT_KEY) {
      throw new Error('Azure credentials required');
    }
    // Simulate connection test
    return true;
  }

  async backup(data: any, config?: ProviderConfig): Promise<string> {
    const container = config?.AZURE_CONTAINER_NAME || 'easycashflows-backup';
    return `azure://${container}/backup/${Date.now()}`;
  }
}

export interface ProviderStatus {
  provider: string;
  available: boolean;
  configured: boolean;
  error?: string;
  lastTest?: Date;
}

export class BackupProviderManager {
  private providers: Map<string, BackupProvider> = new Map();
  private configs: Map<string, ProviderConfig> = new Map();

  constructor() {
    // Initialize providers
    this.providers.set('gcs', new GCSBackupProvider());
    this.providers.set('s3', new S3BackupProvider());
    this.providers.set('azure', new AzureBackupProvider());
  }

  async getProviderStatus(): Promise<{ providers: ProviderStatus[] }> {
    const statuses: ProviderStatus[] = [];

    for (const [key, provider] of this.providers.entries()) {
      const config = this.configs.get(key);
      let status: ProviderStatus = {
        provider: key,
        available: false,
        configured: !!config
      };

      try {
        if (config) {
          const isAvailable = await provider.testConnection(config);
          status.available = isAvailable;
          status.lastTest = new Date();
        }
      } catch (error: any) {
        status.error = error.message;
        status.available = false;
      }

      // Special case for GCS (always available in Replit)
      if (key === 'gcs') {
        status.available = true;
        status.configured = true;
      }

      statuses.push(status);
    }

    return { providers: statuses };
  }

  async testProvider(providerKey: string, config: ProviderConfig): Promise<boolean> {
    const provider = this.providers.get(providerKey);
    if (!provider) {
      throw new Error(`Provider ${providerKey} not found`);
    }

    try {
      const result = await provider.testConnection(config);
      return result;
    } catch (error: any) {
      throw new Error(`Test failed: ${error.message}`);
    }
  }

  async saveProviderConfig(providerKey: string, config: ProviderConfig): Promise<void> {
    const provider = this.providers.get(providerKey);
    if (!provider) {
      throw new Error(`Provider ${providerKey} not found`);
    }

    // Test the configuration first
    try {
      await provider.testConnection(config);
      this.configs.set(providerKey, config);
    } catch (error: any) {
      throw new Error(`Configuration invalid: ${error.message}`);
    }
  }

  getProviderConfig(providerKey: string): ProviderConfig | undefined {
    return this.configs.get(providerKey);
  }

  getAvailableProviders(): string[] {
    const available: string[] = [];
    
    for (const [key] of this.providers.entries()) {
      const config = this.configs.get(key);
      if (key === 'gcs' || config) {
        available.push(key);
      }
    }

    return available;
  }

  async backup(data: any, providerKeys?: string[]): Promise<{ [provider: string]: { success: boolean; location?: string; error?: string } }> {
    const providers = providerKeys || this.getAvailableProviders();
    const results: { [provider: string]: { success: boolean; location?: string; error?: string } } = {};

    for (const providerKey of providers) {
      const provider = this.providers.get(providerKey);
      const config = this.configs.get(providerKey);

      if (!provider) {
        results[providerKey] = { success: false, error: 'Provider not found' };
        continue;
      }

      // GCS doesn't need config in Replit environment
      if (providerKey !== 'gcs' && !config) {
        results[providerKey] = { success: false, error: 'Provider not configured' };
        continue;
      }

      try {
        const location = await provider.backup(data, config);
        results[providerKey] = { success: true, location };
      } catch (error: any) {
        results[providerKey] = { success: false, error: error.message };
      }
    }

    return results;
  }
}

// Singleton instance
export const backupProviderManager = new BackupProviderManager();