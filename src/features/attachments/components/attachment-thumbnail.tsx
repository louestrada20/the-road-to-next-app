"use client";
import { Attachment } from "@prisma/client";
import Image from "next/image";
import { useState } from "react";
import { isImageFileByName } from "@/features/attachments/utils/image-utils";

type AttachmentThumbnailProps = {
    attachment: Attachment;
    className?: string;
};

const AttachmentThumbnail = ({ attachment, className = "" }: AttachmentThumbnailProps) => {
    const [imageError, setImageError] = useState(false);

    if (!isImageFileByName(attachment.name)) {
        return null;
    }

    // Use blob URL if available, otherwise fall back to old system
    const imageUrl = attachment.blobUrl || `/api/aws/s3/attachments/${attachment.id}?fileName=${encodeURIComponent(attachment.name)}`;

    if (imageError) {
        return (
            <div className={`relative overflow-hidden rounded-md ${className}`}>
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-500 text-xs">
                    <span>Image unavailable</span>
                </div>
            </div>
        );
    }

    // Extract width and height from className if provided (e.g., "w-12 h-12")
    const widthMatch = className.match(/w-(\d+)/);
    const heightMatch = className.match(/h-(\d+)/);
    const width = widthMatch ? parseInt(widthMatch[1]) * 4 : 48; // Tailwind units to pixels
    const height = heightMatch ? parseInt(heightMatch[1]) * 4 : 48;

    return (
        <div className={`relative overflow-hidden rounded-md ${className}`}>
            <Image
                src={imageUrl}
                alt={attachment.name}
                width={width}
                height={height}
                className="object-cover"
                onError={() => setImageError(true)}
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
            />
        </div>
    );
};

export { AttachmentThumbnail };