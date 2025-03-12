const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

/**
 * Storage service for handling file uploads
 * In a production environment, this would use AWS S3 or similar cloud storage
 * For the MVP, we'll use local file storage
 */
class StorageService {
    constructor() {
        // Create uploads directory if it doesn't exist
        this.uploadsDir = path.join(__dirname, '../../uploads');
        this.profileImagesDir = path.join(this.uploadsDir, 'profile-images');
        this.projectFilesDir = path.join(this.uploadsDir, 'project-files');

        this._createDirectories();
    }

    /**
     * Create necessary directories for file storage
     * @private
     */
    _createDirectories() {
        if (!fs.existsSync(this.uploadsDir)) {
            fs.mkdirSync(this.uploadsDir);
        }

        if (!fs.existsSync(this.profileImagesDir)) {
            fs.mkdirSync(this.profileImagesDir);
        }

        if (!fs.existsSync(this.projectFilesDir)) {
            fs.mkdirSync(this.projectFilesDir);
        }
    }

    /**
     * Upload a profile image
     * @param {Object} file - The file object from multer
     * @returns {Promise<string>} The URL of the uploaded image
     */
    async uploadProfileImage(file) {
        try {
            // Generate a unique filename
            const filename = `${uuidv4()}-${file.originalname}`;
            const filepath = path.join(this.profileImagesDir, filename);

            // Write the file to disk
            await fs.promises.writeFile(filepath, file.buffer);

            // In a real implementation, this would be the S3 URL
            // For the MVP, we'll use a local URL
            const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
            return `${baseUrl}/uploads/profile-images/${filename}`;
        } catch (error) {
            console.error('Error uploading profile image:', error);
            throw new Error('Failed to upload profile image');
        }
    }

    /**
     * Upload a project file
     * @param {Object} file - The file object from multer
     * @param {string} projectId - The ID of the project
     * @returns {Promise<Object>} The file information
     */
    async uploadProjectFile(file, projectId) {
        try {
            // Create project directory if it doesn't exist
            const projectDir = path.join(this.projectFilesDir, projectId);
            if (!fs.existsSync(projectDir)) {
                fs.mkdirSync(projectDir);
            }

            // Generate a unique filename
            const filename = `${uuidv4()}-${file.originalname}`;
            const filepath = path.join(projectDir, filename);

            // Write the file to disk
            await fs.promises.writeFile(filepath, file.buffer);

            // Determine file language for syntax highlighting
            const language = this._getLanguageFromFilename(file.originalname);

            // In a real implementation, this would be the S3 URL
            // For the MVP, we'll use a local URL
            const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
            const fileUrl = `${baseUrl}/uploads/project-files/${projectId}/${filename}`;

            return {
                filename: file.originalname,
                path: filepath,
                s3Key: filename, // In a real implementation, this would be the S3 key
                fileType: file.mimetype,
                language,
                url: fileUrl
            };
        } catch (error) {
            console.error('Error uploading project file:', error);
            throw new Error('Failed to upload project file');
        }
    }

    /**
     * Get the language from a filename for syntax highlighting
     * @param {string} filename - The filename
     * @returns {string} The language
     * @private
     */
    _getLanguageFromFilename(filename) {
        const extension = path.extname(filename).toLowerCase();

        const languageMap = {
            '.js': 'javascript',
            '.jsx': 'jsx',
            '.ts': 'typescript',
            '.tsx': 'tsx',
            '.html': 'html',
            '.css': 'css',
            '.scss': 'scss',
            '.py': 'python',
            '.java': 'java',
            '.rb': 'ruby',
            '.php': 'php',
            '.go': 'go',
            '.c': 'c',
            '.cpp': 'cpp',
            '.cs': 'csharp',
            '.json': 'json',
            '.md': 'markdown',
            '.sql': 'sql',
            '.sh': 'bash',
            '.yml': 'yaml',
            '.yaml': 'yaml',
            '.xml': 'xml',
            '.txt': 'plaintext'
        };

        return languageMap[extension] || 'plaintext';
    }

    /**
     * Delete a file
     * @param {string} filepath - The path to the file
     * @returns {Promise<void>}
     */
    async deleteFile(filepath) {
        try {
            await fs.promises.unlink(filepath);
        } catch (error) {
            console.error('Error deleting file:', error);
            throw new Error('Failed to delete file');
        }
    }
}

module.exports = new StorageService(); 