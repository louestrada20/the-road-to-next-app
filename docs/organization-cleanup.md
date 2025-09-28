# Organization Deletion Cleanup System

## Overview

When an organization is deleted, the system automatically cleans up all associated S3 objects to prevent orphaned files and unnecessary storage costs.

## How It Works

### 1. Organization Deletion Event

When an organization is deleted via the `deleteOrganization` action, the system:

1. **Fetches organization details** before deletion
2. **Triggers an Inngest event** (`app/organization.deleted`) with organization data
3. **Deletes the organization** from the database (cascading to tickets, attachments, etc.)

### 2. S3 Cleanup Process

The `organizationDeletedEvent` Inngest function:

1. **Lists all S3 objects** with the organization prefix (`{organizationId}/`)
2. **Deletes objects in batches** of 1000 (S3 API limit)
3. **Handles pagination** for large numbers of objects
4. **Logs progress** for monitoring and debugging

### 3. Seed Cleanup

The database seed script (`prisma/seed.ts`) also includes S3 cleanup:

- **Cleans up all existing organizations** before reseeding
- **Prevents accumulation** of orphaned S3 objects during development
- **Continues seeding** even if S3 cleanup fails

## File Structure

```
src/features/organization/
├── actions/
│   └── delete-organization.ts          # Modified to trigger cleanup event
├── events/
│   └── event-organization.deleted.ts   # New Inngest event handler
└── ...
```

## S3 Key Structure

Files are stored in S3 with the following structure:
```
{organizationId}/{ticketId}/{fileName}-{attachmentId}
{organizationId}/{ticketId}/thumbnails/{fileName}-{attachmentId}
```

The cleanup process deletes all objects with the `{organizationId}/` prefix.

## Error Handling

- **S3 cleanup failures** are logged but don't prevent organization deletion
- **Seed cleanup failures** are logged but don't stop the seeding process
- **Batch deletion** ensures large organizations don't timeout

## Monitoring

The system logs:
- Number of attachments found
- Number of S3 objects to delete
- Batch deletion progress
- Success/failure status

## Benefits

1. **Prevents storage costs** from orphaned files
2. **Maintains data consistency** between database and S3
3. **Handles large organizations** efficiently with batching
4. **Works during development** with seed cleanup
5. **Non-blocking** - organization deletion succeeds even if cleanup fails

## Usage

### Manual Organization Deletion
```typescript
// This automatically triggers S3 cleanup
await deleteOrganization(organizationId);
```

### Database Reseeding
```bash
# This includes S3 cleanup for all existing organizations
npm run prisma-seed
```

## Configuration

Ensure these environment variables are set:
- `AWS_BUCKET_NAME` - S3 bucket name
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_REGION` - AWS region 