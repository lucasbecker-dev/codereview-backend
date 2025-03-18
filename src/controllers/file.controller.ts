import { Request, Response } from 'express';
import File from '../models/file.model';
import s3Service from '../services/s3.service';
import { s3Config } from '../config/s3';

/**
 * Upload one or more files to S3 and store metadata in the database
 * @route POST /api/files/upload/:projectId
 */
export const uploadFiles = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const userId = req.user?.id; // Assuming auth middleware adds user to req

        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        const uploadedFiles = [];

        // Process each file
        for (const file of req.files) {
            // Upload to S3
            const s3Key = await s3Service.uploadFile(file, projectId);

            // Generate S3 URL (either direct or signed)
            const s3Url = s3Config.baseUrl
                ? `${s3Config.baseUrl}/${s3Key}`
                : s3Service.getSignedUrl(s3Key, 86400); // 24 hour link

            // Extract file path (relative to project)
            const filePath = file.originalname.includes('/')
                ? file.originalname.substring(0, file.originalname.lastIndexOf('/'))
                : '';

            // Create file record in database
            const newFile = await File.create({
                project: projectId,
                filename: file.originalname.split('/').pop(),
                path: filePath,
                fileType: file.originalname.substring(file.originalname.lastIndexOf('.')),
                s3Key,
                s3Url,
                size: file.size,
                mimeType: file.mimetype,
                uploadedBy: userId
            });

            uploadedFiles.push(newFile);
        }

        return res.status(201).json({
            success: true,
            message: `${uploadedFiles.length} files uploaded successfully`,
            data: {
                files: uploadedFiles
            }
        });
    } catch (error: any) {
        console.error('Error uploading files:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error uploading files'
        });
    }
};

/**
 * Get a single file by its ID
 * @route GET /api/files/:id
 */
export const getFile = async (req: Request, res: Response) => {
    try {
        const fileId = req.params.id;

        const file = await File.findById(fileId);

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Generate a fresh signed URL (in case the stored one expired)
        const signedUrl = s3Service.getSignedUrl(file.s3Key);

        return res.status(200).json({
            success: true,
            data: {
                file: {
                    ...file.toObject(),
                    signedUrl
                }
            }
        });
    } catch (error: any) {
        console.error('Error getting file:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error getting file'
        });
    }
};

/**
 * Get files by project ID
 * @route GET /api/files/project/:projectId
 */
export const getFilesByProject = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;

        const files = await File.find({ project: projectId });

        // Generate fresh signed URLs for each file
        const filesWithUrls = files.map(file => ({
            ...file.toObject(),
            signedUrl: s3Service.getSignedUrl(file.s3Key)
        }));

        return res.status(200).json({
            success: true,
            data: {
                files: filesWithUrls
            }
        });
    } catch (error: any) {
        console.error('Error getting project files:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error getting project files'
        });
    }
};

/**
 * Download a file directly
 * @route GET /api/files/download/:fileKey
 */
export const downloadFile = async (req: Request, res: Response) => {
    try {
        const { fileKey } = req.params;

        // First check if the file exists in our database
        const file = await File.findOne({ s3Key: fileKey });

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Get the file from S3
        const s3File = await s3Service.getFile(fileKey);

        // Set appropriate headers
        res.setHeader('Content-Type', s3File.contentType);
        res.setHeader('Content-Disposition', `attachment; filename=${file.filename}`);

        // Send the file data
        return res.send(s3File.data);
    } catch (error: any) {
        console.error('Error downloading file:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error downloading file'
        });
    }
};

/**
 * Delete a file
 * @route DELETE /api/files/:id
 */
export const deleteFile = async (req: Request, res: Response) => {
    try {
        const fileId = req.params.id;

        const file = await File.findById(fileId);

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Delete from S3
        await s3Service.deleteFile(file.s3Key);

        // Delete from database
        await file.deleteOne();

        return res.status(200).json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error: any) {
        console.error('Error deleting file:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error deleting file'
        });
    }
};

/**
 * Get file content
 * @route GET /api/files/content/:id
 */
export const getFileContent = async (req: Request, res: Response) => {
    try {
        const fileId = req.params.id;

        const file = await File.findById(fileId);

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Get the file from S3
        const s3File = await s3Service.getFile(file.s3Key);

        // Convert buffer to string for text files
        const isTextFile = [
            'text/', 'application/json', 'application/javascript', 'application/typescript',
            'application/xml', 'application/x-sh', 'application/x-httpd-php'
        ].some(type => s3File.contentType.includes(type));

        let content = '';

        if (isTextFile) {
            content = s3File.data.toString('utf-8');
        } else {
            return res.status(400).json({
                success: false,
                message: 'File is not a text file and cannot be displayed'
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                content,
                language: file.language,
                filename: file.filename
            }
        });
    } catch (error: any) {
        console.error('Error getting file content:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error getting file content'
        });
    }
}; 