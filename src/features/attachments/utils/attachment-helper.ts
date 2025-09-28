import {AttachmentEntity} from "@prisma/client";
import {ticketPath} from "@/paths";
import * as attachmentSubjectDto from "../dto/attachment-subject-dto";

export const getOrganizationIdByAttachment = ( _entity: AttachmentEntity, subject: null | attachmentSubjectDto.Type) => {
    if (!subject) {
        return "";
    }

    return subject.organizationId;
}

export const getAttachmentPath = (_entity: AttachmentEntity, subject: null | attachmentSubjectDto.Type) => {
    if (!subject) {
        return "";
    }

    return ticketPath(subject.ticketId);
}