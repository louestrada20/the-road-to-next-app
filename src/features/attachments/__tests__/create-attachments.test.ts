import { beforeEach,describe, expect, it, vi } from 'vitest';
import { EMPTY_ACTION_STATE } from '@/components/form/utils/to-action-state';
import { prisma } from '@/lib/prisma';
import { mockPut } from '@/test/mocks/vercel-blob';
import { asMockObject } from '@/test/types/mocks';
import { createAttachments } from '../actions/create-attachments';

// Mock the auth function
vi.mock('@/features/auth/queries/get-auth-or-redirect', () => ({
  getAuthOrRedirect: vi.fn(() => Promise.resolve({
    user: { id: 'user123', email: 'test@example.com' },
    activeOrganization: { id: 'org123' }
  }))
}));

// Mock the attachment service
vi.mock('../service/get-attachment-subject', () => ({
  getAttachmentSubject: vi.fn(() => Promise.resolve({
    id: 'ticket123',
    userId: 'user123',
    organizationId: 'org123'
  }))
}));

// Mock isOwner
vi.mock('@/features/auth/utils/is-owner', () => ({
  isOwner: vi.fn(() => true)
}));

describe('createAttachments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup attachment mocks
    asMockObject(prisma.attachment).create.mockResolvedValue({
      id: 'attachment123',
      name: 'test.jpg',
      entity: 'TICKET',
      ticketId: 'ticket123',
      commentId: null,
      s3Key: '',
      thumbnailKey: null,
      thumbnailUrl: null,
      blobUrl: '',
      blobPath: ''
    });
    
    asMockObject(prisma.attachment).update.mockResolvedValue({
      id: 'attachment123',
      name: 'test.jpg',
      entity: 'TICKET',
      ticketId: 'ticket123',
      commentId: null,
      s3Key: '',
      thumbnailKey: null,
      thumbnailUrl: null,
      blobUrl: 'https://test.public.blob.vercel-storage.com/attachments/attachment123/test.jpg',
      blobPath: 'attachments/attachment123/test.jpg'
    });
  });

  it('should create attachment with Vercel Blob', async () => {
    // Create a mock file
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('files', file);

    const result = await createAttachments(
      { entityId: 'ticket123', entity: 'TICKET' },
      EMPTY_ACTION_STATE,
      formData
    );

    // Check that attachment was created (ticketId is used for TICKET entity)
    expect(prisma.attachment.create).toHaveBeenCalledWith({
      data: {
        name: 'test.jpg',
        entity: 'TICKET',
        ticketId: 'ticket123'
      }
    });

    // Check that blob was uploaded
    expect(mockPut).toHaveBeenCalledWith(
      'attachments/attachment123/test.jpg',
      expect.any(File),
      expect.objectContaining({
        access: 'public',
        addRandomSuffix: false
      })
    );

    // Check that attachment was updated with blob URL
    expect(prisma.attachment.update).toHaveBeenCalledWith({
      where: { id: 'attachment123' },
      data: {
        blobUrl: 'https://test.public.blob.vercel-storage.com/attachments/attachment123/test.jpg',
        blobPath: 'attachments/attachment123/test.jpg'
      }
    });

    expect(result.status).toBe('SUCCESS');
    expect(result.message).toBe('Attachment(s) created');
  });

  it('should handle validation errors', async () => {
    const formData = new FormData();
    // No files attached

    const result = await createAttachments(
      { entityId: 'ticket123', entity: 'TICKET' },
      EMPTY_ACTION_STATE,
      formData
    );

    expect(result.status).toBe('ERROR');
    expect(result.fieldErrors?.files).toBeDefined();
  });

  it('should handle upload errors', async () => {
    // Mock upload failure
    mockPut.mockRejectedValueOnce(new Error('Upload failed'));

    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('files', file);

    const result = await createAttachments(
      { entityId: 'ticket123', entity: 'TICKET' },
      EMPTY_ACTION_STATE,
      formData
    );

    expect(result.status).toBe('ERROR');
    expect(result.message).toContain('Upload failed');
  });
});
