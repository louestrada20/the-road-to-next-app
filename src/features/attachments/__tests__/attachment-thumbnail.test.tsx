import { Attachment } from '@prisma/client';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AttachmentThumbnail } from '../components/attachment-thumbnail';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, onError, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} onError={onError} {...props} />;
  },
}));

describe('AttachmentThumbnail', () => {
  const mockAttachment: Attachment = {
    id: 'attachment123',
    name: 'test-image.jpg',
    entity: 'TICKET',
    ticketId: 'ticket123',
    commentId: null,
    s3Key: '',
    thumbnailKey: null,
    thumbnailUrl: null,
    blobUrl: 'https://test.public.blob.vercel-storage.com/attachments/attachment123/test-image.jpg',
    blobPath: 'attachments/attachment123/test-image.jpg',
  };

  it('should render image thumbnail with blob URL', () => {
    render(<AttachmentThumbnail attachment={mockAttachment} />);
    
    const img = screen.getByRole('img', { name: 'test-image.jpg' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', mockAttachment.blobUrl);
  });

  it('should not render for non-image files', () => {
    const pdfAttachment = {
      ...mockAttachment,
      name: 'document.pdf',
    };
    
    const { container } = render(<AttachmentThumbnail attachment={pdfAttachment} />);
    expect(container.firstChild).toBeNull();
  });

  it('should fall back to API URL for legacy attachments', () => {
    const legacyAttachment = {
      ...mockAttachment,
      blobUrl: null,
    };
    
    render(<AttachmentThumbnail attachment={legacyAttachment} />);
    
    const img = screen.getByRole('img', { name: 'test-image.jpg' });
    expect(img.getAttribute('src')).toContain('/api/aws/s3/attachments/');
  });

  it('should show error state on image load failure', () => {
    render(<AttachmentThumbnail attachment={mockAttachment} />);
    
    const img = screen.getByRole('img', { name: 'test-image.jpg' });
    
    // Simulate image load error
    img.dispatchEvent(new Event('error'));
    
    expect(screen.getByText('Image unavailable')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<AttachmentThumbnail attachment={mockAttachment} className="w-20 h-20" />);
    
    const container = screen.getByRole('img').parentElement;
    expect(container).toHaveClass('w-20 h-20');
  });
});
