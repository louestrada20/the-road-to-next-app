-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "s3Key" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "thumbnailKey" TEXT;
