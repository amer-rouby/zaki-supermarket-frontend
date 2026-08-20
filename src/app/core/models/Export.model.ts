export interface ExportOptions {
  fileName: string;
  fileType: 'pdf' | 'excel';
  endpoint: string;
  params?: Record<string, any>;
  preview?: boolean;
  onSuccess?: (blob: Blob) => void;
  onError?: (error: any) => void;
}
