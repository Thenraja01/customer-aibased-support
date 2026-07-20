

import crypto from 'crypto';

class ChunkingService {
  constructor() {
    this.defaultChunkSize = 512; // tokens
    this.defaultChunkOverlap = 50; // tokens
  }
  chunkText(text, options = {}) {
    const {
      chunkSize = this.defaultChunkSize,
      chunkOverlap = this.defaultChunkOverlap,
      preserveSentence = true
    } = options;

    if (!text || text.trim().length === 0) {
      return [];
    }

    const normalizedText = this.normalizeText(text);
    let sentences = [];
    if (preserveSentence) {
      sentences = this.splitIntoSentences(normalizedText);
    } else {
      sentences = normalizedText.split(/\s+/).map(word => word + ' ');
    }

    const chunks = [];
    let currentChunk = '';
    let currentTokens = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const sentenceTokens = this.estimateTokens(sentence);

      if (currentTokens + sentenceTokens > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        const overlapSentences = this.getOverlapSentences(sentences, i, chunkOverlap);
        currentChunk = overlapSentences.join('');
        currentTokens = this.estimateTokens(currentChunk);
      }

      currentChunk += sentence;
      currentTokens += sentenceTokens;
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks.map((chunk, index) => ({
      index,
      content: chunk,
      content_hash: this.generateHash(chunk),
      token_count: this.estimateTokens(chunk)
    }));
  }
  normalizeText(text) {
    return text
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\t/g, ' ')      // Replace tabs with spaces
      .replace(/\s+/g, ' ')     // Collapse multiple spaces
      .trim();
  }
  splitIntoSentences(text) {
    // Simple sentence splitting on . ! ? followed by space or end
    const sentenceRegex = /(?<=[.!?])\s+(?=[A-Z])|(?<=[.!?])\s*$/g;
    const sentences = text.split(sentenceRegex).filter(s => s.trim().length > 0);
    
    return sentences.map(s => s.trim() + ' ');
  }
  getOverlapSentences(sentences, currentIndex, overlapTokens) {
    const overlapSentences = [];
    let currentTokens = 0;
    
    // Work backwards from current index
    for (let i = currentIndex - 1; i >= 0 && currentTokens < overlapTokens; i--) {
      const sentence = sentences[i];
      const sentenceTokens = this.estimateTokens(sentence);
      
      if (currentTokens + sentenceTokens <= overlapTokens) {
        overlapSentences.unshift(sentence);
        currentTokens += sentenceTokens;
      } else {
        break;
      }
    }
    
    return overlapSentences;
  }

  estimateTokens(text) {
    // Rough approximation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
  generateHash(content) {
    return crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');
  }
  async extractTextFromPDF(buffer) {
    throw new Error('PDF extraction not implemented. Install pdfjs-dist.');
  }
  async extractTextFromDOCX(buffer) {

    throw new Error('DOCX extraction not implemented. Install mammoth.');
  }
  async extractText(buffer, mimetype) {
    switch (mimetype) {
      case 'application/pdf':
        return this.extractTextFromPDF(buffer);
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return this.extractTextFromDOCX(buffer);
      case 'text/plain':
        return buffer.toString('utf-8');
      default:
        throw new Error(`Unsupported mimetype for text extraction: ${mimetype}`);
    }
  }
}

export default new ChunkingService();
