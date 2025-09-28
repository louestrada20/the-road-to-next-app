export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  s3Key: string;          // S3 object key for original file
  thumbnailKey?: string;  // S3 object key for thumbnail
  url?: string;           // (legacy) still exposed as s3Key for compatibility
  thumbnailUrl?: string;  // (legacy)
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