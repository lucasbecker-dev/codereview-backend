import { Router } from 'express';
import { upload, handleUploadError } from '../middleware/file-upload.middleware';
import { validateFiles } from '../middleware/file-validation.middleware';
import s3Service from '../services/s3.service';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route POST /api/files/upload/:projectId
 * @desc Upload one or more files to S3
 * @access Private
 */
router.post(
    '/upload/:projectId',
    authMiddleware,
    upload.array('files', 20), // Allow up to 20 files
    handleUploadError,
    validateFiles,
    async (req, res) => {
        try {
            const { projectId } = req.params;

            // Make sure files were uploaded
            if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No files uploaded'
                });
            }

            // Upload each file to S3
            const uploadPromises = req.files.map(file => s3Service.uploadFile(file, projectId));
            const s3Keys = await Promise.all(uploadPromises);

            // Return the S3 keys
            return res.status(200).json({
                success: true,
                message: `${s3Keys.length} files uploaded successfully`,
                data: {
                    files: s3Keys
                }
            });
        } catch (error: any) {
            console.error('Error uploading files:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Error uploading files'
            });
        }
    }
);

/**
 * @route GET /api/files/:fileKey
 * @desc Get a file from S3
 * @access Private
 */
router.get('/:fileKey', authMiddleware, async (req, res) => {
    try {
        const { fileKey } = req.params;

        // Generate a signed URL
        const signedUrl = s3Service.getSignedUrl(fileKey);

        return res.status(200).json({
            success: true,
            data: {
                url: signedUrl
            }
        });
    } catch (error: any) {
        console.error('Error getting file:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error getting file'
        });
    }
});

/**
 * @route GET /api/files/download/:fileKey
 * @desc Download a file directly from S3
 * @access Private
 */
router.get('/download/:fileKey', authMiddleware, async (req, res) => {
    try {
        const { fileKey } = req.params;

        // Get the file from S3
        const file = await s3Service.getFile(fileKey);

        // Set the content type and attachment header
        res.setHeader('Content-Type', file.contentType);
        res.setHeader('Content-Disposition', `attachment; filename=${fileKey.split('/').pop()}`);

        // Send the file
        return res.send(file.data);
    } catch (error: any) {
        console.error('Error downloading file:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error downloading file'
        });
    }
});

/**
 * @route DELETE /api/files/:fileKey
 * @desc Delete a file from S3
 * @access Private
 */
router.delete('/:fileKey', authMiddleware, async (req, res) => {
    try {
        const { fileKey } = req.params;

        // Delete the file from S3
        await s3Service.deleteFile(fileKey);

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
});

export default router; 