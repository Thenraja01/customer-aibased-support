import axios from 'axios';
import groqService from './grok.service.js';
import geminiService from './gemini.service.js';

class EmbeddingService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.defaultProvider = process.env.DEFAULT_EMBED_PROVIDER || 'openai';
    this.defaultDimension = parseInt(process.env.RAG_EMBED_DIM) || 1536;
  }

  /**
   * Get provider from organization config or default
   * @param {Object} organization - Organization document
   * @returns {String} - Provider name
   */
  getProvider(organization = null) {
    return organization?.ai_config?.provider || this.defaultProvider;
  }


  getApiKey(organization = null) {
    return organization?.ai_config?.api_keys?.openai_api_key || this.openaiApiKey;
  }


  async generateEmbeddings(texts, organization = null) {
    const provider = this.getProvider(organization);

    switch (provider) {
      case 'groq':
        const groqResult = await groqService.generateEmbeddings(texts, organization);
        if (groqResult.success) {
          return groqResult.embeddings;
        }
        console.warn('Groq embeddings failed, falling back to simple embeddings');
        return Promise.all(texts.map(text => this.generateSimpleEmbedding(text)));

      case 'google':
        const geminiResult = await geminiService.generateEmbeddings(texts, organization);
        if (geminiResult.success) {
          return geminiResult.embeddings;
        }
        console.warn('Gemini embeddings failed, falling back to simple embeddings');
        return Promise.all(texts.map(text => this.generateSimpleEmbedding(text)));

      case 'openai':
        if (this.getApiKey(organization)) {
          return this.generateOpenAIEmbeddings(texts, organization);
        }
        console.warn('OpenAI API key not configured, falling back to simple embeddings');
        return Promise.all(texts.map(text => this.generateSimpleEmbedding(text)));

      default:
        return Promise.all(texts.map(text => this.generateSimpleEmbedding(text)));
    }
  }
  async generateOpenAIEmbeddings(texts, organization = null) {
    try {
      const apiKey = this.getApiKey(organization);
      const model = organization?.ai_config?.embedding_model || 'text-embedding-3-small';
      const dimension = organization?.ai_config?.chunk_size || this.defaultDimension;

      const response = await axios.post(
        'https://api.openai.com/v1/embeddings',
        {
          model,
          input: texts,
          dimensions: dimension
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data.map(item => item.embedding);
    } catch (error) {
      console.error('OpenAI Batch Embedding Error:', error.response?.data || error.message);
      throw new Error('Failed to generate embeddings with OpenAI');
    }
  }

  generateSimpleEmbedding(text) {
    // Simple TF-IDF style embedding as fallback
    const words = text.toLowerCase().split(/\s+/);
    const wordFreq = {};
    
    // Calculate word frequencies
    words.forEach(word => {
      if (word.length > 2) { // Skip very short words
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    // Create fixed-size vector (256 dimensions)
    const vector = new Array(256).fill(0);
    
    for (const word in wordFreq) {
      const hash = this.simpleHash(word);
      const position = hash % 256;
      vector[position] += wordFreq[word] / words.length;
    }

    // Normalize vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(val => magnitude > 0 ? val / magnitude : 0);
  }

  /**
   * Simple hash function for word hashing
   * @param {String} str - String to hash
   * @returns {Number} - Hash value
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param {Array} vec1 - First vector
   * @param {Array} vec2 - Second vector
   * @returns {Number} - Cosine similarity (0-1)
   */
  cosineSimilarity(vec1, vec2) {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      magnitude1 += vec1[i] * vec1[i];
      magnitude2 += vec2[i] * vec2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Get embedding dimension for a provider
   * @param {Object} organization - Organization document for config
   * @returns {Number} - Embedding dimension
   */
  getDimension(organization = null) {
    const provider = this.getProvider(organization);
    
    switch (provider) {
      case 'groq':
        return 768; // nomic-embed-text-v1.5
      case 'google':
        return 768; // text-embedding-004
      case 'openai':
        return organization?.ai_config?.chunk_size || this.defaultDimension;
      default:
        return 256; // simple embedding
    }
  }
}

export default new EmbeddingService();
