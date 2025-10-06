export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  s3Key?: string;         // S3 object key for original file (keep for migration)
  thumbnailKey?: string;  // S3 object key for thumbnail (keep for migration)
  url: string;            // Public URL for the file
  thumbnailUrl?: string;  // (legacy)
  blobUrl?: string;       // Vercel Blob URL
  blobPath?: string;      // Vercel Blob path for deletion
  uploadedAt: Date;
}

export interface UploadOptions {
  generateThumbnail?: boolean;
  thumbnailOptions?: {
    width?: number;
    height?: number;
    quality?: number;
  };
  access?: 'public' | 'private';
  metadata?: Record<string, string>;
}

export interface StorageConfig {
  provider: 's3' | 'vercel-blob' | 'cloudinary';
  bucket?: string;
  region?: string;
  baseUrl?: string;
  thumbnailConfig?: {
    enabled: boolean;
    defaultWidth: number;
    defaultHeight: number;
    defaultQuality: number;
  };
} 