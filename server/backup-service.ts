import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { ObjectStorageService } from "./objectStorage";
import type { BackupConfiguration, BackupJob, RestorePoint } from "../shared/backup-schema";

export class BackupService {
  private objectStorage: ObjectStorageService;

  constructor() {
    this.objectStorage = new ObjectStorageService();
  }

  // Database Backup usando pg_dump
  async createDatabaseBackup(config: BackupConfiguration): Promise<{
    path: string;
    size: number;
    checksum: string;
  }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `db_backup_${timestamp}.sql`;
    const backupPath = path.join('/tmp', filename);

    return new Promise((resolve, reject) => {
      const pgDumpProcess = spawn('pg_dump', [
        process.env.DATABASE_URL!,
        '--no-password',
        '--verbose',
        '--clean',
        '--if-exists',
        '--create',
        '--format=custom',
        '--file', backupPath
      ]);

      let errorOutput = '';

      pgDumpProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pgDumpProcess.on('close', async (code) => {
        if (code !== 0) {
          reject(new Error(`pg_dump failed with code ${code}: ${errorOutput}`));
          return;
        }

        try {
          const stats = await fs.stat(backupPath);
          const checksum = await this.calculateFileChecksum(backupPath);

          // Se configurato, comprimi il backup
          if (config.compression_enabled) {
            const compressedPath = await this.compressFile(backupPath);
            await fs.unlink(backupPath);
            const compressedStats = await fs.stat(compressedPath);
            const compressedChecksum = await this.calculateFileChecksum(compressedPath);
            
            resolve({
              path: compressedPath,
              size: compressedStats.size,
              checksum: compressedChecksum
            });
          } else {
            resolve({
              path: backupPath,
              size: stats.size,
              checksum: checksum
            });
          }
        } catch (error) {
          reject(error);
        }
      });

      pgDumpProcess.on('error', (error) => {
        reject(new Error(`Failed to start pg_dump: ${error.message}`));
      });
    });
  }

  // Files Backup (uploads, attachments, etc.)
  async createFilesBackup(config: BackupConfiguration): Promise<{
    path: string;
    size: number;
    checksum: string;
    fileCount: number;
  }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `files_backup_${timestamp}.tar.gz`;
    const backupPath = path.join('/tmp', filename);

    const dirsToBackup = [
      './uploads',
      './attached_assets',
      './server/logs'
    ];

    return new Promise((resolve, reject) => {
      const tarProcess = spawn('tar', [
        '-czf',
        backupPath,
        '--exclude=*.log',
        '--exclude=node_modules',
        ...dirsToBackup.filter(dir => this.directoryExists(dir))
      ]);

      let errorOutput = '';

      tarProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      tarProcess.on('close', async (code) => {
        if (code !== 0) {
          reject(new Error(`tar failed with code ${code}: ${errorOutput}`));
          return;
        }

        try {
          const stats = await fs.stat(backupPath);
          const checksum = await this.calculateFileChecksum(backupPath);
          const fileCount = await this.countFilesInDirectories(dirsToBackup);

          resolve({
            path: backupPath,
            size: stats.size,
            checksum: checksum,
            fileCount: fileCount
          });
        } catch (error) {
          reject(error);
        }
      });

      tarProcess.on('error', (error) => {
        reject(new Error(`Failed to start tar: ${error.message}`));
      });
    });
  }

  // Full System Backup (database + files)
  async createFullBackup(config: BackupConfiguration): Promise<{
    databaseBackup: any;
    filesBackup: any;
    totalSize: number;
  }> {
    const [databaseBackup, filesBackup] = await Promise.all([
      this.createDatabaseBackup(config),
      this.createFilesBackup(config)
    ]);

    return {
      databaseBackup,
      filesBackup,
      totalSize: databaseBackup.size + filesBackup.size
    };
  }

  // Upload backup to cloud storage
  async uploadToCloudStorage(
    localPath: string,
    config: BackupConfiguration,
    type: 'database' | 'files'
  ): Promise<string> {
    const filename = path.basename(localPath);
    const cloudPath = `backups/${type}/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${filename}`;

    switch (config.storage_provider) {
      case 'gcs':
        return await this.uploadToGCS(localPath, cloudPath);
      case 's3':
        return await this.uploadToS3(localPath, cloudPath, config.storage_config);
      case 'azure':
        return await this.uploadToAzure(localPath, cloudPath, config.storage_config);
      default:
        // Local storage - move to backup directory
        const localBackupDir = './backups';
        await fs.mkdir(localBackupDir, { recursive: true });
        const finalPath = path.join(localBackupDir, filename);
        await fs.rename(localPath, finalPath);
        return finalPath;
    }
  }

  // Restore database from backup
  async restoreDatabase(backupPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Prima decomprimi se necessario
      const actualPath = backupPath.endsWith('.gz') ? 
        this.decompressFile(backupPath) : Promise.resolve(backupPath);

      actualPath.then(path => {
        const pgRestoreProcess = spawn('pg_restore', [
          '--dbname', process.env.DATABASE_URL!,
          '--clean',
          '--if-exists',
          '--no-owner',
          '--no-privileges',
          '--verbose',
          path
        ]);

        let errorOutput = '';

        pgRestoreProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        pgRestoreProcess.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`pg_restore failed with code ${code}: ${errorOutput}`));
            return;
          }
          resolve();
        });

        pgRestoreProcess.on('error', (error) => {
          reject(new Error(`Failed to start pg_restore: ${error.message}`));
        });
      }).catch(reject);
    });
  }

  // Restore files from backup
  async restoreFiles(backupPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const tarProcess = spawn('tar', [
        '-xzf',
        backupPath,
        '--overwrite'
      ]);

      let errorOutput = '';

      tarProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      tarProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`tar restore failed with code ${code}: ${errorOutput}`));
          return;
        }
        resolve();
      });

      tarProcess.on('error', (error) => {
        reject(new Error(`Failed to start tar restore: ${error.message}`));
      });
    });
  }

  // Verify backup integrity
  async verifyBackup(backupPath: string, expectedChecksum: string): Promise<boolean> {
    try {
      const actualChecksum = await this.calculateFileChecksum(backupPath);
      return actualChecksum === expectedChecksum;
    } catch (error) {
      console.error('Backup verification failed:', error);
      return false;
    }
  }

  // Clean old backups based on retention policy
  async cleanOldBackups(config: BackupConfiguration): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.retention_days);

    const backupDir = config.storage_provider === 'local' ? './backups' : null;
    let deletedCount = 0;

    if (backupDir) {
      try {
        const files = await fs.readdir(backupDir, { withFileTypes: true });
        
        for (const file of files) {
          if (file.isFile()) {
            const filePath = path.join(backupDir, file.name);
            const stats = await fs.stat(filePath);
            
            if (stats.mtime < cutoffDate) {
              await fs.unlink(filePath);
              deletedCount++;
            }
          }
        }
      } catch (error) {
        console.error('Error cleaning old backups:', error);
      }
    }

    return deletedCount;
  }

  // Helper methods
  private async calculateFileChecksum(filePath: string): Promise<string> {
    const hash = crypto.createHash('sha256');
    const stream = await fs.readFile(filePath);
    hash.update(stream);
    return hash.digest('hex');
  }

  private async compressFile(filePath: string): Promise<string> {
    const compressedPath = `${filePath}.gz`;
    
    return new Promise((resolve, reject) => {
      const gzipProcess = spawn('gzip', ['-9', filePath]);
      
      gzipProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`gzip failed with code ${code}`));
          return;
        }
        resolve(compressedPath);
      });

      gzipProcess.on('error', reject);
    });
  }

  private async decompressFile(filePath: string): Promise<string> {
    const decompressedPath = filePath.replace('.gz', '');
    
    return new Promise((resolve, reject) => {
      const gunzipProcess = spawn('gunzip', ['-k', filePath]);
      
      gunzipProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`gunzip failed with code ${code}`));
          return;
        }
        resolve(decompressedPath);
      });

      gunzipProcess.on('error', reject);
    });
  }

  private directoryExists(dirPath: string): boolean {
    try {
      return require('fs').statSync(dirPath).isDirectory();
    } catch {
      return false;
    }
  }

  private async countFilesInDirectories(directories: string[]): Promise<number> {
    let count = 0;
    
    for (const dir of directories) {
      if (this.directoryExists(dir)) {
        count += await this.countFilesRecursive(dir);
      }
    }
    
    return count;
  }

  private async countFilesRecursive(directory: string): Promise<number> {
    let count = 0;
    
    try {
      const items = await fs.readdir(directory, { withFileTypes: true });
      
      for (const item of items) {
        if (item.isFile()) {
          count++;
        } else if (item.isDirectory()) {
          count += await this.countFilesRecursive(path.join(directory, item.name));
        }
      }
    } catch (error) {
      // Directory not accessible, skip
    }
    
    return count;
  }

  // Cloud storage implementations
  private async uploadToGCS(localPath: string, cloudPath: string): Promise<string> {
    // Using the existing ObjectStorageService for GCS
    const privateDir = this.objectStorage.getPrivateObjectDir();
    const fullCloudPath = `${privateDir}/backups/${cloudPath}`;
    
    // Implementation would use GCS SDK to upload the file
    // For now, return the expected path
    return fullCloudPath;
  }

  private async uploadToS3(localPath: string, cloudPath: string, config: any): Promise<string> {
    // Implementation would use AWS SDK
    throw new Error('S3 backup not implemented yet');
  }

  private async uploadToAzure(localPath: string, cloudPath: string, config: any): Promise<string> {
    // Implementation would use Azure SDK
    throw new Error('Azure backup not implemented yet');
  }
}

