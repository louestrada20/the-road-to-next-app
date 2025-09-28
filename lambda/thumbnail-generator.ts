import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { PrismaClient } from '@prisma/client';

const s3 = new S3Client({});
const prisma = new PrismaClient();
const BUCKET = process.env.AWS_BUCKET_NAME as string;

export const handler = async (event: any) => {
  for (const record of event.Records ?? []) {
    const key: string = record.s3.object.key as string;

    // skip thumbnails and non-uploads folder
    if (!key.startsWith('uploads/') || key.includes('/thumbnails/')) continue;

    const [, attachmentId, fileName] = key.split('/');

    // Process only jpg, jpeg, png
    const acceptedExtensions = ['.jpg', '.jpeg', '.png'];
    const fileExt = `.${fileName.toLowerCase().split('.').pop()}`;
    if (!acceptedExtensions.includes(fileExt)) {
      console.log(`Skipping thumbnail generation for unsupported type (${fileExt}): ${fileName}`);
      continue;
    }

    try {
      // fetch original
      const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
      if (!obj.Body) continue;
      const buffer = Buffer.from(await obj.Body.transformToByteArray());

      // create thumbnail 300x300
      const thumbBuffer = await sharp(buffer)
        .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();

      const thumbKey = `uploads/${attachmentId}/thumbnails/${fileName}`;
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: thumbKey,
        Body: thumbBuffer,
        ContentType: 'image/jpeg',
      }));

      // update DB
      // @ts-ignore - columns added via migration
      await prisma.attachment.update({
        where: { id: attachmentId },
        data: {
          thumbnailKey: thumbKey,
          thumbnailUrl: thumbKey,
        } as any,
      });
    } catch (err) {
      console.error('thumbnail-generator error:', err);
    }
  }
  return { status: 'ok' };
}; 