import {Attachment} from "@prisma/client";
import {LucideArrowUpRightFromSquare} from "lucide-react";
import {isImageFileByName} from "@/features/attachments/utils/image-utils";
import {attachmentDownloadPath} from "@/paths";
import {AttachmentThumbnail} from "./attachment-thumbnail";

type AttachmentItemProps = {
    attachment: Attachment;
    buttons: React.ReactNode[];
};

const AttachmentItem = ({ attachment, buttons }: AttachmentItemProps) => {
    const isImage = isImageFileByName(attachment.name);

    return (
        <div className="flex justify-between items-center gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                {isImage && (
                    <AttachmentThumbnail 
                        attachment={attachment} 
                        className="w-12 h-12 flex-shrink-0"
                    />
                )}
                <a
                    className="flex gap-x-2 items-center text-sm truncate flex-1 min-w-0"
                    href={attachmentDownloadPath(attachment.id)}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <LucideArrowUpRightFromSquare className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{attachment.name}</span>
                </a>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                {buttons}
            </div>
        </div>
    )
};

export {AttachmentItem};