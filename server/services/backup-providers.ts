// Multi-cloud backup providers: Amazon S3, Azure Blob Storage, Google Cloud Storage
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";
import { Storage as GoogleStorage } from '@google-cloud/storage';
// Multi-cloud backup system for EasyCashFlows

// Backup Provider Interface
export interface BackupProvider {
  name: string;
  upload(fileName: string, data: Buffer, metadata?: Record<string, string>): Promise<string>;
  download(fileName: string): Promise<Buffer>;
  list(prefix?: string): Promise<string[]>;
  delete(fileName: string): Promise<void>;
  getStats(): Promise<{ totalFiles: number; totalSize: number; lastBackup?: Date }>;
}

// Amazon S3 Provider
export class S3BackupProvider implements BackupProvider {
  name = 'Amazon S3';
  private client: S3Client;
  private bucketName: string;

  constructor() {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION || 'eu-west-1';
    this.bucketName = process.env.AWS_S3_BUCKET_NAME || 'easycashflows-backup';

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
    }

    this.client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async upload(fileName: string, data: Buffer, metadata?: Record<string, string>): Promise<string> {
    const key = `easycashflows-backups/${fileName}`;
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: data,
      Metadata: {
        'backup-timestamp': new Date().toISOString(),
        'backup-type': 'automated',
        ...metadata,
      },
      ServerSideEncryption: 'AES256',
    });

    await this.client.send(command);
    return `s3://${this.bucketName}/${key}`;
  }

  async download(fileName: string): Promise<Buffer> {
    const key = `easycashflows-backups/${fileName}`;
    
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.client.send(command);
    const stream = response.Body as any;
    
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  async list(prefix: string = 'easycashflows-backups/'): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: prefix,
    });

    const response = await this.client.send(command);
    return response.Contents?.map(obj => obj.Key || '') || [];
  }

  async delete(fileName: string): Promise<void> {
    const key = `easycashflows-backups/${fileName}`;
    
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.client.send(command);
  }

  async getStats(): Promise<{ totalFiles: number; totalSize: number; lastBackup?: Date }> {
    const files = await this.list();
    let totalSize = 0;
    let lastBackup: Date | undefined;

    // Get detailed info for each file (simplified for demo)
    const stats = {
      totalFiles: files.length,
      totalSize: totalSize,
      lastBackup: lastBackup,
    };

    return stats;
  }
}

// Azure Blob Storage Provider
export class AzureBackupProvider implements BackupProvider {
  name = 'Azure Blob Storage';
  private blobServiceClient: BlobServiceClient;
  private containerName: string;

  constructor() {
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    this.containerName = process.env.AZURE_CONTAINER_NAME || 'easycashflows-backup';

    if (!accountName || !accountKey) {
      throw new Error('Azure credentials not configured. Set AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY');
    }

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    this.blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      sharedKeyCredential
    );
  }

  async upload(fileName: string, data: Buffer, metadata?: Record<string, string>): Promise<string> {
    const blobName = `easycashflows-backups/${fileName}`;
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.upload(data, data.length, {
      metadata: {
        'backup-timestamp': new Date().toISOString(),
        'backup-type': 'automated',
        ...metadata,
      },
    });

    return `azure://${this.containerName}/${blobName}`;
  }

  async download(fileName: string): Promise<Buffer> {
    const blobName = `easycashflows-backups/${fileName}`;
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const downloadResponse = await blockBlobClient.download(0);
    const stream = downloadResponse.readableStreamBody;

    if (!stream) {
      throw new Error('No data stream available');
    }

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  async list(prefix: string = 'easycashflows-backups/'): Promise<string[]> {
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blobs = [];

    for await (const blob of containerClient.listBlobsFlat({ prefix })) {
      blobs.push(blob.name);
    }

    return blobs;
  }

  async delete(fileName: string): Promise<void> {
    const blobName = `easycashflows-backups/${fileName}`;
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    await containerClient.deleteBlob(blobName);
  }

  async getStats(): Promise<{ totalFiles: number; totalSize: number; lastBackup?: Date }> {
    const files = await this.list();
    let totalSize = 0;
    let lastBackup: Date | undefined;

    // Simplified stats calculation
    const stats = {
      totalFiles: files.length,
      totalSize: totalSize,
      lastBackup: lastBackup,
    };

    return stats;
  }
}

