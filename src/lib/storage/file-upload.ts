import { deleteFileFromS3, getS3FileUrl,uploadFileToS3 } from "./s3-storage";
import { FileMetadata, UploadOptions } from "./types";

// Default configuration
const DEFAULT_CONFIG = {
  maxSize: 4 * 1024 * 1024, // 4MB
  allowedTypes: [
    "image/png",
    "image/jpeg", 
    "image/jpg",
    "application/pdf",
  ],
  thumbnailConfig: {
    enabled: true,
    defaultWidth: 200,
    defaultHeight: 200,
    defaultQuality: 80,
  }
};

// Validation functions
const validateFile = (file: File): void => {
  if (file.size > DEFAULT_CONFIG.maxSize) {
    throw new Error(`File size exceeds maximum allowed size of ${DEFAULT_CONFIG.maxSize / 1024 / 1024}MB`);
  }

  if (!DEFAULT_CONFIG.allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed`);
  }
};

const mergeUploadOptions = (options?: UploadOptions): UploadOptions => {
  return {
    generateThumbnail: DEFAULT_CONFIG.thumbnailConfig.enabled,
    thumbnailOptions: {
      width: DEFAULT_CONFIG.thumbnailConfig.defaultWidth,
      height: DEFAULT_CONFIG.thumbnailConfig.defaultHeight,
      quality: DEFAULT_CONFIG.thumbnailConfig.defaultQuality,
      ...options?.thumbnailOptions,
    },
    ...options,
  };
};

// Main file upload functions
export const uploadFile = async (
   file: File,
   options: UploadOptions & { fileId: string }
 ): Promise<FileMetadata> => {
   // Validate file
   validateFile(file);
 
   // Merge with default options
   const uploadOptions = mergeUploadOptions(options);
 
   // Upload file using provided attachment id as fileId
   return uploadFileToS3(file, uploadOptions, options.fileId);
 }

export const uploadFiles = async (
   files: File[],
   options: UploadOptions & { fileIds: string[] }
 ): Promise<FileMetadata[]> => {
   const uploadPromises = files.map((file, index) =>
     uploadFile(file, {
       ...options,
       fileId: options.fileIds[index],
     })
   );
   return Promise.all(uploadPromises);
 }

export const deleteFile = async (fileId: string, fileName: string): Promise<void> => {
  return deleteFileFromS3(fileId, fileName);
};

export const getFileUrl = async (
  fileId: string, 
  fileName: string, 
  options?: { thumbnail?: boolean }
): Promise<string> => {
  return getS3FileUrl(fileId, fileName, options);
};

// (generateThumbnail removed – Lambda handles thumbnails)

// Utility functions
export const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop()?.toLowerCase() || '';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}; 