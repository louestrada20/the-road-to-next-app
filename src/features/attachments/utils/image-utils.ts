// Client-safe image utilities (no Sharp dependency)
export const isImageFile = (mimeType: string): boolean => {
    return mimeType.startsWith('image/');
};

export const isImageFileByName = (fileName: string): boolean => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png'].includes(extension || '');
}; 