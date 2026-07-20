/**
 * Secure Download Service
 * 
 * Generates secure, time-limited download URLs without exposing JWT tokens
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';

class DownloadService {
  constructor() {
    this.secret = process.env.DOWNLOAD_SECRET || crypto.randomBytes(32).toString('hex');
    this.expirySeconds = 15 * 60; // 15 minutes
  }

  /**
   * Generate a secure download token
   * @param {String} documentId - Document ID
   * @param {String} userId - User ID requesting download
   * @returns {String} - Secure token
   */
  generateDownloadToken(documentId, userId) {
    const payload = {
      documentId,
      userId,
      exp: Math.floor(Date.now() / 1000) + this.expirySeconds,
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, this.secret);
  }

  /**
   * Verify a download token
   * @param {String} token - Download token
   * @returns {Object|null} - Decoded payload or null if invalid
   */
  verifyDownloadToken(token) {
    try {
      return jwt.verify(token, this.secret);
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate a secure download URL
   * @param {String} documentId - Document ID
   * @param {String} userId - User ID requesting download
   * @param {String} baseUrl - Base URL of the API
   * @returns {String} - Secure download URL
   */
  generateDownloadUrl(documentId, userId, baseUrl) {
    const token = this.generateDownloadToken(documentId, userId);
    const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
    return `${cleanBaseUrl}/documents/${documentId}/download?token=${token}`;
  }

  /**
   * Check if a download request is authorized
   * @param {String} token - Download token
   * @param {String} documentId - Document ID from request
   * @param {String} userId - User ID from request
   * @returns {Boolean} - Whether the request is authorized
   */
  isAuthorized(token, documentId, userId) {
    const payload = this.verifyDownloadToken(token);
    
    if (!payload) {
      return false;
    }

    // Verify the token matches the requested document and user
    return payload.documentId === documentId && payload.userId === userId;
  }
}

export default new DownloadService();
