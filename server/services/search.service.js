/**
 * Search Service
 * 
 * Performs similarity search using MongoDB for vector storage
 */

import DocumentChunk from '../modules/document/documentChunk.model.js';
import Document from '../modules/document/document.schema.js';
import embeddingService from './embedding.service.js';

class SearchService {
  async getApprovedDocIds(organizationId) {
    const docs = await Document.find(
      { organization_id: organizationId, status: "approved", is_deleted: { $ne: true } },
      { _id: 1 }
    ).lean();
    return docs.map((d) => d._id);
  }

  /**
   * Search for similar chunks based on query
   * @param {String} query - Query text
   * @param {String} organizationId - Organization ID for tenant isolation
   * @param {Object} options - Search options
   * @returns {Promise<Array>} - Array of similar chunks with scores
   */
  async search(query, organizationId, options = {}) {
    const {
      topK = 5,
      threshold = 0.75,
      documentId = null
    } = options;

    try {
      // Generate query embedding
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      // Build query filter — only approved documents
      const approvedIds = await this.getApprovedDocIds(organizationId);
      if (approvedIds.length === 0) return [];
      if (documentId && !approvedIds.some((id) => id.toString() === documentId.toString())) return [];
      const filter = {
        organization_id: organizationId,
        document_id: documentId || { $in: approvedIds },
      };

      // Get all chunks for the organization
      const chunks = await DocumentChunk.find(filter).lean();

      // Calculate similarities
      const results = chunks.map(chunk => {
        const similarity = embeddingService.cosineSimilarity(queryEmbedding, chunk.embedding);
        return {
          ...chunk,
          similarity
        };
      });

      // Filter by threshold and sort by similarity
      const filtered = results
        .filter(r => r.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);

      return filtered;
    } catch (error) {
      console.error('Search Error:', error.message);
      throw error;
    }
  }

  /**
   * Search within a specific document
   * @param {String} query - Query text
   * @param {String} documentId - Document ID
   * @param {String} organizationId - Organization ID
   * @param {Object} options - Search options
   * @returns {Promise<Array>} - Array of similar chunks
   */
  async searchInDocument(query, documentId, organizationId, options = {}) {
    return this.search(query, organizationId, {
      ...options,
      documentId
    });
  }

  /**
   * Hybrid search combining text search and vector similarity
   * @param {String} query - Query text
   * @param {String} organizationId - Organization ID
   * @param {Object} options - Search options
   * @returns {Promise<Array>} - Array of similar chunks
   */
  async hybridSearch(query, organizationId, options = {}) {
    const {
      topK = 5,
      threshold = 0.75,
      textWeight = 0.3,
      vectorWeight = 0.7
    } = options;

    try {
      // Vector search
      const vectorResults = await this.search(query, organizationId, {
        topK: topK * 2,
        threshold: threshold * 0.9 // Lower threshold for hybrid
      });

      // Text search (simple keyword matching) — only approved documents
      const approvedIds = await this.getApprovedDocIds(organizationId);
      const textResults = approvedIds.length > 0 ? await DocumentChunk.find({
        organization_id: organizationId,
        document_id: { $in: approvedIds },
        content: { $regex: query.split(/\s+/).join('|'), $options: 'i' }
      }).limit(topK * 2).lean() : [];

      // Combine and score
      const combined = new Map();

      // Add vector results
      vectorResults.forEach(result => {
        combined.set(result._id.toString(), {
          ...result,
          combinedScore: result.similarity * vectorWeight
        });
      });

      // Add text results
      textResults.forEach(result => {
        const id = result._id.toString();
        const textScore = this.calculateTextScore(query, result.content);
        
        if (combined.has(id)) {
          combined.get(id).combinedScore += textScore * textWeight;
        } else {
          combined.set(id, {
            ...result,
            similarity: 0,
            combinedScore: textScore * textWeight
          });
        }
      });

      // Sort by combined score
      const results = Array.from(combined.values())
        .filter(r => r.combinedScore >= threshold)
        .sort((a, b) => b.combinedScore - a.combinedScore)
        .slice(0, topK);

      return results;
    } catch (error) {
      console.error('Hybrid Search Error:', error.message);
      throw error;
    }
  }

  /**
   * Calculate text match score
   * @param {String} query - Query text
   * @param {String} content - Content to match against
   * @returns {Number} - Text score (0-1)
   */
  calculateTextScore(query, content) {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    
    let matches = 0;
    queryWords.forEach(word => {
      if (contentLower.includes(word)) {
        matches++;
      }
    });

    return matches / queryWords.length;
  }
}

export default new SearchService();
