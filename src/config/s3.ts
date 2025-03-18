/**
 * AWS S3 Configuration
 * 
 * This file contains configuration for AWS S3 bucket used for file storage.
 * For this to work, the following environment variables must be set:
 * - AWS_ACCESS_KEY_ID: The AWS access key ID
 * - AWS_SECRET_ACCESS_KEY: The AWS secret access key
 * - AWS_REGION: The AWS region (optional, defaults to us-east-1)
 * - AWS_S3_BUCKET_NAME: The name of the S3 bucket (optional, defaults to codereview-files)
 */

// S3 Configuration
export const s3Config = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    bucketName: process.env.AWS_S3_BUCKET_NAME || 'codereview-files',

    // Maximum file size in bytes (10MB)
    maxFileSize: 10 * 1024 * 1024,

    // Base URL for files (if using CloudFront or custom domain)
    // Example: https://files.your-domain.com/
    baseUrl: process.env.AWS_S3_BASE_URL || ''
};

// S3 Bucket Policy Settings
export const bucketPolicy = {
    // Default ACL for the bucket is private
    // Files are accessed through signed URLs or via API
    acl: 'private',

    // CORS configuration to allow frontend access
    corsConfiguration: {
        AllowedHeaders: ['*'],
        AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE'],
        AllowedOrigins: [process.env.FRONTEND_URL || '*'],
        MaxAgeSeconds: 3000
    }
};

// Instructions for setting up AWS S3 bucket manually
/**
 * Manual S3 Setup Instructions:
 * 
 * 1. Sign in to AWS Management Console
 * 2. Navigate to S3 service
 * 3. Create a new bucket with name "codereview-files" (or your preferred name)
 * 4. Choose the appropriate region
 * 5. Block all public access (recommended for security)
 * 6. Enable versioning (optional but recommended for file history)
 * 7. Configure CORS settings in bucket permissions:
 *    [
 *      {
 *        "AllowedHeaders": ["*"],
 *        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
 *        "AllowedOrigins": ["https://your-frontend-url.com"],
 *        "ExposeHeaders": [],
 *        "MaxAgeSeconds": 3000
 *      }
 *    ]
 * 8. Create an IAM user with S3 access:
 *    - Navigate to IAM service
 *    - Create a new user
 *    - Attach the "AmazonS3FullAccess" policy or create a custom policy
 *    - Get the Access Key ID and Secret Access Key
 * 9. Set the environment variables in your backend deployment:
 *    - AWS_ACCESS_KEY_ID
 *    - AWS_SECRET_ACCESS_KEY
 *    - AWS_REGION
 *    - AWS_S3_BUCKET_NAME
 */ 