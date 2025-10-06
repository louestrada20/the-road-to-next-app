import { beforeEach,describe, expect, it, vi } from 'vitest';
import { inngest } from '@/lib/inngest';
import { prisma } from '@/lib/prisma';
import { mockDel } from '@/test/mocks/vercel-blob';
import { asMockObject } from '@/test/types/mocks';
import { deleteAttachment } from '../actions/delete-attachment';

// Mock the auth function
vi.mock('@/features/auth/queries/get-auth-or-redirect', () => ({
  getAuthOrRedirect: vi.fn(() => Promise.resolve({
    user: { id: 'user123', email: 'test@example.com' },
    activeOrganization: { id: 'org123' }
  }))
}));

// Mock isOwner
vi.mock('@/features/auth/utils/is-owner', () => ({
  isOwner: vi.fn(() => true)
}));

// Mock attachment subject DTO
vi.mock('../dto/attachment-subject-dto', () => ({
  fromAttachment: vi.fn(() => ({
    id: 'ticket123',
    userId: 'user123',
    organizationId: 'org123',
    entityId: 'ticket123',
  }))
}));

describe('deleteAttachment', () => {
  const mockAttachment = {
    id: 'attachment123',
    name: 'test.jpg',
    entity: 'TICKET' as const,
    ticketId: 'ticket123',
    commentId: null,
    s3Key: '',
    thumbnailKey: null,
    thumbnailUrl: null,
    blobUrl: 'https://test.public.blob.vercel-storage.com/attachments/attachment123/test.jpg',
    blobPath: 'attachments/attachment123/test.jpg',
    ticket: {
      id: 'ticket123',
      organizationId: 'org123'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup attachment mocks
    asMockObject(prisma.attachment).findUniqueOrThrow.mockResolvedValue(mockAttachment);
    asMockObject(prisma.attachment).delete.mockResolvedValue(mockAttachment);
    asMockObject(inngest).send.mockResolvedValue({ ids: ['test-id'] });
  });

  it('should delete attachment with blob URL', async () => {
    const result = await deleteAttachment('attachment123');

    // Check that blob was deleted
    expect(mockDel).toHaveBeenCalledWith(
      'https://test.public.blob.vercel-storage.com/attachments/attachment123/test.jpg'
    );

    // Check that database record was deleted
    expect(prisma.attachment.delete).toHaveBeenCalledWith({
      where: { id: 'attachment123' }
    });

    // Check that event was sent
    expect(inngest.send).toHaveBeenCalledWith({
      name: 'app/attachment.deleted',
      data: expect.objectContaining({
        attachmentId: 'attachment123',
        blobUrl: mockAttachment.blobUrl,
        fileName: 'test.jpg'
      })
    });

    expect(result.status).toBe('SUCCESS');
    expect(result.message).toBe('Attachment deleted');
  });

  it('should handle attachments without blob URL (legacy)', async () => {
    const legacyAttachment = {
      ...mockAttachment,
      blobUrl: null,
      s3Key: 'uploads/attachment123/test.jpg'
    };
    
    asMockObject(prisma.attachment).findUniqueOrThrow.mockResolvedValue(legacyAttachment);

    const result = await deleteAttachment('attachment123');

    // Should not call blob delete
    expect(mockDel).not.toHaveBeenCalled();

    expect(result.status).toBe('SUCCESS');
  });

  it('should handle authorization errors', async () => {
    // Mock isOwner to return false
    const { isOwner } = await import('@/features/auth/utils/is-owner');
    vi.mocked(isOwner).mockReturnValueOnce(false);

    const result = await deleteAttachment('attachment123');

    expect(result.status).toBe('ERROR');
    expect(result.message).toBe('Not authorized');
    expect(mockDel).not.toHaveBeenCalled();
    expect(prisma.attachment.delete).not.toHaveBeenCalled();
  });
});
