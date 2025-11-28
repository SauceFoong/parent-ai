const { getStorage } = require('../config/firebaseAdmin');
const logger = require('../utils/logger');
const axios = require('axios');

class FirebaseStorageService {
  constructor() {
    this.storage = null;
    this.bucket = null;
  }

  /**
   * Initialize Firebase Storage
   */
  initialize() {
    if (!this.storage) {
      this.storage = getStorage();
      this.bucket = this.storage.bucket();
    }
    return this.bucket;
  }

  /**
   * Upload file from buffer or base64
   */
  async uploadFile(filePath, content, options = {}) {
    try {
      const bucket = this.initialize();
      const file = bucket.file(filePath);

      let buffer;
      
      // Handle different content types
      if (Buffer.isBuffer(content)) {
        buffer = content;
      } else if (typeof content === 'string') {
        // Check if it's base64
        if (content.startsWith('data:')) {
          const matches = content.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches) {
            buffer = Buffer.from(matches[2], 'base64');
            options.contentType = options.contentType || matches[1];
          }
        } else {
          buffer = Buffer.from(content);
        }
      }

      await file.save(buffer, {
        metadata: {
          contentType: options.contentType || 'application/octet-stream',
          ...options.metadata,
        },
        public: options.public || false,
      });

      // Make file publicly accessible if requested
      if (options.public) {
        await file.makePublic();
      }

      // Get download URL
      const downloadURL = await this.getDownloadURL(filePath);

      logger.info(`File uploaded to Firebase Storage: ${filePath}`);
      
      return {
        filePath,
        downloadURL,
        bucket: this.bucket.name,
      };
    } catch (error) {
      logger.error(`Error uploading file to Firebase Storage: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upload file from URL
   */
  async uploadFromURL(filePath, url, options = {}) {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);
      
      // Detect content type from response headers
      const contentType = response.headers['content-type'] || options.contentType;
      
      return await this.uploadFile(filePath, buffer, {
        ...options,
        contentType,
      });
    } catch (error) {
      logger.error(`Error uploading file from URL: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get download URL for a file
   */
  async getDownloadURL(filePath) {
    try {
      const bucket = this.initialize();
      const file = bucket.file(filePath);
      
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      
      return url;
    } catch (error) {
      logger.error(`Error getting download URL: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(filePath) {
    try {
      const bucket = this.initialize();
      await bucket.file(filePath).delete();
      
      logger.info(`File deleted from Firebase Storage: ${filePath}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting file: ${error.message}`);
      throw error;
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(prefix = '', options = {}) {
    try {
      const bucket = this.initialize();
      const [files] = await bucket.getFiles({
        prefix,
        maxResults: options.limit || 100,
      });

      const fileList = files.map(file => ({
        name: file.name,
        size: file.metadata.size,
        contentType: file.metadata.contentType,
        updated: file.metadata.updated,
      }));

      return fileList;
    } catch (error) {
      logger.error(`Error listing files: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(filePath) {
    try {
      const bucket = this.initialize();
      const file = bucket.file(filePath);
      const [metadata] = await file.getMetadata();
      
      return {
        name: metadata.name,
        size: metadata.size,
        contentType: metadata.contentType,
        created: metadata.timeCreated,
        updated: metadata.updated,
        bucket: metadata.bucket,
      };
    } catch (error) {
      logger.error(`Error getting file metadata: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath) {
    try {
      const bucket = this.initialize();
      const [exists] = await bucket.file(filePath).exists();
      return exists;
    } catch (error) {
      logger.error(`Error checking file existence: ${error.message}`);
      return false;
    }
  }
}

module.exports = new FirebaseStorageService();

