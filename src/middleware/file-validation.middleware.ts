import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { s3Config } from '../config/s3';

/**
 * Middleware to validate file types and sizes
 * This is an additional layer of validation after multer's initial check
 */
export const validateFiles = (req: Request, res: Response, next: NextFunction) => {
    if (!req.files && !req.file) {
        return next();
    }

    // Allowed file extensions
    const allowedExtensions = [
        // Code files
        '.js', '.jsx', '.ts', '.tsx', '.py', '.rb', '.java', '.c', '.cpp', '.cs', '.php', '.html', '.css', '.scss',
        // Text files
        '.txt', '.md', '.json', '.xml', '.csv',
        // Documentation files
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        // Image files
        '.jpg', '.jpeg', '.png', '.gif', '.svg'
    ];

    // Max file size (10MB by default from config)
    const maxSize = s3Config.maxFileSize;

    // Function to validate a single file
    const validateFile = (file: Express.Multer.File) => {
        // Check file size
        if (file.size > maxSize) {
            throw new Error(`File ${file.originalname} exceeds maximum size of ${maxSize / (1024 * 1024)}MB`);
        }

        // Check file extension
        const ext = path.extname(file.originalname).toLowerCase();
        if (!allowedExtensions.includes(ext)) {
            throw new Error(`File type ${ext} is not allowed. Allowed types: ${allowedExtensions.join(', ')}`);
        }

        return true;
    };

    try {
        // If there's a single file
        if (req.file) {
            validateFile(req.file);
        }

        // If there are multiple files
        if (req.files) {
            // If req.files is an array
            if (Array.isArray(req.files)) {
                req.files.forEach(validateFile);
            }
            // If req.files is an object with arrays (from multer fields)
            else {
                Object.keys(req.files).forEach(key => {
                    (req.files as Record<string, Express.Multer.File[]>)[key].forEach(validateFile);
                });
            }
        }

        next();
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message || 'File validation failed'
        });
    }
}; 