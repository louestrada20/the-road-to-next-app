import { NextRequest, NextResponse } from "next/server";
import { getAuthOrRedirect } from "@/features/auth/queries/get-auth-or-redirect";
import { s3 } from "@/lib/aws";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as attachmentData from "@/features/attachments/data";
import { fromAttachment } from "@/features/attachments/dto/attachment-subject-dto";
import { getClientIp } from "@/lib/get-client-ip";
import { limitIp } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  const ip = await getClientIp();
  const res = await limitIp(ip, "attachments", 100, "1 m");   
  if (!res.success) {
      return new Response("Too many requests", {status: 429});
  }
  await getAuthOrRedirect();

  const { attachmentId } = await params;
  const { searchParams } = new URL(request.url);
  const isThumbnail = searchParams.get('thumbnail') === 'true';
  
  // Get attachment with all possible authorization data
  // The getAttachment function will only populate relations that exist
  const attachment = await attachmentData.getAttachment({ 
    id: attachmentId,
    options: {
      includeTicket: true,
      includeComment: true,
      includeCommentWithTicket: true
    }
  });

  // Get attachment subject for authorization using DTO
  const attachmentSubject = fromAttachment(attachment);

  if (!attachmentSubject) {
    return NextResponse.json({ error: 'Invalid attachment subject' }, { status: 400 });
  }

  // TODO: Add authorization checks here using attachmentSubject
  // - Check if user belongs to organization (attachmentSubject.organizationId)
  // - Check if user has access to ticket/comment
  // - Check membership permissions

  const key = isThumbnail ? (attachment.thumbnailKey ?? attachment.s3Key) : attachment.s3Key;
  if (!key) {
    return NextResponse.json({ error: 'File key not found' }, { status: 404 });
  }

  // Generate presigned URL
  const fileName = searchParams.get("fileName");
  
  if (fileName) {
    // JSON response for frontend (thumbnails, file displays)
    const fileUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key,
      }),
      { expiresIn: 5 * 60 }
    );
    
    return NextResponse.json({ url: fileUrl });
  } else {
    // Direct download with proper filename
    const fileUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key,
        // Force download with the original filename
        ResponseContentDisposition: `attachment; filename="${attachment.name}"`,
      }),
      { expiresIn: 5 * 60 }
    );
    
    return NextResponse.redirect(fileUrl, 302);
  }
}