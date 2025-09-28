# Default Attachments

This directory contains default images that will be automatically attached to the first ticket when seeding the database.

## Required Files

Add the following images to this directory:

1. **sample-image-1.jpg** - A JPEG image (recommended size: 800x600 or larger)
2. **sample-image-2.png** - A PNG image (recommended size: 800x600 or larger)

## How It Works

When you run `npm run prisma-seed`, the seed script will:

1. Read these images from this directory
2. Upload them to S3 as attachments for the first ticket
3. Generate thumbnails automatically via Inngest background processing
4. Display them in the UI with thumbnail previews

## File Requirements

- **Format**: JPEG or PNG
- **Size**: Recommended minimum 800x600 pixels for good thumbnail quality
- **File Size**: Keep under 4MB (matches your app's file size limit)
- **Naming**: Must be exactly `sample-image-1.jpg` and `sample-image-2.png`

## Usage

1. Add your two images to this directory with the exact names above
2. Run `npm run prisma-seed` to seed the database
3. The images will automatically appear as attachments on the first ticket

## Troubleshooting

If the seed fails with "file not found" errors:

1. Make sure both files exist in this directory
2. Check that the filenames match exactly (case-sensitive)
3. Verify the files are valid image formats
4. Ensure the files are readable by the Node.js process 