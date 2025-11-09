import { del, list,put } from "@vercel/blob";
import { FileMetadata, UploadOptions } from "./types";

// Determine blob prefix based on environment (local dev vs production)
const getBlobPrefix = () => {
  const dbUrl = process.env.DATABASE_URL || '';
  const isLocalDev = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
  return isLocalDev ? 'attachments-dev/' : 'attachments/';
};

// Build blob path helpers
const buildBlobPath = (attachmentId: string, fileName: string) => {
  const prefix = getBlobPrefix();
  return `${prefix}${attachmentId}/${fileName}`;
};

// Main storage functions for Vercel Blob
export const uploadFileToBlob = async (
  file: File,
  options?: UploadOptions,
  customFileId?: string
): Promise<FileMetadata> => {
  const fileId = customFileId || generateFileId();
  const blobPath = buildBlobPath(fileId, file.name);

  try {
    // Upload to Vercel Blob with public access
    const blob = await put(blobPath, file, {
      access: 'public',
      addRandomSuffix: false, // We control the path structure
    });

    const fileMetadata: FileMetadata = {
      id: fileId,
      name: file.name,
      size: file.size,
      mimeType: file.type,
      url: blob.url, // Vercel Blob public URL
      blobUrl: blob.url,
      blobPath: blobPath, // Store path for deletion
      uploadedAt: new Date(),
    };

    return fileMetadata;
  } catch (error) {
    console.error('Vercel Blob Upload Error:', {
      error: error instanceof Error ? error.message : error,
      fileSize: file.size,
      fileName: file.name,
      blobPath,
    });
    throw new Error(`Failed to upload file to Vercel Blob: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const deleteFileFromBlob = async (fileId: string, fileName: string): Promise<void> => {
  const blobPath = buildBlobPath(fileId, fileName);
  
  try {
    await del(blobPath);
  } catch (error) {
    console.error('Vercel Blob Delete Error:', {
      error: error instanceof Error ? error.message : error,
      blobPath,
    });
    // Don't throw on delete errors - file might already be deleted
  }
};

export const deleteFileByUrl = async (blobUrl: string): Promise<void> => {
  try {
    await del(blobUrl);
  } catch (error) {
    console.error('Vercel Blob Delete Error:', {
      error: error instanceof Error ? error.message : error,
      blobUrl,
    });
    // Don't throw on delete errors - file might already be deleted
  }
};

// List blobs for cleanup operations
export const listBlobsWithPrefix = async (prefix: string) => {
  try {
    const response = await list({
      prefix,
    });
    return response.blobs;
  } catch (error) {
    console.error('Vercel Blob List Error:', {
      error: error instanceof Error ? error.message : error,
      prefix,
    });
    return [];
  }
};

// Helper function
const generateFileId = (): string => {
  return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
