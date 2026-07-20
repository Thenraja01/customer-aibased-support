/**
 * RAG Service
 * 
 * Manages the Retrieval-Augmented Generation pipeline using MongoDB for storage
 * Supports organization-specific configuration
 */

import DocumentChunk from '../modules/document/documentChunk.model.js';
import Document from '../modules/document/document.schema.js';
import Organization from '../modules/organization/organization.schema.js';
import chunkingService from './chunking.service.js';
import embeddingService from './embedding.service.js';
import searchService from './search.service.js';

class RAGService {
  /**
   * Process a document for RAG ingestion
   * @param {String} documentId - Document ID
   * @param {String} organizationId - Organization ID
   * @param {Buffer} fileBuffer - File buffer
   * @param {String} mimetype - File mimetype
   * @returns {Promise<Object>} - Processing result
   */
  async processDocument(documentId, organizationId, fileBuffer, mimetype) {
    try {
      // Get organization for configuration
      const organization = await Organization.findById(organizationId);
      
      // Update document status to processing
      await Document.findByIdAndUpdate(documentId, {
        rag_status: 'processing',
        rag_queued_at: new Date()
      });

      // Extract text from file (placeholder - currently supports plain text)
      let text;
      if (mimetype === 'text/plain') {
        text = fileBuffer.toString('utf-8');
      } else {
        // For PDF/DOCX, would use pdfjs/mammoth libraries
        // For now, skip non-text files
        throw new Error('Text extraction not implemented for this file type');
      }

      // Get chunking config from organization or defaults
      const chunkSize = organization?.ai_config?.chunk_size || 512;
      const chunkOverlap = organization?.ai_config?.chunk_overlap || 50;

      // Chunk the text
      const chunks = chunkingService.chunkText(text, {
        chunkSize,
        chunkOverlap,
        preserveSentence: true
      });

      // Generate embeddings for all chunks using organization config
      const chunkTexts = chunks.map(c => c.content);
      const embeddings = await embeddingService.generateEmbeddings(chunkTexts, organization);

      // Store chunks in MongoDB with embeddings
      const chunkDocs = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunkDoc = await DocumentChunk.create({
          document_id: documentId,
          organization_id: organizationId,
          chunk_index: chunks[i].index,
          content: chunks[i].content,
          content_hash: chunks[i].content_hash,
          token_count: chunks[i].token_count,
          embedding: embeddings[i],
          metadata: {}
        });
        chunkDocs.push(chunkDoc._id);
      }

      // Update document with chunk IDs and status
      await Document.findByIdAndUpdate(documentId, {
        rag_status: 'completed',
        processed_at: new Date(),
        total_chunks: chunks.length,
        chunk_ids: chunkDocs
      });

      return {
        success: true,
        chunks_processed: chunks.length,
        chunk_ids: chunkDocs
      };
    } catch (error) {
      console.error('RAG Processing Error:', error.message);
      
      // Update document with error
      await Document.findByIdAndUpdate(documentId, {
        rag_status: 'failed',
        rag_error: error.message
      });

      throw error;
    }
  }

  /**
   * Query the knowledge base using RAG
   * @param {String} query - User query
   * @param {String} organizationId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - RAG response with context
   */
  async query(query, organizationId, options = {}) {
    try {
      // Get organization for configuration
      const organization = await Organization.findById(organizationId);
      
      const {
        topK = organization?.ai_config?.top_k_retrieval || 5,
        threshold = organization?.ai_config?.similarity_threshold || 0.75,
        documentId = null
      } = options;

      // Search for relevant chunks
      const relevantChunks = await searchService.search(query, organizationId, {
        topK,
        threshold,
        documentId
      });

      if (relevantChunks.length === 0) {
        return {
          success: true,
          has_context: false,
          chunks: [],
          context: '',
          fallback_message: organization?.ai_config?.fallback_message
        };
      }

      // Build context from chunks
      const context = relevantChunks
        .map((chunk, index) => `[Chunk ${index + 1}]\n${chunk.content}`)
        .join('\n\n---\n\n');

      return {
        success: true,
        has_context: true,
        chunks: relevantChunks,
        context,
        chunk_count: relevantChunks.length
      };
    } catch (error) {
      console.error('RAG Query Error:', error.message);
      throw error;
    }
  }

  /**
   * Delete all chunks for a document
   * @param {String} documentId - Document ID
   * @returns {Promise<Object>} - Deletion result
   */
  async deleteDocumentChunks(documentId) {
    try {
      const result = await DocumentChunk.deleteMany({ document_id });
      return {
        success: true,
        deleted_count: result.deletedCount
      };
    } catch (error) {
      console.error('Chunk Deletion Error:', error.message);
      throw error;
    }
  }

  /**
   * Get chunks for a document
   * @param {String} documentId - Document ID
   * @returns {Promise<Array>} - Array of chunks
   */
  async getDocumentChunks(documentId) {
    try {
      const chunks = await DocumentChunk.find({ document_id })
        .sort({ chunk_index: 1 })
        .lean();
      return chunks;
    } catch (error) {
      console.error('Get Chunks Error:', error.message);
      throw error;
    }
  }

  /**
   * Get RAG status for a document
   * @param {String} documentId - Document ID
   * @returns {Promise<Object>} - RAG status info
   */
  async getDocumentStatus(documentId) {
    try {
      const doc = await Document.findById(documentId).select(
        'rag_status rag_error rag_queued_at processed_at total_chunks chunk_ids'
      ).lean();
      
      if (!doc) {
        throw new Error('Document not found');
      }

      return {
        success: true,
        status: doc.rag_status,
        error: doc.rag_error,
        queued_at: doc.rag_queued_at,
        processed_at: doc.processed_at,
        total_chunks: doc.total_chunks,
        chunk_count: doc.chunk_ids?.length || 0
      };
    } catch (error) {
      console.error('Get Status Error:', error.message);
      throw error;
    }
  }
}

export default new RAGService();
