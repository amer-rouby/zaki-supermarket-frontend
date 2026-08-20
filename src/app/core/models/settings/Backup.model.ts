export interface Backup {
  id: number;
  backupName: string;
  filePath: string;
  fileSize: number;
  backupType: string;
  status: string;
  description: string;
  createdAt: string;
  restoredAt?: string;
}


export interface CreateBackupRequest {
  backupName: string;
  backupType: string;
  description?: string;
}
