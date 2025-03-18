const AWS = require('aws-sdk');
require('dotenv').config(); // Add this to load environment variables from .env file

// Configure AWS
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// Create S3 service object
const s3 = new AWS.S3();
const bucketName = process.env.AWS_S3_BUCKET_NAME || 'codereview-files';

// Instead of listing all buckets, list objects in your specific bucket
s3.listObjectsV2({ Bucket: bucketName, MaxKeys: 10 }, (err, data) => {
    if (err) {
        console.log("Error accessing bucket:", err);
    } else {
        console.log("Successfully accessed bucket:", bucketName);
        console.log("Contents:", data.Contents);
    }
});