import {S3Client} from "@aws-sdk/client-s3";

// AWS validation will happen at runtime when S3 operations are attempted

const s3 = new S3Client({
    region: process.env.AWS_REGION || 'us-west-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy',
    },
});

export {s3};