// Google Cloud Storage Provider (Enhanced)
export class GCSBackupProvider implements BackupProvider {
  name = 'Google Cloud Storage';
  private storage: GoogleStorage;
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.GCS_BUCKET_NAME || 'easycashflows-backup';
    
    // Use Replit's built-in GCS authentication or explicit credentials
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      this.storage = new GoogleStorage({
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      });
    } else {
      // Fallback to Replit's object storage client configuration
      this.storage = new GoogleStorage({
        credentials: {
          audience: "replit",
          subject_token_type: "access_token",
          token_url: `http://127.0.0.1:1106/token`,
          type: "external_account",
          credential_source: {
            url: `http://127.0.0.1:1106/credential`,
            format: {
              type: "json",
              subject_token_field_name: "access_token",
            },
          },
          universe_domain: "googleapis.com",
        },
        projectId: "",
      });
    }
  }

  async upload(fileName: string, data: Buffer, metadata?: Record<string, string>): Promise<string> {
    const filePath = `easycashflows-backups/${fileName}`;
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(filePath);

    await file.save(data, {
      metadata: {
        metadata: {
          'backup-timestamp': new Date().toISOString(),
          'backup-type': 'automated',
          ...metadata,
        },
      },
    });

    return `gs://${this.bucketName}/${filePath}`;
  }

  async download(fileName: string): Promise<Buffer> {
    const filePath = `easycashflows-backups/${fileName}`;
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(filePath);

    const [data] = await file.download();
    return data;
  }

  async list(prefix: string = 'easycashflows-backups/'): Promise<string[]> {
    const bucket = this.storage.bucket(this.bucketName);
    const [files] = await bucket.getFiles({ prefix });
    
    return files.map(file => file.name);
  }

  async delete(fileName: string): Promise<void> {
    const filePath = `easycashflows-backups/${fileName}`;
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(filePath);

    await file.delete();
  }

  async getStats(): Promise<{ totalFiles: number; totalSize: number; lastBackup?: Date }> {
    const files = await this.list();
    let totalSize = 0;
    let lastBackup: Date | undefined;

    // Get stats from bucket metadata
    const bucket = this.storage.bucket(this.bucketName);
    try {
      const [metadata] = await bucket.getMetadata();
      // Process metadata if available
    } catch (error) {
      console.log('Could not fetch bucket metadata:', error);
    }

    const stats = {
      totalFiles: files.length,
      totalSize: totalSize,
      lastBackup: lastBackup,
    };

    return stats;
  }
}

// Provider Factory
export class BackupProviderFactory {
  static createProvider(providerType: 'gcs' | 's3' | 'azure'): BackupProvider {
    switch (providerType) {
      case 's3':
        return new S3BackupProvider();
      case 'azure':
        return new AzureBackupProvider();
      case 'gcs':
      default:
        return new GCSBackupProvider();
    }
  }

  static async getAvailableProviders(): Promise<{ provider: string; available: boolean; error?: string }[]> {
    const providers = [
      { type: 'gcs' as const, name: 'Google Cloud Storage' },
      { type: 's3' as const, name: 'Amazon S3' },
      { type: 'azure' as const, name: 'Azure Blob Storage' },
    ];

    const results = [];

    for (const providerInfo of providers) {
      try {
        const provider = this.createProvider(providerInfo.type);
        // Test connection with a simple operation
        await provider.getStats();
        results.push({ provider: providerInfo.name, available: true });
      } catch (error: any) {
        results.push({
          provider: providerInfo.name,
          available: false,
          error: error.message || 'Configuration error',
        });
      }
    }

    return results;
  }
}