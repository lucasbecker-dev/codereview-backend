import AWS from 'aws-sdk';
import { CreateBucketRequest } from 'aws-sdk/clients/s3';
import fs from 'fs';
import path from 'path';

class S3Service {
    private s3: AWS.S3;
    private bucket: string;

    constructor() {
        // Configure the AWS SDK
        AWS.config.update({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION || 'us-east-1'
        });

        this.s3 = new AWS.S3();
        this.bucket = process.env.AWS_S3_BUCKET_NAME || 'codereview-files';

        // Ensure bucket exists when service is initialized
        this.ensureBucketExists().catch(err => {
            console.error('Error ensuring bucket exists:', err);
        });
    }

    /**
     * Ensure that the S3 bucket exists, create it if it doesn't
     */
    private async ensureBucketExists(): Promise<void> {
        try {
            await this.s3.headBucket({ Bucket: this.bucket }).promise();
            console.log(`Bucket ${this.bucket} already exists`);
        } catch (error: any) {
            if (error.statusCode === 404) {
                console.log(`Bucket ${this.bucket} doesn't exist, creating...`);
                const params: CreateBucketRequest = {
                    Bucket: this.bucket,
                    ACL: 'private'
                };

                await this.s3.createBucket(params).promise();
                console.log(`Bucket ${this.bucket} created successfully`);
            } else {
                console.error(`Error checking bucket ${this.bucket}:`, error);
                throw error;
            }
        }
    }

    /**
     * Upload a file to S3
     * @param file The file to upload (from multer)
     * @param projectId The ID of the project this file belongs to
     * @returns The S3 key of the uploaded file
     */
    async uploadFile(file: Express.Multer.File, projectId: string): Promise<string> {
        const fileContent = fs.readFileSync(file.path);
        const fileName = `${Date.now()}-${file.originalname}`;
        const s3Key = `projects/${projectId}/${fileName}`;

        const params = {
            Bucket: this.bucket,
            Key: s3Key,
            Body: fileContent,
            ContentType: file.mimetype,
            ACL: 'private'
        };

        await this.s3.upload(params).promise();

        // Delete the temp file after upload
        fs.unlinkSync(file.path);

        return s3Key;
    }

    /**
     * Get a file from S3
     * @param s3Key The S3 key of the file to get
     * @returns The file data and content type
     */
    async getFile(s3Key: string): Promise<{ data: Buffer; contentType: string }> {
        const params = {
            Bucket: this.bucket,
            Key: s3Key
        };

        const { Body, ContentType } = await this.s3.getObject(params).promise();

        return {
            data: Body as Buffer,
            contentType: ContentType || 'application/octet-stream'
        };
    }

    /**
     * Get a temporary URL for a file
     * @param s3Key The S3 key of the file
     * @param expirySeconds How long the URL should be valid for (default: 3600 seconds = 1 hour)
     * @returns A signed URL for the file
     */
    getSignedUrl(s3Key: string, expirySeconds = 3600): string {
        const params = {
            Bucket: this.bucket,
            Key: s3Key,
            Expires: expirySeconds
        };

        return this.s3.getSignedUrl('getObject', params);
    }

    /**
     * Delete a file from S3
     * @param s3Key The S3 key of the file to delete
     */
    async deleteFile(s3Key: string): Promise<void> {
        const params = {
            Bucket: this.bucket,
            Key: s3Key
        };

        await this.s3.deleteObject(params).promise();
    }

    /**
     * Delete multiple files from S3
     * @param s3Keys Array of S3 keys to delete
     */
    async deleteFiles(s3Keys: string[]): Promise<void> {
        const params = {
            Bucket: this.bucket,
            Delete: {
                Objects: s3Keys.map(Key => ({ Key })),
                Quiet: false
            }
        };

        await this.s3.deleteObjects(params).promise();
    }
}

export default new S3Service(); 