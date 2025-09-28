"use client";
import { Attachment } from "@prisma/client";
import { useEffect,useState } from "react";
import { isImageFileByName } from "@/features/attachments/utils/image-utils";

type AttachmentThumbnailProps = {
    attachment: Attachment;
    className?: string;
};

const AttachmentThumbnail = ({ attachment, className = "" }: AttachmentThumbnailProps) => {
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

    useEffect(() => {
        const loadThumbnailUrl = async () => {
            if (!isImageFileByName(attachment.name)) {
                setIsLoading(false);
                return;
            }

            try {
                console.log('Loading thumbnail for:', attachment.name);
                // Call API endpoint instead of importing storage module
                const response = await fetch(
                    `/api/aws/s3/attachments/${attachment.id}?fileName=${encodeURIComponent(attachment.name)}&thumbnail=true`
                );
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('API response not ok:', response.status, errorText);
                    throw new Error(`Failed to get thumbnail URL: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Thumbnail URL received:', data.url);
                setThumbnailUrl(data.url);
                setIsLoading(false); // Add this line to stop loading
            } catch (error) {
                console.error('Failed to get thumbnail URL:', error);
                setImageError(true);
                setIsLoading(false);
            }
        };

        loadThumbnailUrl();
    }, [attachment.id, attachment.name]);

    if (!isImageFileByName(attachment.name)) {
        return null;
    }

    if (isLoading) {
        return (
            <div className={`relative overflow-hidden rounded-md ${className}`}>
                <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    if (imageError || !thumbnailUrl) {
        return (
            <div className={`relative overflow-hidden rounded-md ${className}`}>
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-500 text-xs">
                    <span>Image unavailable</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative overflow-hidden rounded-md ${className}`}>
            <img
                src={thumbnailUrl}
                alt={attachment.name}
                className="w-full h-full object-cover"
                onLoad={() => {
                    console.log('Thumbnail image loaded successfully');
                }}
                onError={() => {
                    console.error('Thumbnail image failed to load');
                    setImageError(true);
                    setIsLoading(false);
                }}
            />
        </div>
    );
};

export { AttachmentThumbnail }; 