// Backup Scheduler Service
export class BackupScheduler {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  scheduleBackup(config: BackupConfiguration, callback: () => Promise<void>) {
    // Remove existing schedule if any
    this.unscheduleBackup(config.id);

    if (!config.enabled) return;

    // Parse cron schedule and create interval
    const interval = this.parseCronToInterval(config.schedule);
    
    if (interval) {
      const timeoutId = setInterval(async () => {
        try {
          await callback();
        } catch (error) {
          console.error(`Scheduled backup failed for config ${config.id}:`, error);
        }
      }, interval);

      this.intervals.set(config.id, timeoutId);
    }
  }

  unscheduleBackup(configId: string) {
    const timeoutId = this.intervals.get(configId);
    if (timeoutId) {
      clearInterval(timeoutId);
      this.intervals.delete(configId);
    }
  }

  private parseCronToInterval(cronExpression: string): number | null {
    // Simplified cron parser - in production use a proper cron library
    const parts = cronExpression.split(' ');
    if (parts.length !== 5) return null;

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    // Daily backup
    if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      return 24 * 60 * 60 * 1000; // 24 hours
    }

    // Weekly backup
    if (dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') {
      return 7 * 24 * 60 * 60 * 1000; // 7 days
    }

    // Monthly backup
    if (dayOfMonth !== '*' && month === '*') {
      return 30 * 24 * 60 * 60 * 1000; // 30 days
    }

    return null;
  }
}