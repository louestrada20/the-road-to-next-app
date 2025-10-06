import { vi } from 'vitest';

export const mockPut = vi.fn().mockImplementation(async (pathname: string, body: any, options?: any) => {
  // Return a mock blob response
  return {
    url: `https://test.public.blob.vercel-storage.com/${pathname}`,
    pathname,
    contentType: options?.contentType || 'application/octet-stream',
    size: body.size || 1000,
  };
});

export const mockDel = vi.fn().mockImplementation(async (_url: string) => {
  // Mock successful deletion
  return;
});

export const mockList = vi.fn().mockImplementation(async (_options?: { prefix?: string }) => {
  // Return mock blob list
  return {
    blobs: [
      {
        url: `https://test.public.blob.vercel-storage.com/attachments/test-id/test-file.jpg`,
        pathname: 'attachments/test-id/test-file.jpg',
        size: 1000,
        uploadedAt: new Date(),
      }
    ],
    cursor: null,
    hasMore: false,
  };
});

// Mock the @vercel/blob module
vi.mock('@vercel/blob', () => ({
  put: mockPut,
  del: mockDel,
  list: mockList,
}));
